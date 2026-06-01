"""
[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/strategy/weekly
Resposta 202: { data: { task_id: ... } }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/strategy/trends
Resposta 200: { data: [...] }
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import RateLimiter
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.common import DataResponse
from app.services.trend_detection_service import TrendDetectionService

router = APIRouter()

_weekly_limiter = RateLimiter(per_minute=1, per_day=5, resource="weekly_strategy")


@router.post("/weekly", response_model=DataResponse, status_code=202)
async def generate_weekly(
    user: User = Depends(get_current_user),
    _rl=Depends(_weekly_limiter),
):
    from app.tasks.analysis_tasks import generate_weekly_strategy

    task = generate_weekly_strategy.delay(str(user.id))
    return DataResponse(data={"task_id": task.id})


@router.get("/trends", response_model=DataResponse)
async def get_trends(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = TrendDetectionService()
    trends = await service.detect_trends(user.id, db, weeks=4)
    return DataResponse(data=trends)
