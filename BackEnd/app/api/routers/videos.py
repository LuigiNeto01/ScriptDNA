"""
[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/videos/upload
Body: multipart/form-data { file: UploadFile, title: str, creator_name?: str, niche?: str }
Resposta 202: { data: { video_id: str, status: "pending" } }
Resposta 400: { error: { code: "FILE_TOO_LARGE", message: "..." } }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/videos/text
Body: { title: str, text: str, creator_name?: str, niche?: str }
Resposta 202: { data: { video_id: str, status: "pending" } }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/videos
Query: niche?, creator_name?, status?, limit?, offset?
Resposta 200: { data: [VideoOut] }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/videos/:id
Resposta 200: { data: VideoOut }
Resposta 404: { error: { code: "NOT_FOUND", message: "..." } }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/videos/:id/beats
Resposta 200: { data: [BeatOut] }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/videos/:id/segments
Resposta 200: { data: [SegmentOut] }
"""
import os
import uuid
import tempfile
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.db.session import get_db
from app.models import (
    ScriptBeat,
    SegmentTechnique,
    TranscriptSegment,
    Video,
    VideoStatus,
)
from app.schemas.beat import BeatOut
from app.schemas.common import DataResponse, ErrorResponse
from app.schemas.segment import SegmentOut, SegmentTechniqueOut, TechniqueOut
from app.schemas.video import (
    BatchUrlInput,
    BatchVideoCreated,
    VideoCreated,
    VideoOut,
    VideoTextInput,
    VideoUrlInput,
)
from app.tasks.video_tasks import (
    process_video_text,
    process_video_upload,
    process_video_url,
)

router = APIRouter()


def _title_from_url(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if path:
        return path.rsplit("/", maxsplit=1)[-1].replace("-", " ")[:500]
    return parsed.netloc or "Video por URL"


@router.post("/upload", status_code=202, response_model=DataResponse)
async def upload_video(
    file: UploadFile = File(...),
    title: str = Form(...),
    creator_name: str | None = Form(default=None),
    niche: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    if file.size and file.size > settings.max_upload_size_bytes:
        raise HTTPException(
            status_code=400,
            detail={"code": "FILE_TOO_LARGE", "message": f"Limite: {settings.MAX_UPLOAD_SIZE_MB}MB"},
        )

    video = Video(
        title=title,
        source_type="file",
        creator_name=creator_name,
        niche=niche,
        status=VideoStatus.PENDING,
    )
    db.add(video)
    await db.flush()

    suffix = os.path.splitext(file.filename or "")[1]
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    content = await file.read()
    tmp.write(content)
    tmp.close()

    task = process_video_upload.delay(str(video.id), tmp.name)

    return DataResponse(
        data=VideoCreated(video_id=video.id, status=video.status, task_id=task.id)
    )


@router.post("/text", status_code=202, response_model=DataResponse)
async def create_video_from_text(
    body: VideoTextInput,
    db: AsyncSession = Depends(get_db),
):
    video = Video(
        title=body.title,
        source_type="text",
        creator_name=body.creator_name,
        niche=body.niche,
        status=VideoStatus.PENDING,
    )
    db.add(video)
    await db.flush()

    task = process_video_text.delay(str(video.id), body.text)

    return DataResponse(
        data=VideoCreated(video_id=video.id, status=video.status, task_id=task.id)
    )


@router.post("/url", status_code=202, response_model=DataResponse)
async def create_video_from_url(
    body: VideoUrlInput,
    db: AsyncSession = Depends(get_db),
):
    url = str(body.url)
    video = Video(
        title=body.title or _title_from_url(url),
        source_type="url",
        source_url=url,
        creator_name=body.creator_name,
        niche=body.niche,
        status=VideoStatus.PENDING,
    )
    db.add(video)
    await db.flush()

    task = process_video_url.delay(str(video.id), url)

    return DataResponse(
        data=VideoCreated(video_id=video.id, status=video.status, task_id=task.id)
    )


@router.post("/batch-url", status_code=202, response_model=DataResponse)
async def create_videos_from_urls(
    body: BatchUrlInput,
    db: AsyncSession = Depends(get_db),
):
    results = []
    for item in body.videos:
        url = str(item.url)
        video = Video(
            title=item.title or _title_from_url(url),
            source_type="url",
            source_url=url,
            creator_name=item.creator_name or body.creator_name,
            niche=item.niche or body.niche,
            status=VideoStatus.PENDING,
        )
        db.add(video)
        await db.flush()

        task = process_video_url.delay(str(video.id), url)
        results.append(
            BatchVideoCreated(video_id=video.id, url=url, task_id=task.id)
        )

    return DataResponse(data=results)


@router.get("", response_model=DataResponse)
async def list_videos(
    niche: str | None = Query(default=None),
    creator_name: str | None = Query(default=None),
    status: VideoStatus | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Video).order_by(Video.created_at.desc())

    if niche:
        stmt = stmt.where(Video.niche == niche)
    if creator_name:
        stmt = stmt.where(Video.creator_name == creator_name)
    if status:
        stmt = stmt.where(Video.status == status)

    stmt = stmt.offset(offset).limit(limit)
    result = await db.execute(stmt)
    videos = result.scalars().all()

    return DataResponse(data=[VideoOut.model_validate(v) for v in videos])


@router.get("/{video_id}", response_model=DataResponse)
async def get_video(video_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Vídeo não encontrado"})

    return DataResponse(data=VideoOut.model_validate(video))


@router.get("/{video_id}/beats", response_model=DataResponse)
async def get_video_beats(video_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Vídeo não encontrado"})

    result = await db.execute(
        select(ScriptBeat).where(ScriptBeat.video_id == video_id)
    )
    beats = result.scalars().all()

    return DataResponse(data=[BeatOut.model_validate(b) for b in beats])


@router.get("/{video_id}/segments", response_model=DataResponse)
async def get_video_segments(video_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Vídeo não encontrado"})

    result = await db.execute(
        select(TranscriptSegment)
        .where(TranscriptSegment.video_id == video_id)
        .options(
            selectinload(TranscriptSegment.techniques).selectinload(
                SegmentTechnique.technique
            )
        )
        .order_by(TranscriptSegment.start_time)
    )
    segments = result.scalars().all()

    segments_out = []
    for s in segments:
        techs = [
            SegmentTechniqueOut(
                technique_id=st.technique_id,
                technique=TechniqueOut.model_validate(st.technique) if st.technique else TechniqueOut(id=st.technique_id, name="unknown"),
                confidence=st.confidence,
                evidence=st.evidence,
            )
            for st in (s.techniques or [])
        ]
        seg_out = SegmentOut(
            id=s.id,
            video_id=s.video_id,
            start_time=s.start_time,
            end_time=s.end_time,
            text=s.text,
            word_count=s.word_count,
            position_percent=s.position_percent,
            techniques=techs,
        )
        segments_out.append(seg_out)

    return DataResponse(data=segments_out)


@router.delete("/{video_id}", status_code=200, response_model=DataResponse)
async def delete_video(video_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    video = await db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": "Vídeo não encontrado"})

    await db.delete(video)
    await db.commit()

    return DataResponse(data={"deleted": True, "video_id": str(video_id)})
