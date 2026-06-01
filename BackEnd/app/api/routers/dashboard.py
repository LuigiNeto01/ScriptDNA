from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.services.ai_cost_tracking_service import AiCostTrackingService
from app.models import (
    BeatType,
    ChannelInsight,
    Script,
    ScriptBeat,
    SegmentTechnique,
    ShortMetrics,
    StyleProfile,
    Technique,
    TranscriptSegment,
    User,
    Video,
    YouTubeShort,
)
from app.schemas.common import DataResponse

router = APIRouter()


@router.get("/metrics", response_model=DataResponse)
async def get_dashboard_metrics(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    total_videos = await db.scalar(select(func.count(Video.id)).where(Video.user_id == user.id))
    total_styles = await db.scalar(select(func.count(StyleProfile.id)).where(StyleProfile.user_id == user.id))
    total_scripts = await db.scalar(select(func.count(Script.id)).where(Script.user_id == user.id))
    total_shorts = await db.scalar(select(func.count(YouTubeShort.id)).where(YouTubeShort.user_id == user.id))
    active_insights = await db.scalar(
        select(func.count(ChannelInsight.id)).where(
            ChannelInsight.user_id == user.id,
            ChannelInsight.is_active == True,  # noqa: E712
        )
    )

    usage_count = func.count(SegmentTechnique.segment_id).label("usage_count")
    top_techniques_result = await db.execute(
        select(Technique.name, usage_count)
        .join(SegmentTechnique, SegmentTechnique.technique_id == Technique.id)
        .group_by(Technique.name)
        .order_by(usage_count.desc())
        .limit(5)
    )

    avg_hook_duration = await db.scalar(
        select(func.avg(TranscriptSegment.end_time - TranscriptSegment.start_time))
        .select_from(ScriptBeat)
        .join(TranscriptSegment, ScriptBeat.segment_id == TranscriptSegment.id)
        .where(ScriptBeat.beat_type == BeatType.HOOK)
    )
    metric_avgs = await db.execute(
        select(
            func.avg(ShortMetrics.views),
            func.avg(ShortMetrics.average_view_percentage),
            func.avg(ShortMetrics.engagement_rate),
        )
        .join(YouTubeShort, ShortMetrics.youtube_short_id == YouTubeShort.id)
        .where(YouTubeShort.user_id == user.id)
    )
    avg_views, avg_retention, avg_engagement = metric_avgs.one()

    return DataResponse(
        data={
            "total_videos": total_videos or 0,
            "total_styles": total_styles or 0,
            "total_scripts": total_scripts or 0,
            "total_shorts": total_shorts or 0,
            "active_insights": active_insights or 0,
            "avg_views": float(avg_views or 0),
            "avg_retention": float(avg_retention or 0),
            "avg_engagement": float(avg_engagement or 0),
            "top_techniques": [
                {"name": name, "count": count}
                for name, count in top_techniques_result.all()
            ],
            "avg_hook_duration": float(avg_hook_duration or 0),
        }
    )


@router.get("/ai-costs", response_model=DataResponse)
async def get_ai_costs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    days: int = 30,
):
    summary = await AiCostTrackingService().user_cost_summary(user.id, db, days=days)
    return DataResponse(data=summary)


@router.get("/ai-runs", response_model=DataResponse)
async def get_ai_runs(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 20,
):
    runs = await AiCostTrackingService().recent_runs(user.id, db, limit=limit)
    return DataResponse(data=runs)
