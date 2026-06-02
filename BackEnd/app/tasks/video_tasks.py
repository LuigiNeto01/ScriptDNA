import asyncio
import logging
import os
import tempfile
import uuid
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from yt_dlp import YoutubeDL

from app.agents.analysis_agent import AnalysisAgent
from app.agents.transcription_agent import TranscriptionAgent, TranscriptUnavailableError
from app.core.celery_app import celery_app
from app.core.openai_client import get_openai_client
from app.db.session import make_session_factory
from app.models import (
    ScriptBeat,
    SegmentTechnique,
    Technique,
    TranscriptSegment,
    Video,
    VideoStatus,
)

logger = logging.getLogger(__name__)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


def _backoff_delay(retries: int, base: int = 10) -> int:
    """Exponential backoff: 10s, 30s, 90s."""
    return base * (3 ** retries)


@celery_app.task(bind=True, max_retries=3)
def process_video_upload(self, video_id: str, file_path: str):
    logger.info("process_video_upload started", extra={"task_id": self.request.id, "step": "start"})
    try:
        _run_async(_process_upload(self, video_id, file_path))
    except Exception as exc:
        logger.error("process_video_upload failed", extra={"task_id": self.request.id, "error": str(exc)})
        _run_async(_set_error(video_id))
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


@celery_app.task(bind=True, max_retries=3)
def process_video_text(self, video_id: str, text: str):
    logger.info("process_video_text started", extra={"task_id": self.request.id, "step": "start"})
    try:
        _run_async(_process_text(self, video_id, text))
    except Exception as exc:
        logger.error("process_video_text failed", extra={"task_id": self.request.id, "error": str(exc)})
        _run_async(_set_error(video_id))
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


@celery_app.task(bind=True, max_retries=3)
def process_video_url(self, video_id: str, url: str):
    logger.info("process_video_url started", extra={"task_id": self.request.id, "step": "start"})
    try:
        _run_async(_process_url(self, video_id, url))
    except Exception as exc:
        error_msg = str(exc)
        logger.error("process_video_url failed", extra={"task_id": self.request.id, "error": error_msg})
        _run_async(_set_error(video_id))
        # Erros permanentes nao melhoram com retry
        _PERMANENT_ERRORS = ("HTTP Error 400", "HTTP Error 401", "HTTP Error 403",
                             "Sign in", "bot", "429", "Too Many Requests")
        if any(code in error_msg for code in _PERMANENT_ERRORS):
            raise exc
        raise self.retry(exc=exc, countdown=_backoff_delay(self.request.retries))


def _report_progress(task, progress: float, current_step: str):
    task.update_state(
        state="PROGRESS",
        meta={"progress": progress, "current_step": current_step},
    )


async def _process_upload(task, video_id: str, file_path: str, url_meta: dict | None = None):
    vid = uuid.UUID(video_id)
    session_factory = make_session_factory()
    async with session_factory() as db:
        if url_meta:
            video = await db.get(Video, vid)
            if video:
                if url_meta.get("title"):
                    video.title = url_meta["title"][:500]
                if url_meta.get("view_count") is not None:
                    video.view_count = url_meta["view_count"]
                if url_meta.get("like_count") is not None:
                    video.like_count = url_meta["like_count"]
                if url_meta.get("creator_name") and not video.creator_name:
                    video.creator_name = url_meta["creator_name"][:200]
                await db.commit()

        _report_progress(task, 0.1, "transcribing")
        await _update_status(db, vid, VideoStatus.TRANSCRIBING)

        agent = TranscriptionAgent()
        segments_data = await agent.run(file_path)

        await _save_segments_and_analyze(task, db, vid, segments_data)


async def _process_text(task, video_id: str, text: str):
    vid = uuid.UUID(video_id)
    session_factory = make_session_factory()
    async with session_factory() as db:
        _report_progress(task, 0.1, "transcribing")
        await _update_status(db, vid, VideoStatus.TRANSCRIBING)

        agent = TranscriptionAgent()
        segments_data = await agent.run_from_text(text)

        await _save_segments_and_analyze(task, db, vid, segments_data)


