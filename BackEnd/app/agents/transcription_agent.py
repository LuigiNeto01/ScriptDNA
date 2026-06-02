import logging
import os
import re
from http.cookiejar import MozillaCookieJar
from pathlib import Path

import requests
from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled, YouTubeTranscriptApi

from app.core.openai_client import get_openai_client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Ordem de preferencia de idiomas para legendas
_TRANSCRIPT_LANGUAGES = ["pt", "pt-BR", "pt-PT", "en", "en-US"]


class TranscriptUnavailableError(Exception):
    """Legenda nao disponivel no YouTube para este video."""


def _extract_video_id(url: str) -> str | None:
    """Extrai o video ID de URLs do YouTube (watch, shorts, youtu.be)."""
    patterns = [
        r"(?:v=|/shorts/|youtu\.be/)([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def _build_http_client() -> requests.Session | None:
    """Retorna uma Session com cookies carregados se o arquivo existir."""
    cookies_path = Path(os.environ.get("YTDLP_COOKIES_PATH", "/data/cookies.txt"))
    if not cookies_path.exists():
        return None
    jar = MozillaCookieJar(str(cookies_path))
    jar.load(ignore_discard=True, ignore_expires=True)
    session = requests.Session()
    session.cookies = jar  # type: ignore[assignment]
    logger.info("Transcript API: usando cookies de %s", cookies_path)
    return session


class TranscriptionAgent:
    MAX_FILE_SIZE = settings.max_upload_size_bytes

    async def run_from_url(self, url: str) -> list[dict]:
        """
        Busca a transcricao diretamente das legendas do YouTube.
        Levanta TranscriptUnavailableError se nao houver legenda disponivel.
        """
        video_id = _extract_video_id(url)
        if not video_id:
            raise ValueError(f"Nao foi possivel extrair o video ID da URL: {url}")

        http_client = _build_http_client()
        ytt = YouTubeTranscriptApi(http_client=http_client) if http_client else YouTubeTranscriptApi()

        try:
            transcript_list = ytt.list_transcripts(video_id)
            transcript = transcript_list.find_transcript(_TRANSCRIPT_LANGUAGES)
            entries = transcript.fetch()
        except (TranscriptsDisabled, NoTranscriptFound) as exc:
            raise TranscriptUnavailableError(str(exc)) from exc

        segments = []
        total_duration = max((e.start + e.duration for e in entries), default=0)

        for entry in entries:
            start = round(entry.start, 2)
            end = round(entry.start + entry.duration, 2)
            text = entry.text.strip()
            word_count = len(text.split())
            position_percent = round((start / total_duration) * 100, 1) if total_duration else 0
            segments.append({
                "start": start,
                "end": end,
                "text": text,
                "word_count": word_count,
                "position_percent": position_percent,
            })

        logger.info("Transcript API: %d segmentos obtidos para %s", len(segments), video_id)
        return self._apply_granularity(segments)

    async def run(self, file_path: str) -> list[dict]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")

        file_size = path.stat().st_size
        if file_size > self.MAX_FILE_SIZE:
            raise ValueError(
                f"Arquivo excede o limite de {settings.MAX_UPLOAD_SIZE_MB}MB"
            )

        with open(file_path, "rb") as audio_file:
            client = get_openai_client()
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="verbose_json",
                timestamp_granularities=["segment", "word"],
            )

        raw_segments = response.segments or []
        return self._process_segments(raw_segments, response.duration or 0)

    async def run_from_text(self, text: str) -> list[dict]:
        if not text.strip():
            raise ValueError("Texto vazio não pode ser processado")

        words = text.split()
        total_words = len(words)
        avg_words_per_second = 2.5
        total_duration = total_words / avg_words_per_second

        segments = []
        chunk_size = 30
        for i in range(0, total_words, chunk_size):
            chunk_words = words[i : i + chunk_size]
            start = i / avg_words_per_second
            end = min((i + len(chunk_words)) / avg_words_per_second, total_duration)
            segments.append(
                {
                    "start": round(start, 2),
                    "end": round(end, 2),
                    "text": " ".join(chunk_words),
                    "word_count": len(chunk_words),
                    "position_percent": round(
                        (i / total_words) * 100, 1
                    ),
                }
            )

        return segments

    def _process_segments(
        self, raw_segments: list, total_duration: float
    ) -> list[dict]:
        segments = []
        for seg in raw_segments:
            start = seg.start if hasattr(seg, "start") else seg.get("start", 0)
            end = seg.end if hasattr(seg, "end") else seg.get("end", 0)
            text = seg.text if hasattr(seg, "text") else seg.get("text", "")

            word_count = len(text.split())
            position_percent = (
                round((start / total_duration) * 100, 1) if total_duration > 0 else 0
            )

            segments.append(
                {
                    "start": round(start, 2),
                    "end": round(end, 2),
                    "text": text.strip(),
                    "word_count": word_count,
                    "position_percent": position_percent,
                }
            )

        return self._apply_granularity(segments)

    def _apply_granularity(self, segments: list[dict]) -> list[dict]:
        """Primeiros 30s: granularidade 3-5s; restante: 10-15s."""
        result = []
        buffer_text = []
        buffer_start = None
        buffer_word_count = 0

        for seg in segments:
            is_early = seg["start"] < 30
            max_duration = 5 if is_early else 15

            if buffer_start is None:
                buffer_start = seg["start"]

            buffer_text.append(seg["text"])
            buffer_word_count += seg["word_count"]

            if seg["end"] - buffer_start >= max_duration:
                result.append(
                    {
                        "start": buffer_start,
                        "end": seg["end"],
                        "text": " ".join(buffer_text),
                        "word_count": buffer_word_count,
                        "position_percent": seg["position_percent"],
                    }
                )
                buffer_text = []
                buffer_start = None
                buffer_word_count = 0

        if buffer_text and buffer_start is not None:
            result.append(
                {
                    "start": buffer_start,
                    "end": segments[-1]["end"],
                    "text": " ".join(buffer_text),
                    "word_count": buffer_word_count,
                    "position_percent": segments[-1]["position_percent"],
                }
            )

        return result
