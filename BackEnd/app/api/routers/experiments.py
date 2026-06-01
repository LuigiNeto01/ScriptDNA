"""
[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/experiments
Resposta 200: { data: [...] }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/experiments
Body: { name, hypothesis?, variant_a_script_id?, variant_b_script_id? }
Resposta 201: { data: {...} }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/experiments/:id
Resposta 200: { data: {...} }

[ENDPOINT DOCUMENTADO]
Método: PATCH
Rota: /api/experiments/:id
Body: partial update fields
Resposta 200: { data: {...} }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/experiments/:id/complete
Body: { winner: "a"|"b"|"tie" }
Resposta 200: { data: {...} }
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.script_experiment import ScriptExperiment
from app.models.user import User
from app.schemas.common import DataResponse

router = APIRouter()


class ExperimentCreateInput(BaseModel):
    name: str = Field(min_length=3, max_length=300)
    hypothesis: str | None = Field(default=None, max_length=2000)
    variant_a_script_id: uuid.UUID | None = None
    variant_b_script_id: uuid.UUID | None = None


class ExperimentUpdateInput(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=300)
    hypothesis: str | None = None
    status: str | None = None
    variant_a_script_id: uuid.UUID | None = None
    variant_b_script_id: uuid.UUID | None = None
    variant_a_short_id: uuid.UUID | None = None
    variant_b_short_id: uuid.UUID | None = None


class ExperimentCompleteInput(BaseModel):
    winner: str = Field(pattern="^(a|b|tie)$")
    result_summary: str | None = None


@router.get("", response_model=DataResponse)
async def list_experiments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ScriptExperiment)
        .where(ScriptExperiment.user_id == user.id)
        .order_by(ScriptExperiment.created_at.desc())
        .limit(50)
    )
    experiments = result.scalars().all()
    return DataResponse(data=[_serialize(e) for e in experiments])


@router.post("", response_model=DataResponse, status_code=201)
async def create_experiment(
    body: ExperimentCreateInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    experiment = ScriptExperiment(
        user_id=user.id,
        name=body.name,
        hypothesis=body.hypothesis,
        variant_a_script_id=body.variant_a_script_id,
        variant_b_script_id=body.variant_b_script_id,
    )
    db.add(experiment)
    await db.commit()
    await db.refresh(experiment)
    return DataResponse(data=_serialize(experiment))


@router.get("/{experiment_id}", response_model=DataResponse)
async def get_experiment(
    experiment_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    experiment = await _get_user_experiment(experiment_id, user.id, db)
    return DataResponse(data=_serialize(experiment))


@router.patch("/{experiment_id}", response_model=DataResponse)
async def update_experiment(
    experiment_id: uuid.UUID,
    body: ExperimentUpdateInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    experiment = await _get_user_experiment(experiment_id, user.id, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "status" and value == "running" and not experiment.started_at:
            experiment.started_at = datetime.now(timezone.utc)
        setattr(experiment, field, value)

    await db.commit()
    await db.refresh(experiment)
    return DataResponse(data=_serialize(experiment))


@router.post("/{experiment_id}/complete", response_model=DataResponse)
async def complete_experiment(
    experiment_id: uuid.UUID,
    body: ExperimentCompleteInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    experiment = await _get_user_experiment(experiment_id, user.id, db)

    if experiment.status == "completed":
        raise HTTPException(status_code=400, detail="Experiment already completed")

    experiment.status = "completed"
    experiment.winner = body.winner
    experiment.result_summary = body.result_summary
    experiment.completed_at = datetime.now(timezone.utc)

    # Auto-compare metrics if both shorts are linked
    if experiment.variant_a_short_id and experiment.variant_b_short_id:
        experiment.metrics_comparison = await _compare_metrics(
            experiment.variant_a_short_id,
            experiment.variant_b_short_id,
            db,
        )

    await db.commit()
    await db.refresh(experiment)
    return DataResponse(data=_serialize(experiment))


async def _get_user_experiment(
    experiment_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession
) -> ScriptExperiment:
    result = await db.execute(
        select(ScriptExperiment).where(
            ScriptExperiment.id == experiment_id,
            ScriptExperiment.user_id == user_id,
        )
    )
    experiment = result.scalar_one_or_none()
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return experiment


async def _compare_metrics(
    short_a_id: uuid.UUID, short_b_id: uuid.UUID, db: AsyncSession
) -> dict:
    from app.models.youtube import ShortMetrics

    async def _latest(short_id: uuid.UUID) -> dict:
        result = await db.execute(
            select(ShortMetrics)
            .where(ShortMetrics.youtube_short_id == short_id)
            .order_by(ShortMetrics.collected_at.desc())
            .limit(1)
        )
        m = result.scalar_one_or_none()
        if not m:
            return {}
        return {
            "views": m.views,
            "likes": m.likes,
            "comments": m.comments,
            "engagement_rate": m.engagement_rate,
            "average_view_percentage": m.average_view_percentage,
        }

    return {
        "variant_a": await _latest(short_a_id),
        "variant_b": await _latest(short_b_id),
    }


def _serialize(experiment: ScriptExperiment) -> dict:
    return {
        "id": str(experiment.id),
        "name": experiment.name,
        "hypothesis": experiment.hypothesis,
        "status": experiment.status,
        "variant_a_script_id": str(experiment.variant_a_script_id) if experiment.variant_a_script_id else None,
        "variant_b_script_id": str(experiment.variant_b_script_id) if experiment.variant_b_script_id else None,
        "variant_a_short_id": str(experiment.variant_a_short_id) if experiment.variant_a_short_id else None,
        "variant_b_short_id": str(experiment.variant_b_short_id) if experiment.variant_b_short_id else None,
        "winner": experiment.winner,
        "result_summary": experiment.result_summary,
        "metrics_comparison": experiment.metrics_comparison,
        "started_at": experiment.started_at.isoformat() if experiment.started_at else None,
        "completed_at": experiment.completed_at.isoformat() if experiment.completed_at else None,
        "created_at": experiment.created_at.isoformat() if experiment.created_at else None,
    }
