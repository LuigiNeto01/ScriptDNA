"""phase2: ownership and youtube short segments

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-01 12:30:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_constraint(
        "youtube_shorts_youtube_video_id_key",
        "youtube_shorts",
        type_="unique",
    )
    op.create_unique_constraint(
        "uq_youtube_shorts_user_video",
        "youtube_shorts",
        ["user_id", "youtube_video_id"],
    )

    op.add_column("videos", sa.Column("user_id", sa.UUID(), nullable=True))
    op.add_column("videos", sa.Column("visibility", sa.String(20), nullable=False, server_default="private"))
    op.create_foreign_key(
        "fk_videos_user_id",
        "videos",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("idx_videos_user_visibility", "videos", ["user_id", "visibility"])

    op.add_column("style_profiles", sa.Column("user_id", sa.UUID(), nullable=True))
    op.add_column("style_profiles", sa.Column("visibility", sa.String(20), nullable=False, server_default="private"))
    op.create_foreign_key(
        "fk_style_profiles_user_id",
        "style_profiles",
        "users",
        ["user_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("idx_style_profiles_user_visibility", "style_profiles", ["user_id", "visibility"])

    op.create_table(
        "youtube_short_segments",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("short_id", sa.UUID(), nullable=False),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("word_count", sa.Integer(), nullable=False),
        sa.Column("position_percent", sa.Float(), nullable=False),
        sa.Column("timing_source", sa.String(50), nullable=False, server_default="estimated"),
        sa.Column("embedding", Vector(1536), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["short_id"], ["youtube_shorts.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_youtube_short_segments_short", "youtube_short_segments", ["short_id"])

    op.create_table(
        "youtube_short_beats",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("short_id", sa.UUID(), nullable=False),
        sa.Column("segment_id", sa.UUID(), nullable=True),
        sa.Column("beat_type", sa.String(50), nullable=False),
        sa.Column("attention_goal", sa.Text(), nullable=True),
        sa.Column("curiosity_question", sa.Text(), nullable=True),
        sa.Column("retention_function", sa.Text(), nullable=True),
        sa.Column("emotion", sa.String(100), nullable=True),
        sa.Column("intensity_score", sa.Float(), nullable=True),
        sa.Column("techniques", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["short_id"], ["youtube_shorts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["segment_id"], ["youtube_short_segments.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_youtube_short_beats_short", "youtube_short_beats", ["short_id"])


def downgrade() -> None:
    op.drop_constraint(
        "uq_youtube_shorts_user_video",
        "youtube_shorts",
        type_="unique",
    )
    op.create_unique_constraint(
        "youtube_shorts_youtube_video_id_key",
        "youtube_shorts",
        ["youtube_video_id"],
    )

    op.drop_index("idx_youtube_short_beats_short", table_name="youtube_short_beats")
    op.drop_table("youtube_short_beats")
    op.drop_index("idx_youtube_short_segments_short", table_name="youtube_short_segments")
    op.drop_table("youtube_short_segments")

    op.drop_index("idx_style_profiles_user_visibility", table_name="style_profiles")
    op.drop_constraint("fk_style_profiles_user_id", "style_profiles", type_="foreignkey")
    op.drop_column("style_profiles", "visibility")
    op.drop_column("style_profiles", "user_id")

    op.drop_index("idx_videos_user_visibility", table_name="videos")
    op.drop_constraint("fk_videos_user_id", "videos", type_="foreignkey")
    op.drop_column("videos", "visibility")
    op.drop_column("videos", "user_id")
