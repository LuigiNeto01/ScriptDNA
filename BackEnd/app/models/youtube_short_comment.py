import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class YouTubeShortComment(Base):
    __tablename__ = "youtube_short_comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    short_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("youtube_shorts.id", ondelete="CASCADE"), nullable=False
    )
    youtube_comment_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    author_name: Mapped[str | None] = mapped_column(String(300), nullable=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    like_count: Mapped[int] = mapped_column(Integer, default=0)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Analysis fields (filled by CommentAnalysisAgent)
    sentiment: Mapped[str | None] = mapped_column(String(30), nullable=True)  # positive, negative, neutral, mixed
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # -1.0 to 1.0
    intent: Mapped[str | None] = mapped_column(String(50), nullable=True)  # praise, question, suggestion, complaint, spam
    topics: Mapped[list | None] = mapped_column(JSON, nullable=True)  # ["humor", "editing", "content"]
    actionable_insight: Mapped[str | None] = mapped_column(Text, nullable=True)

    analyzed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
