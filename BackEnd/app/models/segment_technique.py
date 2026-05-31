import uuid

from sqlalchemy import Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class SegmentTechnique(Base):
    __tablename__ = "segment_techniques"

    segment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transcript_segments.id", ondelete="CASCADE"),
        primary_key=True,
    )
    technique_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("techniques.id", ondelete="CASCADE"),
        primary_key=True,
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    evidence: Mapped[str | None] = mapped_column(Text, nullable=True)

    segment: Mapped["TranscriptSegment"] = relationship(back_populates="techniques")
    technique: Mapped["Technique"] = relationship()


from app.models.transcript_segment import TranscriptSegment  # noqa: E402
from app.models.technique import Technique  # noqa: E402
