import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PerformanceAnalysis(Base):
    __tablename__ = "performance_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    youtube_short_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("youtube_shorts.id", ondelete="CASCADE"), nullable=False
    )
    script_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="SET NULL"), nullable=True
    )

    # Scores (0-10)
    hook_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    rhythm_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    curiosity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    retention_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    clarity_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    promise_delivery_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    cta_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    narrative_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    overall_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Detailed analysis
    strengths: Mapped[list | None] = mapped_column(JSON, nullable=True)
    weaknesses: Mapped[list | None] = mapped_column(JSON, nullable=True)
    actionable_learnings: Mapped[list | None] = mapped_column(JSON, nullable=True)
    script_correlation: Mapped[list | None] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
