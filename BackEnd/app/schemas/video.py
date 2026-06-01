import uuid
from datetime import datetime

from pydantic import BaseModel, Field, HttpUrl

from app.models.video import VideoStatus


class VideoTextInput(BaseModel):
    title: str = Field(max_length=500)
    text: str = Field(min_length=10)
    creator_name: str | None = Field(default=None, max_length=200)
    niche: str | None = Field(default=None, max_length=100)
    visibility: str = Field(default="private", pattern="^(private|public)$")


class VideoUrlInput(BaseModel):
    url: HttpUrl
    title: str | None = Field(default=None, max_length=500)
    creator_name: str | None = Field(default=None, max_length=200)
    niche: str | None = Field(default=None, max_length=100)
    visibility: str = Field(default="private", pattern="^(private|public)$")


class VideoOut(BaseModel):
    id: uuid.UUID
    title: str
    source_type: str
    source_url: str | None = None
    duration_seconds: int | None = None
    creator_name: str | None = None
    niche: str | None = None
    visibility: str = "private"
    status: VideoStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class VideoCreated(BaseModel):
    video_id: uuid.UUID
    status: VideoStatus
    task_id: str | None = None


class VideoListParams(BaseModel):
    niche: str | None = None
    creator_name: str | None = None
    status: VideoStatus | None = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class BatchUrlItem(BaseModel):
    url: HttpUrl
    title: str | None = Field(default=None, max_length=500)
    creator_name: str | None = Field(default=None, max_length=200)
    niche: str | None = Field(default=None, max_length=100)
    visibility: str = Field(default="private", pattern="^(private|public)$")


class BatchUrlInput(BaseModel):
    videos: list[BatchUrlItem] = Field(min_length=1, max_length=50)
    creator_name: str | None = Field(default=None, max_length=200)
    niche: str | None = Field(default=None, max_length=100)


class BatchVideoCreated(BaseModel):
    video_id: uuid.UUID
    url: str
    task_id: str
