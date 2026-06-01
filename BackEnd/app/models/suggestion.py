import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SuggestionCategory(str, enum.Enum):
    HIGH_VIEW_POTENTIAL = "high_view_potential"
    HIGH_RETENTION_POTENTIAL = "high_retention_potential"
    CONTINUATION = "continuation"
    VARIATION = "variation"
    EXPERIMENT = "experiment"
    BRAND_REINFORCEMENT = "brand_reinforcement"


class SuggestionStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    CONVERTED = "converted_to_script"


class VideoSuggestion(Base):
    __tablename__ = "video_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    justification: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[SuggestionCategory] = mapped_column(
        Enum(
            SuggestionCategory,
            name="suggestion_category",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        nullable=False,
    )

    niche: Mapped[str | None] = mapped_column(String(100), nullable=True)
    theme: Mapped[str | None] = mapped_column(String(255), nullable=True)
    estimated_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    suggested_hook: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_structure: Mapped[str | None] = mapped_column(Text, nullable=True)

    based_on_shorts: Mapped[list | None] = mapped_column(JSON, nullable=True)
    based_on_insights: Mapped[list | None] = mapped_column(JSON, nullable=True)

    status: Mapped[SuggestionStatus] = mapped_column(
        Enum(
            SuggestionStatus,
            name="suggestion_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=SuggestionStatus.PENDING,
    )
    converted_script_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="SET NULL"), nullable=True
    )
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
