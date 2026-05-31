from pydantic import BaseModel


class TaskStatusOut(BaseModel):
    task_id: str
    status: str  # pending | started | success | failure | retry
    progress: float | None = None  # 0.0 - 1.0
    current_step: str | None = None
    result: dict | None = None
    error: str | None = None
