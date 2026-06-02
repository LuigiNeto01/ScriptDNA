import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.core.celery_app import celery_app
from app.core.rate_limit import RateLimiter
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.performance_analysis import PerformanceAnalysis
from app.models.script import Script
from app.models.user import User
from app.models.youtube import (
    ShortMetrics,
    ShortMetricsHistory,
    YouTubeShort,
    YouTubeShortBeat,
    YouTubeShortSegment,
)
from app.models.youtube_short_comment import YouTubeShortComment
from app.schemas.common import DataResponse
from app.schemas.youtube import ManualMetricsInput, MetricsUpdateInput, ShortScriptLinkInput
from app.services.short_script_link_service import link_short_to_script, unlink_short_from_script

router = APIRouter()

_sync_limiter = RateLimiter(per_minute=1, per_day=10, resource="youtube_sync")
_transcript_limiter = RateLimiter(per_minute=3, per_day=30, resource="fetch_transcript")


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
async def sync_shorts(
    user: User = Depends(get_current_user),
    _rl=Depends(_sync_limiter),
):
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
    has_transcript: bool | None = Query(None),
    has_analysis: bool | None = Query(None),
    has_script: bool | None = Query(None),
    sort: str = Query("recent", pattern="^(recent|views|retention|engagement)$"),
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    latest_metrics_ranked = (
        select(
            ShortMetrics.id.label("id"),
            ShortMetrics.youtube_short_id.label("youtube_short_id"),
            ShortMetrics.views.label("views"),
            ShortMetrics.likes.label("likes"),
            ShortMetrics.comments.label("comments"),
            ShortMetrics.shares.label("shares"),
            ShortMetrics.average_view_percentage.label("average_view_percentage"),
            ShortMetrics.engagement_rate.label("engagement_rate"),
            ShortMetrics.subscribers_gained.label("subscribers_gained"),
            ShortMetrics.collected_at.label("collected_at"),
            func.row_number().over(
                partition_by=ShortMetrics.youtube_short_id,
                order_by=(ShortMetrics.collected_at.desc(), ShortMetrics.id.desc()),
            ).label("row_number"),
        ).subquery()
    )
    latest_metrics = aliased(latest_metrics_ranked)

    segments_exists = (
        select(func.count(YouTubeShortSegment.id) > 0)
        .where(YouTubeShortSegment.short_id == YouTubeShort.id)
        .scalar_subquery()
    )
    beats_exists = (
        select(func.count(YouTubeShortBeat.id) > 0)
        .where(YouTubeShortBeat.short_id == YouTubeShort.id)
        .scalar_subquery()
    )
    analysis_exists = (
        select(func.count(PerformanceAnalysis.id) > 0)
        .where(PerformanceAnalysis.youtube_short_id == YouTubeShort.id)
        .scalar_subquery()
    )
    timeline_exists = (
        select(func.count(PerformanceAnalysis.id) > 0)
        .where(
            PerformanceAnalysis.youtube_short_id == YouTubeShort.id,
            PerformanceAnalysis.timeline_analysis.isnot(None),
        )
        .scalar_subquery()
    )
    comments_exists = (
        select(func.count(YouTubeShortComment.id) > 0)
        .where(YouTubeShortComment.short_id == YouTubeShort.id)
        .scalar_subquery()
    )
    comment_analysis_exists = (
        select(func.count(YouTubeShortComment.id) > 0)
        .where(
            YouTubeShortComment.short_id == YouTubeShort.id,
            YouTubeShortComment.analyzed_at.isnot(None),
        )
        .scalar_subquery()
    )

    base_query = (
        select(
            YouTubeShort,
            Script.id.label("script_link_id"),
            Script.title.label("script_link_title"),
            Script.status.label("script_link_status"),
            latest_metrics.c.views.label("latest_views"),
            latest_metrics.c.likes.label("latest_likes"),
            latest_metrics.c.comments.label("latest_comments"),
            latest_metrics.c.shares.label("latest_shares"),
            latest_metrics.c.average_view_percentage.label("latest_average_view_percentage"),
            latest_metrics.c.engagement_rate.label("latest_engagement_rate"),
            latest_metrics.c.subscribers_gained.label("latest_subscribers_gained"),
            latest_metrics.c.collected_at.label("latest_collected_at"),
            segments_exists.label("has_segments"),
            beats_exists.label("has_beats"),
            analysis_exists.label("has_performance_analysis"),
            timeline_exists.label("has_timeline_analysis"),
            comments_exists.label("has_comments"),
            comment_analysis_exists.label("has_comment_analysis"),
        )
        .outerjoin(
            latest_metrics,
            and_(
                latest_metrics.c.youtube_short_id == YouTubeShort.id,
                latest_metrics.c.row_number == 1,
            ),
        )
        .outerjoin(Script, Script.id == YouTubeShort.script_id)
        .where(YouTubeShort.user_id == user.id)
    )

    if has_transcript is not None:
        if has_transcript:
            base_query = base_query.where(
                YouTubeShort.transcript.isnot(None),
                YouTubeShort.transcript != "",
            )
        else:
            base_query = base_query.where(
                or_(YouTubeShort.transcript.is_(None), YouTubeShort.transcript == "")
            )

    if has_analysis is not None:
        base_query = base_query.where(analysis_exists if has_analysis else ~analysis_exists)

    if has_script is not None:
        base_query = base_query.where(
            YouTubeShort.script_id.isnot(None) if has_script else YouTubeShort.script_id.is_(None)
        )

    if sort == "views":
        order_by = desc(latest_metrics.c.views).nullslast()
    elif sort == "retention":
        order_by = desc(latest_metrics.c.average_view_percentage).nullslast()
    elif sort == "engagement":
        order_by = desc(latest_metrics.c.engagement_rate).nullslast()
    else:
        order_by = YouTubeShort.published_at.desc().nullslast()

    query = base_query.order_by(order_by, YouTubeShort.published_at.desc().nullslast()).limit(limit).offset(offset)
    result = await db.execute(query)
    rows = result.all()

    total = (
        await db.execute(
            select(func.count()).select_from(base_query.order_by(None).subquery())
        )
    ).scalar() or 0

    return DataResponse(data={
        "items": [_short_to_dict_from_row(row) for row in rows],
        "total": total,
    })


