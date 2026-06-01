import enum
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class InsightCategory(str, enum.Enum):
    HOOK = "hook"
    RETENTION = "retention"
    CTA = "cta"
    NARRATIVE = "narrative"
    TOPIC = "topic"
    SPEAKING_STYLE = "speaking_style"
    TIMING = "timing"
    AUDIENCE = "audience"
    GENERAL = "general"


class InsightSentiment(str, enum.Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class ChannelInsight(Base):
    __tablename__ = "channel_insights"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    category: Mapped[InsightCategory] = mapped_column(
        Enum(
            InsightCategory,
            name="insight_category",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
    )
    sentiment: Mapped[InsightSentiment] = mapped_column(
        Enum(
            InsightSentiment,
            name="insight_sentiment",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=InsightSentiment.NEUTRAL,
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[list | None] = mapped_column(JSON, nullable=True)

    niche: Mapped[str | None] = mapped_column(String(100), nullable=True)
    theme: Mapped[str | None] = mapped_column(String(255), nullable=True)
    speaking_style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    video_type: Mapped[str | None] = mapped_column(String(100), nullable=True)

    confidence: Mapped[float] = mapped_column(Float, default=0.5)
    times_validated: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    embedding = mapped_column(Vector(1536), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
