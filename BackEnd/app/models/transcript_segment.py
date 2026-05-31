import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    video_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("videos.id", ondelete="CASCADE")
    )
    start_time: Mapped[float] = mapped_column(Float)
    end_time: Mapped[float] = mapped_column(Float)
    text: Mapped[str] = mapped_column(Text)
    word_count: Mapped[int] = mapped_column(Integer)
    position_percent: Mapped[float] = mapped_column(Float)
    embedding = mapped_column(Vector(1536), nullable=True)

    video: Mapped["Video"] = relationship(back_populates="segments")
    beat: Mapped["ScriptBeat | None"] = relationship(back_populates="segment")
    techniques: Mapped[list["SegmentTechnique"]] = relationship(
        back_populates="segment", cascade="all, delete-orphan"
    )


from app.models.video import Video  # noqa: E402
from app.models.script_beat import ScriptBeat  # noqa: E402
from app.models.segment_technique import SegmentTechnique  # noqa: E402
