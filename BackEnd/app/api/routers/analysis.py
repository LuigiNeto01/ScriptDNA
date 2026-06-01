import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.performance_analysis import PerformanceAnalysis
from app.models.user import User
from app.models.youtube import YouTubeShort
from app.schemas.common import DataResponse

router = APIRouter()


@router.post("/performance/{short_id}", response_model=DataResponse, status_code=202)
async def analyze_performance(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    result = await db.execute(
        select(YouTubeShort).where(YouTubeShort.id == short_id, YouTubeShort.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Short not found")

    task = celery_app.send_task(
        "app.tasks.analysis_tasks.analyze_short_performance",
        args=[str(user.id), str(short_id)],
    )
    return DataResponse(data={"task_id": task.id})


@router.get("/performance/{short_id}", response_model=DataResponse)
async def get_performance_analysis(
    short_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    result = await db.execute(
        select(YouTubeShort).where(YouTubeShort.id == short_id, YouTubeShort.user_id == user.id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Short not found")

    result = await db.execute(
        select(PerformanceAnalysis)
        .where(PerformanceAnalysis.youtube_short_id == short_id)
        .order_by(PerformanceAnalysis.created_at.desc())
        .limit(1)
    )
    analysis = result.scalar_one_or_none()
    if not analysis:
        return DataResponse(data=None)

    return DataResponse(data=_analysis_to_dict(analysis))


@router.post("/channel", response_model=DataResponse, status_code=202)
async def analyze_channel(user: User = Depends(get_current_user)):
    task = celery_app.send_task(
        "app.tasks.analysis_tasks.analyze_channel",
        args=[str(user.id)],
    )
    return DataResponse(data={"task_id": task.id})


@router.post("/patterns", response_model=DataResponse, status_code=202)
async def identify_patterns(user: User = Depends(get_current_user)):
    task = celery_app.send_task(
        "app.tasks.analysis_tasks.generate_insights",
        args=[str(user.id)],
    )
    return DataResponse(data={"task_id": task.id})


def _analysis_to_dict(a: PerformanceAnalysis) -> dict:
    return {
        "id": str(a.id),
        "youtube_short_id": str(a.youtube_short_id),
        "script_id": str(a.script_id) if a.script_id else None,
        "scores": {
            "hook": a.hook_score,
            "rhythm": a.rhythm_score,
            "curiosity": a.curiosity_score,
            "retention": a.retention_score,
            "clarity": a.clarity_score,
            "promise_delivery": a.promise_delivery_score,
            "cta": a.cta_score,
            "narrative": a.narrative_score,
            "overall": a.overall_score,
        },
        "strengths": a.strengths,
        "weaknesses": a.weaknesses,
        "actionable_learnings": a.actionable_learnings,
        "script_correlation": a.script_correlation,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }
