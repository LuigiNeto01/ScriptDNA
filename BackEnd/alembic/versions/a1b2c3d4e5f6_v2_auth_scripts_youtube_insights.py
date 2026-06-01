"""v2: auth, scripts versioning, youtube integration, insights, suggestions, performance analyses

Revision ID: a1b2c3d4e5f6
Revises: e148c9c6624d
Create Date: 2026-05-31 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e148c9c6624d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ─── Users ────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("avatar_url", sa.String(2000), nullable=True),
        sa.Column("youtube_channel_id", sa.String(50), nullable=True),
        sa.Column("youtube_channel_name", sa.String(255), nullable=True),
        sa.Column("youtube_access_token", sa.String(2000), nullable=True),
        sa.Column("youtube_refresh_token", sa.String(2000), nullable=True),
        sa.Column("youtube_token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    # ─── Script Status Enum ───────────────────────────────────────────
    script_status = postgresql.ENUM(
        "draft", "approved", "published", "analyzed", "archived",
        name="script_status", create_type=False,
    )
    script_status.create(op.get_bind(), checkfirst=True)

    # ─── Scripts ──────────────────────────────────────────────────────
    op.create_table(
        "scripts",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("current_version_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("theme", sa.String(255), nullable=True),
        sa.Column("objective", sa.Text(), nullable=True),
        sa.Column("niche", sa.String(100), nullable=True),
        sa.Column("speaking_style", sa.String(100), nullable=True),
        sa.Column("estimated_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("status", script_status, server_default="draft"),
        sa.Column("youtube_video_id", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    # ─── Script Versions ──────────────────────────────────────────────
    op.create_table(
        "script_versions",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("script_id", sa.UUID(), nullable=False),
        sa.Column("version_number", sa.Integer(), nullable=False),
        sa.Column("hook", sa.Text(), nullable=True),
        sa.Column("narrative_structure", postgresql.JSON(), nullable=True),
        sa.Column("cta", sa.Text(), nullable=True),
        sa.Column("lines", postgresql.JSON(), nullable=True),
        sa.Column("analysis", postgresql.JSON(), nullable=True),
        sa.Column("generation_params", postgresql.JSON(), nullable=True),
        sa.Column("change_summary", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(50), server_default="user"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["script_id"], ["scripts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("script_id", "version_number"),
    )
    op.create_index("idx_script_versions_script", "script_versions", ["script_id", sa.text("version_number DESC")])

    # Add FK from scripts.current_version_id to script_versions.id
    op.create_foreign_key(
        "fk_scripts_current_version",
        "scripts", "script_versions",
        ["current_version_id"], ["id"],
    )

    # ─── YouTube Shorts ───────────────────────────────────────────────
    op.create_table(
        "youtube_shorts",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("youtube_video_id", sa.String(50), nullable=False),
        sa.Column("title", sa.String(500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("thumbnail_url", sa.String(2000), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("tags", postgresql.JSON(), nullable=True),
        sa.Column("transcript", sa.Text(), nullable=True),
        sa.Column("transcript_source", sa.String(50), nullable=True),
        sa.Column("script_id", sa.UUID(), nullable=True),
        sa.Column("synced_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("youtube_video_id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["script_id"], ["scripts.id"], ondelete="SET NULL"),
    )

    # ─── Short Metrics ────────────────────────────────────────────────
    op.create_table(
        "short_metrics",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("youtube_short_id", sa.UUID(), nullable=False),
        sa.Column("views", sa.Integer(), server_default="0"),
        sa.Column("likes", sa.Integer(), server_default="0"),
        sa.Column("comments", sa.Integer(), server_default="0"),
        sa.Column("shares", sa.Integer(), server_default="0"),
        sa.Column("subscribers_gained", sa.Integer(), server_default="0"),
        sa.Column("average_view_duration_seconds", sa.Float(), nullable=True),
        sa.Column("average_view_percentage", sa.Float(), nullable=True),
        sa.Column("impressions", sa.Integer(), nullable=True),
        sa.Column("impressions_ctr", sa.Float(), nullable=True),
        sa.Column("engagement_rate", sa.Float(), nullable=True),
        sa.Column("retention_score", sa.Float(), nullable=True),
        sa.Column("source", sa.String(50), server_default="manual"),
        sa.Column("collected_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["youtube_short_id"], ["youtube_shorts.id"], ondelete="CASCADE"),
    )

    # ─── Short Metrics History ────────────────────────────────────────
    op.create_table(
        "short_metrics_history",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("youtube_short_id", sa.UUID(), nullable=False),
        sa.Column("views", sa.Integer(), nullable=True),
        sa.Column("likes", sa.Integer(), nullable=True),
        sa.Column("comments", sa.Integer(), nullable=True),
        sa.Column("collected_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["youtube_short_id"], ["youtube_shorts.id"], ondelete="CASCADE"),
    )

    # ─── Insight Enums ────────────────────────────────────────────────
    insight_category = postgresql.ENUM(
        "hook", "retention", "cta", "narrative", "topic",
        "speaking_style", "timing", "audience", "general",
        name="insight_category", create_type=False,
    )
    insight_category.create(op.get_bind(), checkfirst=True)

    insight_sentiment = postgresql.ENUM(
        "positive", "negative", "neutral",
        name="insight_sentiment", create_type=False,
    )
    insight_sentiment.create(op.get_bind(), checkfirst=True)

    # ─── Channel Insights ─────────────────────────────────────────────
    op.create_table(
        "channel_insights",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("category", insight_category, nullable=False),
        sa.Column("sentiment", insight_sentiment, server_default="neutral"),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("evidence", postgresql.JSON(), nullable=True),
        sa.Column("niche", sa.String(100), nullable=True),
        sa.Column("theme", sa.String(255), nullable=True),
        sa.Column("speaking_style", sa.String(100), nullable=True),
        sa.Column("video_type", sa.String(100), nullable=True),
        sa.Column("confidence", sa.Float(), server_default="0.5"),
        sa.Column("times_validated", sa.Integer(), server_default="0"),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("embedding", Vector(1536), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    # ─── Suggestion Enums ─────────────────────────────────────────────
    suggestion_category = postgresql.ENUM(
        "high_view_potential", "high_retention_potential", "continuation",
        "variation", "experiment", "brand_reinforcement",
        name="suggestion_category", create_type=False,
    )
    suggestion_category.create(op.get_bind(), checkfirst=True)

    suggestion_status = postgresql.ENUM(
        "pending", "accepted", "rejected", "converted_to_script",
        name="suggestion_status", create_type=False,
    )
    suggestion_status.create(op.get_bind(), checkfirst=True)

    # ─── Video Suggestions ────────────────────────────────────────────
    op.create_table(
        "video_suggestions",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("justification", sa.Text(), nullable=False),
        sa.Column("category", suggestion_category, nullable=False),
        sa.Column("niche", sa.String(100), nullable=True),
        sa.Column("theme", sa.String(255), nullable=True),
        sa.Column("estimated_duration_seconds", sa.Integer(), nullable=True),
        sa.Column("suggested_hook", sa.Text(), nullable=True),
        sa.Column("suggested_structure", sa.Text(), nullable=True),
        sa.Column("based_on_shorts", postgresql.JSON(), nullable=True),
        sa.Column("based_on_insights", postgresql.JSON(), nullable=True),
        sa.Column("status", suggestion_status, server_default="pending"),
        sa.Column("converted_script_id", sa.UUID(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["converted_script_id"], ["scripts.id"], ondelete="SET NULL"),
    )

    # ─── Performance Analyses ─────────────────────────────────────────
    op.create_table(
        "performance_analyses",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("youtube_short_id", sa.UUID(), nullable=False),
        sa.Column("script_id", sa.UUID(), nullable=True),
        sa.Column("hook_score", sa.Float(), nullable=True),
        sa.Column("rhythm_score", sa.Float(), nullable=True),
        sa.Column("curiosity_score", sa.Float(), nullable=True),
        sa.Column("retention_score", sa.Float(), nullable=True),
        sa.Column("clarity_score", sa.Float(), nullable=True),
        sa.Column("promise_delivery_score", sa.Float(), nullable=True),
        sa.Column("cta_score", sa.Float(), nullable=True),
        sa.Column("narrative_score", sa.Float(), nullable=True),
        sa.Column("overall_score", sa.Float(), nullable=True),
        sa.Column("strengths", postgresql.JSON(), nullable=True),
        sa.Column("weaknesses", postgresql.JSON(), nullable=True),
        sa.Column("actionable_learnings", postgresql.JSON(), nullable=True),
        sa.Column("script_correlation", postgresql.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["youtube_short_id"], ["youtube_shorts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["script_id"], ["scripts.id"], ondelete="SET NULL"),
    )


def downgrade() -> None:
    op.drop_table("performance_analyses")
    op.drop_table("video_suggestions")
    op.drop_table("channel_insights")
    op.drop_table("short_metrics_history")
    op.drop_table("short_metrics")
    op.drop_table("youtube_shorts")
    op.drop_constraint("fk_scripts_current_version", "scripts", type_="foreignkey")
    op.drop_index("idx_script_versions_script", "script_versions")
    op.drop_table("script_versions")
    op.drop_table("scripts")
    op.drop_table("users")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS script_status")
    op.execute("DROP TYPE IF EXISTS insight_category")
    op.execute("DROP TYPE IF EXISTS insight_sentiment")
    op.execute("DROP TYPE IF EXISTS suggestion_category")
    op.execute("DROP TYPE IF EXISTS suggestion_status")
