import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class StyleProfile(Base):
    __tablename__ = "style_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    tone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    pacing: Mapped[str | None] = mapped_column(String(100), nullable=True)
    avg_sentence_length: Mapped[float | None] = mapped_column(Float, nullable=True)
    common_hooks = mapped_column(JSONB, nullable=True)
    common_ctas = mapped_column(JSONB, nullable=True)
    narrative_patterns = mapped_column(JSONB, nullable=True)
    do_rules = mapped_column(JSONB, nullable=True)
    avoid_rules = mapped_column(JSONB, nullable=True)
    visibility: Mapped[str] = mapped_column(String(20), default="private")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    videos: Mapped[list["Video"]] = relationship(
        secondary="style_videos", lazy="selectin"
    )


from app.models.video import Video  # noqa: E402
