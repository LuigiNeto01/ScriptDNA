import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class YouTubeShort(Base):
    __tablename__ = "youtube_shorts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    youtube_video_id: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(2000), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, nullable=True)
    transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    transcript_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    script_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="SET NULL"), nullable=True
    )

    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    metrics: Mapped[list["ShortMetrics"]] = relationship(
        back_populates="youtube_short", cascade="all, delete-orphan"
    )


class ShortMetrics(Base):
    __tablename__ = "short_metrics"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    youtube_short_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("youtube_shorts.id", ondelete="CASCADE"), nullable=False
    )

    # Basic metrics
    views: Mapped[int] = mapped_column(Integer, default=0)
    likes: Mapped[int] = mapped_column(Integer, default=0)
    comments: Mapped[int] = mapped_column(Integer, default=0)
    shares: Mapped[int] = mapped_column(Integer, default=0)
    subscribers_gained: Mapped[int] = mapped_column(Integer, default=0)

    # Advanced metrics
    average_view_duration_seconds: Mapped[float | None] = mapped_column(Float, nullable=True)
    average_view_percentage: Mapped[float | None] = mapped_column(Float, nullable=True)
    impressions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impressions_ctr: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Derived
    engagement_rate: Mapped[float | None] = mapped_column(Float, nullable=True)
    retention_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    source: Mapped[str] = mapped_column(String(50), default="manual")
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    youtube_short: Mapped["YouTubeShort"] = relationship(back_populates="metrics")


class ShortMetricsHistory(Base):
    __tablename__ = "short_metrics_history"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    youtube_short_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("youtube_shorts.id", ondelete="CASCADE"), nullable=False
    )
    views: Mapped[int | None] = mapped_column(Integer, nullable=True)
    likes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comments: Mapped[int | None] = mapped_column(Integer, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
