import enum
import uuid

from sqlalchemy import Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class BeatType(str, enum.Enum):
    HOOK = "hook"
    SETUP = "setup"
    CONFLICT = "conflict"
    ESCALATION = "escalation"
    PAYOFF = "payoff"
    CTA = "cta"


class ScriptBeat(Base):
    __tablename__ = "script_beats"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    video_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE")
    )
    segment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transcript_segments.id", ondelete="SET NULL"),
        nullable=True,
    )
    beat_type: Mapped[BeatType] = mapped_column(Enum(BeatType, name="beat_type"))
    attention_goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    curiosity_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    retention_function: Mapped[str | None] = mapped_column(Text, nullable=True)
    emotion: Mapped[str | None] = mapped_column(String(100), nullable=True)
    intensity_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    video: Mapped["Video"] = relationship(back_populates="beats")
    segment: Mapped["TranscriptSegment | None"] = relationship(back_populates="beat")


from app.models.video import Video  # noqa: E402
from app.models.transcript_segment import TranscriptSegment  # noqa: E402
