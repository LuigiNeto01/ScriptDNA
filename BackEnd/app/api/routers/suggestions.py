import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.celery_app import celery_app
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.script import Script, ScriptVersion
from app.models.suggestion import SuggestionCategory, SuggestionStatus, VideoSuggestion
from app.models.user import User
from app.schemas.common import DataResponse

router = APIRouter()


@router.get("", response_model=DataResponse)
async def list_suggestions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    category: SuggestionCategory | None = None,
    status_filter: SuggestionStatus | None = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    query = select(VideoSuggestion).where(VideoSuggestion.user_id == user.id)

    if category:
        query = query.where(VideoSuggestion.category == category)
    if status_filter:
        query = query.where(VideoSuggestion.status == status_filter)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(VideoSuggestion.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    suggestions = result.scalars().all()

    return DataResponse(data={
        "items": [_suggestion_to_dict(s) for s in suggestions],
        "total": total,
    })


@router.post("/generate", response_model=DataResponse, status_code=202)
async def generate_suggestions(user: User = Depends(get_current_user)):
    task = celery_app.send_task(
        "app.tasks.analysis_tasks.generate_suggestions",
        args=[str(user.id)],
    )
    return DataResponse(data={"task_id": task.id})


@router.patch("/{suggestion_id}", response_model=DataResponse)
async def update_suggestion_status(
    suggestion_id: uuid.UUID,
    status: SuggestionStatus,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VideoSuggestion)
        .where(VideoSuggestion.id == suggestion_id, VideoSuggestion.user_id == user.id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    suggestion.status = status
    await db.flush()
    return DataResponse(data=_suggestion_to_dict(suggestion))


@router.post("/{suggestion_id}/convert", response_model=DataResponse, status_code=201)
async def convert_to_script(
    suggestion_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(VideoSuggestion)
        .where(VideoSuggestion.id == suggestion_id, VideoSuggestion.user_id == user.id)
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    # Create script from suggestion
    script = Script(
        user_id=user.id,
        title=suggestion.title,
        theme=suggestion.theme,
        niche=suggestion.niche,
        estimated_duration_seconds=suggestion.estimated_duration_seconds,
    )
    db.add(script)
    await db.flush()

    # Create version 1 with suggestion content
    version = ScriptVersion(
        script_id=script.id,
        version_number=1,
        hook=suggestion.suggested_hook,
        narrative_structure=[{"type": "suggested", "text": suggestion.suggested_structure}] if suggestion.suggested_structure else None,
        generation_params={"from_suggestion": str(suggestion.id)},
        created_by="ai_generation",
    )
    db.add(version)
    await db.flush()

    script.current_version_id = version.id
    suggestion.status = SuggestionStatus.CONVERTED
    suggestion.converted_script_id = script.id
    await db.flush()

    return DataResponse(data={
        "script_id": str(script.id),
        "version_id": str(version.id),
    })


def _suggestion_to_dict(s: VideoSuggestion) -> dict:
    return {
        "id": str(s.id),
        "title": s.title,
        "description": s.description,
        "justification": s.justification,
        "category": s.category.value,
        "niche": s.niche,
        "theme": s.theme,
        "estimated_duration_seconds": s.estimated_duration_seconds,
        "suggested_hook": s.suggested_hook,
        "suggested_structure": s.suggested_structure,
        "based_on_shorts": s.based_on_shorts,
        "based_on_insights": s.based_on_insights,
        "status": s.status.value,
        "converted_script_id": str(s.converted_script_id) if s.converted_script_id else None,
        "confidence_score": s.confidence_score,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }
