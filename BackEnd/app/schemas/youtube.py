from pydantic import BaseModel


class ManualMetricsInput(BaseModel):
    youtube_short_id: str
    views: int
    likes: int = 0
    comments: int = 0
    shares: int = 0
    subscribers_gained: int = 0
    average_view_duration_seconds: float | None = None
    average_view_percentage: float | None = None
    impressions: int | None = None
    impressions_ctr: float | None = None
    published_at: str | None = None


class MetricsUpdateInput(BaseModel):
    views: int | None = None
    likes: int | None = None
    comments: int | None = None
    shares: int | None = None
    subscribers_gained: int | None = None
    average_view_duration_seconds: float | None = None
    average_view_percentage: float | None = None
    impressions: int | None = None
    impressions_ctr: float | None = None


class YouTubeShortOut(BaseModel):
    id: str
    youtube_video_id: str
    title: str | None
    description: str | None
    published_at: str | None
    thumbnail_url: str | None
    duration_seconds: int | None
    tags: list[str] | None
    transcript: str | None
    transcript_source: str | None
    script_id: str | None
    synced_at: str | None
    latest_metrics: dict | None = None
    analysis_status: dict | None = None
    script_link: dict | None = None

    model_config = {"from_attributes": True}


class ShortMetricsOut(BaseModel):
    id: str
    youtube_short_id: str
    views: int
    likes: int
    comments: int
    shares: int
    subscribers_gained: int
    average_view_duration_seconds: float | None
    average_view_percentage: float | None
    impressions: int | None
    impressions_ctr: float | None
    engagement_rate: float | None
    retention_score: float | None
    source: str
    collected_at: str | None
    published_at: str | None

    model_config = {"from_attributes": True}


class ShortScriptLinkInput(BaseModel):
    script_id: str
