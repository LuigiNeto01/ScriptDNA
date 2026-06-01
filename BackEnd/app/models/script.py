import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ScriptStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PUBLISHED = "published"
    ANALYZED = "analyzed"
    ARCHIVED = "archived"


class Script(Base):
    __tablename__ = "scripts"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    current_version_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    theme: Mapped[str | None] = mapped_column(String(255), nullable=True)
    objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    niche: Mapped[str | None] = mapped_column(String(100), nullable=True)
    speaking_style: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estimated_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[ScriptStatus] = mapped_column(
        Enum(
            ScriptStatus,
            name="script_status",
            values_callable=lambda enum_cls: [item.value for item in enum_cls],
        ),
        default=ScriptStatus.DRAFT,
    )
    youtube_video_id: Mapped[str | None] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    versions: Mapped[list["ScriptVersion"]] = relationship(
        back_populates="script", cascade="all, delete-orphan",
        order_by="ScriptVersion.version_number.desc()",
    )


class ScriptVersion(Base):
    __tablename__ = "script_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    script_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scripts.id", ondelete="CASCADE"), nullable=False
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Content
    hook: Mapped[str | None] = mapped_column(Text, nullable=True)
    narrative_structure: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cta: Mapped[str | None] = mapped_column(Text, nullable=True)
    lines: Mapped[list | None] = mapped_column(JSON, nullable=True)

    # Metadata
    analysis: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    generation_params: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    change_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str] = mapped_column(String(50), default="user")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    script: Mapped["Script"] = relationship(back_populates="versions")
