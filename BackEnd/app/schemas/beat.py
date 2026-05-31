import uuid

from pydantic import BaseModel

from app.models.script_beat import BeatType


class BeatOut(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    segment_id: uuid.UUID | None = None
    beat_type: BeatType
    attention_goal: str | None = None
    curiosity_question: str | None = None
    retention_function: str | None = None
    emotion: str | None = None
    intensity_score: float | None = None

    model_config = {"from_attributes": True}