@router.get("/shorts/{short_id}", response_model=DataResponse)
async def get_short(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short = await _get_user_short(short_id, user.id, db)
    latest_metrics = await _get_latest_metrics(short.id, db)
    script = None
    if short.script_id:
        script = await db.get(Script, short.script_id)

    return DataResponse(data={
        **_short_to_dict(short),
        "latest_metrics": _metrics_summary_to_dict(latest_metrics),
        "analysis_status": await _build_analysis_status(short, db),
        "script_link": _script_link_to_dict(script),
    })


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
    _rl=Depends(_transcript_limiter),
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


@router.post("/shorts/{short_id}/link-script", response_model=DataResponse)
async def link_short_script(
    short_id: uuid.UUID,
    body: ShortScriptLinkInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short = await _get_user_short(short_id, user.id, db)
    script = await db.get(Script, uuid.UUID(body.script_id))
    if not script or script.user_id != user.id:
        raise HTTPException(status_code=404, detail="Script not found")

    await link_short_to_script(short=short, script=script, user_id=user.id, db=db)
    await db.flush()

    return DataResponse(data={
        "short_id": str(short.id),
        "script_id": str(script.id),
        "youtube_video_id": short.youtube_video_id,
        "message": "Short vinculado ao roteiro com sucesso.",
    })


@router.delete("/shorts/{short_id}/link-script", response_model=DataResponse)
async def unlink_short_script(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    short = await _get_user_short(short_id, user.id, db)
    await unlink_short_from_script(short=short, user_id=user.id, db=db)
    await db.flush()

    return DataResponse(data={
        "short_id": str(short.id),
        "script_id": None,
        "youtube_video_id": short.youtube_video_id,
        "message": "Vinculo do Short removido com sucesso.",
    })


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


def _metrics_summary_to_dict(row) -> dict | None:
    if not row:
        return None

    if getattr(row, "latest_views", None) is None:
        return None

    return {
        "views": row.latest_views,
        "likes": row.latest_likes,
        "comments": row.latest_comments,
        "shares": row.latest_shares,
        "average_view_percentage": row.latest_average_view_percentage,
        "engagement_rate": row.latest_engagement_rate,
        "subscribers_gained": row.latest_subscribers_gained,
        "collected_at": row.latest_collected_at.isoformat() if row.latest_collected_at else None,
    }


def _script_link_to_dict(script: Script | None) -> dict | None:
    if not script:
        return None

    return {
        "script_id": str(script.id),
        "script_title": script.title,
        "script_status": script.status.value if hasattr(script.status, "value") else script.status,
    }


def _short_to_dict_from_row(row) -> dict:
    short = row[0]
    return {
        **_short_to_dict(short),
        "latest_metrics": _metrics_summary_to_dict(row),
        "analysis_status": {
            "has_transcript": bool(short.transcript),
            "has_segments": bool(row.has_segments),
            "has_performance_analysis": bool(row.has_performance_analysis),
            "has_timeline_analysis": bool(row.has_timeline_analysis),
            "has_comments": bool(row.has_comments),
            "has_comment_analysis": bool(row.has_comment_analysis),
        },
        "script_link": {
            "script_id": str(row.script_link_id),
            "script_title": row.script_link_title,
            "script_status": row.script_link_status.value if row.script_link_status else None,
        } if row.script_link_id else None,
    }


async def _get_latest_metrics(short_id: uuid.UUID, db: AsyncSession) -> ShortMetrics | None:
    result = await db.execute(
        select(ShortMetrics)
        .where(ShortMetrics.youtube_short_id == short_id)
        .order_by(ShortMetrics.collected_at.desc(), ShortMetrics.id.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _build_analysis_status(short: YouTubeShort, db: AsyncSession) -> dict:
    segment_count = await db.scalar(
        select(func.count()).select_from(YouTubeShortSegment).where(YouTubeShortSegment.short_id == short.id)
    ) or 0
    beat_count = await db.scalar(
        select(func.count()).select_from(YouTubeShortBeat).where(YouTubeShortBeat.short_id == short.id)
    ) or 0
    analysis_count = await db.scalar(
        select(func.count()).select_from(PerformanceAnalysis).where(PerformanceAnalysis.youtube_short_id == short.id)
    ) or 0
    timeline_count = await db.scalar(
        select(func.count()).select_from(PerformanceAnalysis).where(
            PerformanceAnalysis.youtube_short_id == short.id,
            PerformanceAnalysis.timeline_analysis.isnot(None),
        )
    ) or 0
    comments_count = await db.scalar(
        select(func.count()).select_from(YouTubeShortComment).where(YouTubeShortComment.short_id == short.id)
    ) or 0
    comment_analysis_count = await db.scalar(
        select(func.count()).select_from(YouTubeShortComment).where(
            YouTubeShortComment.short_id == short.id,
            YouTubeShortComment.analyzed_at.isnot(None),
        )
    ) or 0

    return {
        "has_transcript": bool(short.transcript),
        "has_segments": segment_count > 0,
        "has_performance_analysis": analysis_count > 0,
        "has_timeline_analysis": timeline_count > 0,
        "has_comments": comments_count > 0,
        "has_comment_analysis": comment_analysis_count > 0,
        "has_beats": beat_count > 0,
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
