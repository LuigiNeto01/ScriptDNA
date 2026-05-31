"""
[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/tasks/:task_id
Resposta 200: { data: { task_id: str, status: str, progress?: float, current_step?: str, result?: dict, error?: str } }

[BREAKING CHANGE] Endpoint GET /api/tasks/:task_id
Motivo: status agora é lowercase (pending, started, success, failure, retry). Adicionados campos progress e current_step.
Migração necessária no Frontend Agent: usar status lowercase e consumir progress/current_step.
"""
from fastapi import APIRouter

from app.core.celery_app import celery_app
from app.schemas.common import DataResponse
from app.schemas.task import TaskStatusOut

router = APIRouter()

_STATUS_MAP = {
    "PENDING": "pending",
    "STARTED": "started",
    "SUCCESS": "success",
    "FAILURE": "failure",
    "RETRY": "retry",
    "PROGRESS": "started",
}


@router.get("/{task_id}", response_model=DataResponse)
async def get_task_status(task_id: str):
    result = celery_app.AsyncResult(task_id)

    error = None
    task_result = None
    progress = None
    current_step = None

    status = _STATUS_MAP.get(result.state, result.state.lower())

    if result.state == "FAILURE":
        error = str(result.result)
    elif result.state == "SUCCESS":
        task_result = result.result
        progress = 1.0
    elif result.state == "PROGRESS":
        meta = result.info or {}
        progress = meta.get("progress")
        current_step = meta.get("current_step")

    return DataResponse(
        data=TaskStatusOut(
            task_id=task_id,
            status=status,
            progress=progress,
            current_step=current_step,
            result=task_result,
            error=error,
        )
    )
