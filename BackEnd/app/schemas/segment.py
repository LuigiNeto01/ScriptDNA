import uuid

from pydantic import BaseModel


class TechniqueOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class SegmentTechniqueOut(BaseModel):
    technique_id: uuid.UUID
    technique: TechniqueOut
    confidence: float | None = None
    evidence: str | None = None


class SegmentOut(BaseModel):
    id: uuid.UUID
    video_id: uuid.UUID
    start_time: float
    end_time: float
    text: str
    word_count: int
    position_percent: float
    techniques: list[SegmentTechniqueOut] = []

    model_config = {"from_attributes": True}