async def _process_url(task, video_id: str, url: str):
    agent = TranscriptionAgent()

    # Caminho 1: transcript API (sem download, sem custo, ~1-2s)
    try:
        _report_progress(task, 0.05, "fetching_transcript")
        segments_data = await agent.run_from_url(url)
        meta = await asyncio.to_thread(_fetch_youtube_meta, url)
        logger.info("process_video_url: usando transcript API para %s", url)

        vid = uuid.UUID(video_id)
        session_factory = make_session_factory()
        async with session_factory() as db:
            video = await db.get(Video, vid)
            if video:
                if meta.get("title"):
                    video.title = meta["title"][:500]
                if meta.get("view_count") is not None:
                    video.view_count = meta["view_count"]
                if meta.get("like_count") is not None:
                    video.like_count = meta["like_count"]
                if meta.get("creator_name") and not video.creator_name:
                    video.creator_name = meta["creator_name"][:200]
                await db.commit()

            _report_progress(task, 0.1, "transcribing")
            await _update_status(db, vid, VideoStatus.TRANSCRIBING)
            await _save_segments_and_analyze(task, db, vid, segments_data)
        return

    except TranscriptUnavailableError as exc:
        logger.warning("Transcript API indisponivel, usando download+Whisper: %s", exc)
    except Exception as exc:
        logger.warning("Transcript API falhou (%s), usando download+Whisper", exc)

    # Caminho 2: download + Whisper (fallback)
    file_path, meta = await asyncio.to_thread(_download_media_from_url, url)
    try:
        await _process_upload(task, video_id, file_path, url_meta=meta)
    finally:
        parent = Path(file_path).parent
        try:
            os.unlink(file_path)
        except OSError:
            pass
        try:
            parent.rmdir()
        except OSError:
            pass


def _fetch_youtube_meta(url: str) -> dict:
    """Busca metadados do video sem fazer download (rapido, sem auth para publicos)."""
    cookies_path = Path(os.environ.get("YTDLP_COOKIES_PATH", "/data/cookies.txt"))
    options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "socket_timeout": 15,
        "extractor_args": {"youtube": {"player_client": ["android"]}},
    }
    if cookies_path.exists():
        options["cookiefile"] = str(cookies_path)

    try:
        with YoutubeDL(options) as ydl:
            info = ydl.extract_info(url, download=False) or {}
            return {
                "title": info.get("title"),
                "view_count": info.get("view_count"),
                "like_count": info.get("like_count"),
                "creator_name": info.get("uploader") or info.get("channel"),
            }
    except Exception as exc:
        logger.warning("_fetch_youtube_meta falhou: %s", exc)
        return {}


def _build_ydl_attempts(base_options: dict) -> list[dict]:
    """
    Retorna lista de configuracoes para tentar em ordem:
    1. Cliente iOS com cookies — bypassa JS challenge (signature/n-challenge) completamente
    2. Cliente iOS sem cookies — fallback para videos publicos
    O cliente iOS usa URLs de download pre-assinadas que nao precisam de challenge solving.
    """
    # android client bypassa EJS/PO-Token challenge completamente
    android_args = {"extractor_args": {"youtube": {"player_client": ["android"]}}}

    attempts = [
        {**base_options, **android_args},
    ]
    logger.info("yt-dlp: usando android client")
    return attempts


def _extract_meta_and_path(ydl: YoutubeDL, info: dict, tmp_dir: str) -> tuple[str, dict]:
    meta = {
        "title": info.get("title"),
        "view_count": info.get("view_count"),
        "like_count": info.get("like_count"),
        "creator_name": info.get("uploader") or info.get("channel"),
    }

    downloaded = info.get("requested_downloads") or []
    if downloaded and downloaded[0].get("filepath"):
        return downloaded[0]["filepath"], meta

    candidate = Path(ydl.prepare_filename(info))
    if candidate.exists():
        return str(candidate), meta

    files = [p for p in Path(tmp_dir).iterdir() if p.is_file()]
    if files:
        return str(files[0]), meta

    raise ValueError("Arquivo baixado nao encontrado no diretorio temporario")


