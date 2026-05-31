import uuid

from pydantic import BaseModel, Field


class SearchInput(BaseModel):
    query: str = Field(min_length=3, max_length=500)
    limit: int = Field(default=10, ge=1, le=50)
    niche: str | None = None


class SearchSegment(BaseModel):
    id: uuid.UUID
    text: str
    start_time: float
    end_time: float


class SearchVideo(BaseModel):
    id: uuid.UUID
    title: str


class SearchResult(BaseModel):
    segment: SearchSegment
    video: SearchVideo
    score: float
