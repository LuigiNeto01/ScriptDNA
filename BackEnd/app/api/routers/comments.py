"""
[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/comments/short/:short_id
Resposta 200: { data: [...] }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/comments/short/:short_id/fetch
Resposta 202: { data: { task_id: ... } }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/comments/short/:short_id/analyze
Resposta 202: { data: { task_id: ... } }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/comments/short/:short_id/summary
Resposta 200: { data: {...} }
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import RateLimiter
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.youtube import YouTubeShort
from app.models.youtube_short_comment import YouTubeShortComment
from app.schemas.common import DataResponse

router = APIRouter()

_fetch_limiter = RateLimiter(per_minute=2, per_day=20, resource="fetch_comments")
_analyze_limiter = RateLimiter(per_minute=3, per_day=30, resource="analyze_comments")


@router.get("/short/{short_id}", response_model=DataResponse)
async def list_comments(
    short_id: uuid.UUID,
    sentiment: str | None = Query(default=None),
    intent: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_short_ownership(short_id, user.id, db)

    query = (
        select(YouTubeShortComment)
        .where(YouTubeShortComment.short_id == short_id)
        .order_by(YouTubeShortComment.like_count.desc(), YouTubeShortComment.published_at.desc())
        .limit(limit)
    )
    if sentiment:
        query = query.where(YouTubeShortComment.sentiment == sentiment)
    if intent:
        query = query.where(YouTubeShortComment.intent == intent)

    result = await db.execute(query)
    comments = result.scalars().all()

    return DataResponse(data=[_serialize_comment(c) for c in comments])


@router.post("/short/{short_id}/fetch", response_model=DataResponse, status_code=202)
async def fetch_comments(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rl=Depends(_fetch_limiter),
):
    await _verify_short_ownership(short_id, user.id, db)

    from app.tasks.youtube_tasks import fetch_short_comments

    task = fetch_short_comments.delay(str(user.id), str(short_id))
    return DataResponse(data={"task_id": task.id})


@router.post("/short/{short_id}/analyze", response_model=DataResponse, status_code=202)
async def analyze_comments(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rl=Depends(_analyze_limiter),
):
    await _verify_short_ownership(short_id, user.id, db)

    from app.tasks.analysis_tasks import analyze_short_comments

    task = analyze_short_comments.delay(str(user.id), str(short_id))
    return DataResponse(data={"task_id": task.id})


@router.get("/short/{short_id}/summary", response_model=DataResponse)
async def comment_summary(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _verify_short_ownership(short_id, user.id, db)

    result = await db.execute(
        select(
            func.count(YouTubeShortComment.id),
            func.count(YouTubeShortComment.analyzed_at),
            func.avg(YouTubeShortComment.sentiment_score),
        ).where(YouTubeShortComment.short_id == short_id)
    )
    row = result.one()

    # Sentiment distribution
    sentiment_result = await db.execute(
        select(
            YouTubeShortComment.sentiment,
            func.count(YouTubeShortComment.id),
        )
        .where(
            YouTubeShortComment.short_id == short_id,
            YouTubeShortComment.sentiment.isnot(None),
        )
        .group_by(YouTubeShortComment.sentiment)
    )
    sentiment_dist = {r[0]: r[1] for r in sentiment_result.all()}

    # Intent distribution
    intent_result = await db.execute(
        select(
            YouTubeShortComment.intent,
            func.count(YouTubeShortComment.id),
        )
        .where(
            YouTubeShortComment.short_id == short_id,
            YouTubeShortComment.intent.isnot(None),
        )
        .group_by(YouTubeShortComment.intent)
    )
    intent_dist = {r[0]: r[1] for r in intent_result.all()}

    return DataResponse(data={
        "total_comments": row[0] or 0,
        "analyzed_comments": row[1] or 0,
        "avg_sentiment_score": round(float(row[2]), 2) if row[2] else None,
        "sentiment_distribution": sentiment_dist,
        "intent_distribution": intent_dist,
    })


async def _verify_short_ownership(
    short_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
):
    result = await db.execute(
        select(YouTubeShort).where(
            YouTubeShort.id == short_id,
            YouTubeShort.user_id == user_id,
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Short not found")


def _serialize_comment(c: YouTubeShortComment) -> dict:
    return {
        "id": str(c.id),
        "youtube_comment_id": c.youtube_comment_id,
        "author_name": c.author_name,
        "text": c.text,
        "like_count": c.like_count,
        "published_at": c.published_at.isoformat() if c.published_at else None,
        "sentiment": c.sentiment,
        "sentiment_score": c.sentiment_score,
        "intent": c.intent,
        "topics": c.topics,
        "actionable_insight": c.actionable_insight,
        "analyzed_at": c.analyzed_at.isoformat() if c.analyzed_at else None,
    }
