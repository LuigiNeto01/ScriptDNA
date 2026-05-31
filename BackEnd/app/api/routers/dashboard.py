from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import (
    BeatType,
    ScriptBeat,
    SegmentTechnique,
    StyleProfile,
    Technique,
    TranscriptSegment,
    Video,
)
from app.schemas.common import DataResponse

router = APIRouter()


@router.get("/metrics", response_model=DataResponse)
async def get_dashboard_metrics(db: AsyncSession = Depends(get_db)):
    total_videos = await db.scalar(select(func.count(Video.id)))
    total_styles = await db.scalar(select(func.count(StyleProfile.id)))

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

    return DataResponse(
        data={
            "total_videos": total_videos or 0,
            "total_styles": total_styles or 0,
            "top_techniques": [
                {"name": name, "count": count}
                for name, count in top_techniques_result.all()
            ],
            "avg_hook_duration": float(avg_hook_duration or 0),
        }
    )
