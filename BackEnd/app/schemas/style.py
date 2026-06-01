import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class StyleVideoOut(BaseModel):
    id: uuid.UUID
    title: str

    model_config = {"from_attributes": True}


class StyleProfileOut(BaseModel):
    id: uuid.UUID
    name: str
    user_id: uuid.UUID | None = None
    visibility: str = "private"
    description: str | None = None
    tone: str | None = None
    pacing: str | None = None
    avg_sentence_length: float | None = None
    common_hooks: list[str] = []
    common_ctas: list[str] = []
    narrative_patterns: list[str] = []
    do_rules: list[str] = []
    avoid_rules: list[str] = []
    video_ids: list[uuid.UUID] = []
    videos: list[StyleVideoOut] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class StyleGenerateInput(BaseModel):
    video_ids: list[uuid.UUID] = Field(min_length=1)
    name: str = Field(max_length=300)
    visibility: str = Field(default="private", pattern="^(private|public)$")


class StyleUpdateInput(BaseModel):
    name: str | None = Field(default=None, max_length=300)
    visibility: str | None = Field(default=None, pattern="^(private|public)$")
    add_video_ids: list[uuid.UUID] = []
    remove_video_ids: list[uuid.UUID] = []
