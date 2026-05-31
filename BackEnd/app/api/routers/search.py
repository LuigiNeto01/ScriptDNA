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

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import openai_client
from app.db.session import get_db
from app.models import TranscriptSegment, Video
from app.schemas.common import DataResponse
from app.schemas.search import SearchResult, SearchSegment, SearchVideo

router = APIRouter()


@router.get("", response_model=DataResponse)
async def semantic_search(
    query: str = Query(min_length=3, max_length=500, alias="q"),
    limit: int = Query(default=10, ge=1, le=50),
    niche: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    embedding_response = await openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    query_embedding = embedding_response.data[0].embedding

    stmt = (
        select(
            TranscriptSegment,
            TranscriptSegment.embedding.cosine_distance(query_embedding).label(
                "distance"
            ),
        )
        .join(Video, TranscriptSegment.video_id == Video.id)
        .where(TranscriptSegment.embedding.isnot(None))
    )

    if niche:
        stmt = stmt.where(Video.niche == niche)

    stmt = stmt.order_by("distance").limit(limit)

    result = await db.execute(stmt)
    rows = result.all()

    results = []
    for segment, distance in rows:
        video = await db.get(Video, segment.video_id)
        results.append(
            SearchResult(
                segment=SearchSegment(
                    id=segment.id,
                    text=segment.text,
                    start_time=segment.start_time,
                    end_time=segment.end_time,
                ),
                video=SearchVideo(
                    id=segment.video_id,
                    title=video.title if video else "",
                ),
                score=round(1 - distance, 4),
            )
        )

    return DataResponse(data=results)
