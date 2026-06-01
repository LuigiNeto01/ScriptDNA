import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.insight import ChannelInsight, InsightCategory, InsightSentiment
from app.models.user import User
from app.schemas.common import DataResponse

router = APIRouter()


@router.get("", response_model=DataResponse)
async def list_insights(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    category: InsightCategory | None = None,
    sentiment: InsightSentiment | None = None,
    niche: str | None = None,
    active_only: bool = True,
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    query = select(ChannelInsight).where(ChannelInsight.user_id == user.id)

    if active_only:
        query = query.where(ChannelInsight.is_active == True)  # noqa: E712
    if category:
        query = query.where(ChannelInsight.category == category)
    if sentiment:
        query = query.where(ChannelInsight.sentiment == sentiment)
    if niche:
        query = query.where(ChannelInsight.niche == niche)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(ChannelInsight.confidence.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    insights = result.scalars().all()

    return DataResponse(data={
        "items": [_insight_to_dict(i) for i in insights],
        "total": total,
    })


@router.get("/{insight_id}", response_model=DataResponse)
async def get_insight(
    insight_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChannelInsight)
        .where(ChannelInsight.id == insight_id, ChannelInsight.user_id == user.id)
    )
    insight = result.scalar_one_or_none()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    return DataResponse(data=_insight_to_dict(insight))


@router.patch("/{insight_id}", response_model=DataResponse)
async def update_insight(
    insight_id: uuid.UUID,
    is_active: bool | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChannelInsight)
        .where(ChannelInsight.id == insight_id, ChannelInsight.user_id == user.id)
    )
    insight = result.scalar_one_or_none()
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")

    if is_active is not None:
        insight.is_active = is_active

    await db.flush()
    return DataResponse(data=_insight_to_dict(insight))


@router.post("/generate", response_model=DataResponse, status_code=202)
async def generate_insights(user: User = Depends(get_current_user)):
    task = celery_app.send_task(
        "app.tasks.analysis_tasks.generate_insights",
        args=[str(user.id)],
    )
    return DataResponse(data={"task_id": task.id})


def _insight_to_dict(i: ChannelInsight) -> dict:
    return {
        "id": str(i.id),
        "category": i.category.value,
        "sentiment": i.sentiment.value,
        "title": i.title,
        "description": i.description,
        "evidence": i.evidence,
        "niche": i.niche,
        "theme": i.theme,
        "speaking_style": i.speaking_style,
        "video_type": i.video_type,
        "confidence": i.confidence,
        "times_validated": i.times_validated,
        "is_active": i.is_active,
        "created_at": i.created_at.isoformat() if i.created_at else None,
        "updated_at": i.updated_at.isoformat() if i.updated_at else None,
    }
