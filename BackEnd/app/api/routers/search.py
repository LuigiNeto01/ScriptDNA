"""
[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/search
Query: query: str, limit?: int (default 10), niche?: str
Resposta 200: { data: [{ segment: { id, text, start_time, end_time }, video: { id, title }, score: float }] }

[BREAKING CHANGE] Endpoint GET /api/search
Motivo: resposta mudou de flat para nested { segment, video, score }
Migração necessária no Frontend Agent: acessar segment.id, video.title, score em vez de segment_id, video_title, similarity
"""
from fastapi import APIRouter, Depends, Query

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import openai_client
from app.core.security import get_current_user
from app.db.session import get_db
from app.models import TranscriptSegment, Video
from app.models.user import User
from app.models.youtube import YouTubeShort, YouTubeShortSegment
from app.schemas.common import DataResponse

router = APIRouter()


@router.get("", response_model=DataResponse)
async def semantic_search(
    query: str = Query(min_length=3, max_length=500, alias="q"),
    limit: int = Query(default=10, ge=1, le=50),
    niche: str | None = Query(default=None),
    include_public: bool = Query(default=True),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    embedding_response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    query_embedding = embedding_response.data[0].embedding

    access_filter = Video.user_id == user.id
    if include_public:
        access_filter = or_(access_filter, Video.visibility == "public")

    uploaded_stmt = (
        select(
            TranscriptSegment,
            TranscriptSegment.embedding.cosine_distance(query_embedding).label(
                "distance"
            ),
        )
        .join(Video, TranscriptSegment.video_id == Video.id)
        .where(TranscriptSegment.embedding.isnot(None), access_filter)
    )

    if niche:
        uploaded_stmt = uploaded_stmt.where(Video.niche == niche)

    uploaded_stmt = uploaded_stmt.order_by("distance").limit(limit)

    uploaded_rows = (await db.execute(uploaded_stmt)).all()

    results = []
    for segment, distance in uploaded_rows:
        video = await db.get(Video, segment.video_id)
        source_type = "public_reference" if video and video.visibility == "public" and video.user_id != user.id else "uploaded_video"
        results.append({
            "source_type": source_type,
            "source_id": str(segment.video_id),
            "segment_id": str(segment.id),
            "title": video.title if video else "",
            "text": segment.text,
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "score": round(1 - distance, 4),
            "segment": {
                "id": str(segment.id),
                "text": segment.text,
                "start_time": segment.start_time,
                "end_time": segment.end_time,
            },
            "video": {
                "id": str(segment.video_id),
                "title": video.title if video else "",
            },
        })

    shorts_stmt = (
        select(
            YouTubeShortSegment,
            YouTubeShortSegment.embedding.cosine_distance(query_embedding).label("distance"),
        )
        .join(YouTubeShort, YouTubeShortSegment.short_id == YouTubeShort.id)
        .where(
            YouTubeShort.user_id == user.id,
            YouTubeShortSegment.embedding.isnot(None),
        )
        .order_by("distance")
        .limit(limit)
    )
    short_rows = (await db.execute(shorts_stmt)).all()
    for segment, distance in short_rows:
        short = await db.get(YouTubeShort, segment.short_id)
        results.append({
            "source_type": "youtube_short",
            "source_id": str(segment.short_id),
            "segment_id": str(segment.id),
            "title": short.title if short else "",
            "text": segment.text,
            "start_time": segment.start_time,
            "end_time": segment.end_time,
            "score": round(1 - distance, 4),
            "segment": {
                "id": str(segment.id),
                "text": segment.text,
                "start_time": segment.start_time,
                "end_time": segment.end_time,
            },
            "video": {
                "id": str(segment.short_id),
                "title": short.title if short else "",
            },
        })

    results.sort(key=lambda item: item["score"], reverse=True)

    return DataResponse(data=results[:limit])