def _download_media_from_url(url: str) -> tuple[str, dict]:
    tmp_dir = tempfile.mkdtemp(prefix="scriptdna-url-")
    base_options = {
        "format": "bestaudio/best",
        "outtmpl": str(Path(tmp_dir) / "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "retries": 3,
        "socket_timeout": 30,
    }

    attempts = _build_ydl_attempts(base_options)
    last_exc: Exception | None = None

    for opts in attempts:
        try:
            with YoutubeDL(opts) as ydl:
                info = ydl.extract_info(url, download=True)
                return _extract_meta_and_path(ydl, info, tmp_dir)
        except Exception as exc:
            last_exc = exc
            error_msg = str(exc)
            is_auth_error = any(code in error_msg for code in ("401", "403", "Sign in", "bot"))
            if not is_auth_error:
                raise
            logger.warning("yt-dlp: tentativa falhou (%s), tentando proximo metodo", error_msg[:120])

    raise last_exc or ValueError("Nao foi possivel baixar a midia da URL")


async def _save_segments_and_analyze(
    task, db: AsyncSession, video_id: uuid.UUID, segments_data: list[dict]
):
    await _clear_existing_analysis(db, video_id)

    segments = []
    for seg in segments_data:
        segment = TranscriptSegment(
            video_id=video_id,
            start_time=seg["start"],
            end_time=seg["end"],
            text=seg["text"],
            word_count=seg["word_count"],
            position_percent=seg["position_percent"],
        )
        db.add(segment)
        segments.append(segment)

    video = await db.get(Video, video_id)
    if video and segments_data:
        video.duration_seconds = int(max(seg["end"] for seg in segments_data))

    await db.commit()

    _report_progress(task, 0.4, "analyzing")
    await _update_status(db, video_id, VideoStatus.ANALYZING)
    analysis_agent = AnalysisAgent()
    analysis_result = await analysis_agent.run(segments_data)

    for beat_data in analysis_result.get("beats", []):
        idx = beat_data.get("segment_index", 0)
        segment = segments[idx] if idx < len(segments) else None

        beat = ScriptBeat(
            video_id=video_id,
            segment_id=segment.id if segment else None,
            beat_type=beat_data["beat_type"],
            attention_goal=beat_data.get("attention_goal"),
            curiosity_question=beat_data.get("curiosity_question"),
            retention_function=beat_data.get("retention_function"),
            emotion=beat_data.get("emotion"),
            intensity_score=beat_data.get("intensity_score"),
        )
        db.add(beat)

        if segment:
            for tech_data in beat_data.get("techniques", []):
                technique = await _get_or_create_technique(db, tech_data["name"])
                st = SegmentTechnique(
                    segment_id=segment.id,
                    technique_id=technique.id,
                    confidence=tech_data.get("confidence"),
                    evidence=tech_data.get("evidence"),
                )
                db.add(st)

    await db.commit()

    _report_progress(task, 0.7, "embedding")
    await _update_status(db, video_id, VideoStatus.EMBEDDING)
    await _generate_embeddings(db, video_id)

    _report_progress(task, 1.0, "done")
    await _update_status(db, video_id, VideoStatus.DONE)


async def _clear_existing_analysis(db: AsyncSession, video_id: uuid.UUID):
    segment_ids = select(TranscriptSegment.id).where(
        TranscriptSegment.video_id == video_id
    )
    await db.execute(
        delete(SegmentTechnique).where(SegmentTechnique.segment_id.in_(segment_ids))
    )
    await db.execute(delete(ScriptBeat).where(ScriptBeat.video_id == video_id))
    await db.execute(
        delete(TranscriptSegment).where(TranscriptSegment.video_id == video_id)
    )
    await db.flush()


async def _generate_embeddings(db: AsyncSession, video_id: uuid.UUID):
    result = await db.execute(
        select(TranscriptSegment).where(TranscriptSegment.video_id == video_id)
    )
    segments = result.scalars().all()

    texts = [s.text for s in segments]
    if not texts:
        return

    batch_size = 20
    for i in range(0, len(texts), batch_size):
        batch_texts = texts[i : i + batch_size]
        batch_segments = segments[i : i + batch_size]

        client = get_openai_client()
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=batch_texts,
        )

        for seg, emb_data in zip(batch_segments, response.data):
            seg.embedding = emb_data.embedding

    await db.commit()


async def _get_or_create_technique(db: AsyncSession, name: str) -> Technique:
    result = await db.execute(select(Technique).where(Technique.name == name))
    technique = result.scalar_one_or_none()

    if not technique:
        technique = Technique(name=name)
        db.add(technique)
        await db.flush()

    return technique


async def _update_status(
    db: AsyncSession, video_id: uuid.UUID, status: VideoStatus
):
    video = await db.get(Video, video_id)
    if video:
        video.status = status
        await db.commit()


async def _set_error(video_id: str):
    vid = uuid.UUID(video_id)
    session_factory = make_session_factory()
    async with session_factory() as db:
        await _update_status(db, vid, VideoStatus.ERROR)
