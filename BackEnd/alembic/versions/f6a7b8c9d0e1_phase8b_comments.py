"""phase8b: youtube short comments + script experiments tables

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-01 22:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "f6a7b8c9d0e1"
down_revision: Union[str, None] = "e5f6a7b8c9d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "youtube_short_comments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "short_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("youtube_shorts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("youtube_comment_id", sa.String(100), unique=True, nullable=False),
        sa.Column("author_name", sa.String(300), nullable=True),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("like_count", sa.Integer, server_default="0"),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("sentiment", sa.String(30), nullable=True),
        sa.Column("sentiment_score", sa.Float, nullable=True),
        sa.Column("intent", sa.String(50), nullable=True),
        sa.Column("topics", postgresql.JSON, nullable=True),
        sa.Column("actionable_insight", sa.Text, nullable=True),
        sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_index("ix_ysc_short_id", "youtube_short_comments", ["short_id"])
    op.create_index("ix_ysc_user_id", "youtube_short_comments", ["user_id"])
    op.create_index("ix_ysc_sentiment", "youtube_short_comments", ["sentiment"])
    op.create_index("ix_ysc_intent", "youtube_short_comments", ["intent"])
    op.create_index("ix_ysc_analyzed_at", "youtube_short_comments", ["analyzed_at"])

    # Script experiments (A/B testing)
    op.create_table(
        "script_experiments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("name", sa.String(300), nullable=False),
        sa.Column("hypothesis", sa.Text, nullable=True),
        sa.Column("status", sa.String(30), server_default="draft"),
        sa.Column(
            "variant_a_script_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("scripts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "variant_b_script_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("scripts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "variant_a_short_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("youtube_shorts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "variant_b_short_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("youtube_shorts.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("winner", sa.String(10), nullable=True),
        sa.Column("result_summary", sa.Text, nullable=True),
        sa.Column("metrics_comparison", postgresql.JSON, nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    op.create_index("ix_se_user_id", "script_experiments", ["user_id"])
    op.create_index("ix_se_status", "script_experiments", ["status"])


def downgrade() -> None:
    op.drop_index("ix_se_status", table_name="script_experiments")
    op.drop_index("ix_se_user_id", table_name="script_experiments")
    op.drop_table("script_experiments")

    op.drop_index("ix_ysc_analyzed_at", table_name="youtube_short_comments")
    op.drop_index("ix_ysc_intent", table_name="youtube_short_comments")
    op.drop_index("ix_ysc_sentiment", table_name="youtube_short_comments")
    op.drop_index("ix_ysc_user_id", table_name="youtube_short_comments")
    op.drop_index("ix_ysc_short_id", table_name="youtube_short_comments")
    op.drop_table("youtube_short_comments")
