import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.youtube import ShortMetrics, ShortMetricsHistory, YouTubeShort
from app.schemas.common import DataResponse
from app.schemas.youtube import ManualMetricsInput, MetricsUpdateInput

router = APIRouter()


@router.get("/channel", response_model=DataResponse)
async def get_channel(user: User = Depends(get_current_user)):
    if not user.youtube_channel_id:
        return DataResponse(data={"connected": False})

    return DataResponse(data={
        "connected": True,
        "channel_id": user.youtube_channel_id,
        "channel_name": user.youtube_channel_name,
    })


@router.post("/sync", response_model=DataResponse, status_code=status.HTTP_202_ACCEPTED)
async def sync_shorts(user: User = Depends(get_current_user)):
    if not user.youtube_channel_id:
        raise HTTPException(status_code=400, detail="YouTube channel not connected")

    task = celery_app.send_task(
        "app.tasks.youtube_tasks.sync_channel_shorts",
        args=[str(user.id)],
    )
    return DataResponse(data={"task_id": task.id})


@router.get("/shorts", response_model=DataResponse)
async def list_shorts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    query = (
        select(YouTubeShort)
        .where(YouTubeShort.user_id == user.id)
        .order_by(YouTubeShort.published_at.desc().nullslast())
        .limit(limit)
        .offset(offset)
    )
    result = await db.execute(query)
    shorts = result.scalars().all()

    count_q = select(func.count()).where(YouTubeShort.user_id == user.id)
    total = (await db.execute(count_q)).scalar() or 0

    return DataResponse(data={
        "items": [_short_to_dict(s) for s in shorts],
        "total": total,
    })


@router.get("/shorts/{short_id}", response_model=DataResponse)
async def get_short(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short = await _get_user_short(short_id, user.id, db)
    return DataResponse(data=_short_to_dict(short))


@router.post("/shorts/{short_id}/fetch-metrics", response_model=DataResponse, status_code=202)
async def fetch_metrics(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short = await _get_user_short(short_id, user.id, db)
    if not user.youtube_access_token:
        raise HTTPException(status_code=400, detail="YouTube not connected")

    task = celery_app.send_task(
        "app.tasks.youtube_tasks.fetch_short_metrics",
        args=[str(user.id), str(short.id)],
    )
    return DataResponse(data={"task_id": task.id})


@router.post("/shorts/{short_id}/fetch-transcript", response_model=DataResponse, status_code=202)
async def fetch_transcript(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short = await _get_user_short(short_id, user.id, db)
    task = celery_app.send_task(
        "app.tasks.youtube_tasks.fetch_short_transcript",
        args=[str(user.id), str(short.id)],
    )
    return DataResponse(data={"task_id": task.id})


@router.get("/shorts/{short_id}/metrics", response_model=DataResponse)
async def get_short_metrics(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_short(short_id, user.id, db)

    result = await db.execute(
        select(ShortMetrics)
        .where(ShortMetrics.youtube_short_id == short_id)
        .order_by(ShortMetrics.collected_at.desc())
        .limit(1)
    )
    metrics = result.scalar_one_or_none()
    if not metrics:
        return DataResponse(data=None)

    return DataResponse(data=_metrics_to_dict(metrics))


@router.get("/shorts/{short_id}/metrics/history", response_model=DataResponse)
async def get_metrics_history(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_short(short_id, user.id, db)

    result = await db.execute(
        select(ShortMetricsHistory)
        .where(ShortMetricsHistory.youtube_short_id == short_id)
        .order_by(ShortMetricsHistory.collected_at.desc())
    )
    history = result.scalars().all()
    return DataResponse(data=[{
        "views": h.views,
        "likes": h.likes,
        "comments": h.comments,
        "collected_at": h.collected_at.isoformat() if h.collected_at else None,
    } for h in history])


# ─── Manual Metrics ──────────────────────────────────────────────────────

@router.post("/metrics/manual", response_model=DataResponse, status_code=201)
async def submit_manual_metrics(
    body: ManualMetricsInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short_id = uuid.UUID(body.youtube_short_id)
    await _get_user_short(short_id, user.id, db)

    # Calculate engagement rate
    engagement_rate = None
    if body.views > 0:
        engagement_rate = (body.likes + body.comments + body.shares) / body.views * 100

    published_at = None
    if body.published_at:
        published_at = datetime.fromisoformat(body.published_at)

    metrics = ShortMetrics(
        youtube_short_id=short_id,
        views=body.views,
        likes=body.likes,
        comments=body.comments,
        shares=body.shares,
        subscribers_gained=body.subscribers_gained,
        average_view_duration_seconds=body.average_view_duration_seconds,
        average_view_percentage=body.average_view_percentage,
        impressions=body.impressions,
        impressions_ctr=body.impressions_ctr,
        engagement_rate=engagement_rate,
        source="manual",
        published_at=published_at,
    )
    db.add(metrics)

    # Also save to history
    history = ShortMetricsHistory(
        youtube_short_id=short_id,
        views=body.views,
        likes=body.likes,
        comments=body.comments,
    )
    db.add(history)
    await db.flush()

    return DataResponse(data=_metrics_to_dict(metrics))


@router.patch("/metrics/{metrics_id}", response_model=DataResponse)
async def update_metrics(
    metrics_id: uuid.UUID,
    body: MetricsUpdateInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(ShortMetrics).where(ShortMetrics.id == metrics_id))
    metrics = result.scalar_one_or_none()
    if not metrics:
        raise HTTPException(status_code=404, detail="Metrics not found")

    # Verify ownership
    await _get_user_short(metrics.youtube_short_id, user.id, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(metrics, field, value)

    # Recalculate engagement
    if metrics.views and metrics.views > 0:
        metrics.engagement_rate = (metrics.likes + metrics.comments + metrics.shares) / metrics.views * 100

    await db.flush()
    return DataResponse(data=_metrics_to_dict(metrics))


# ─── Helpers ─────────────────────────────────────────────────────────────

async def _get_user_short(short_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> YouTubeShort:
    result = await db.execute(
        select(YouTubeShort).where(YouTubeShort.id == short_id, YouTubeShort.user_id == user_id)
    )
    short = result.scalar_one_or_none()
    if not short:
        raise HTTPException(status_code=404, detail="Short not found")
    return short


def _short_to_dict(short: YouTubeShort) -> dict:
    return {
        "id": str(short.id),
        "youtube_video_id": short.youtube_video_id,
        "title": short.title,
        "description": short.description,
        "published_at": short.published_at.isoformat() if short.published_at else None,
        "thumbnail_url": short.thumbnail_url,
        "duration_seconds": short.duration_seconds,
        "tags": short.tags,
        "transcript": short.transcript,
        "transcript_source": short.transcript_source,
        "script_id": str(short.script_id) if short.script_id else None,
        "synced_at": short.synced_at.isoformat() if short.synced_at else None,
    }


def _metrics_to_dict(m: ShortMetrics) -> dict:
    return {
        "id": str(m.id),
        "youtube_short_id": str(m.youtube_short_id),
        "views": m.views,
        "likes": m.likes,
        "comments": m.comments,
        "shares": m.shares,
        "subscribers_gained": m.subscribers_gained,
        "average_view_duration_seconds": m.average_view_duration_seconds,
        "average_view_percentage": m.average_view_percentage,
        "impressions": m.impressions,
        "impressions_ctr": m.impressions_ctr,
        "engagement_rate": m.engagement_rate,
        "retention_score": m.retention_score,
        "source": m.source,
        "collected_at": m.collected_at.isoformat() if m.collected_at else None,
        "published_at": m.published_at.isoformat() if m.published_at else None,
    }
