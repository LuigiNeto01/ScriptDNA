"""phase7: observability, rate limiting, cost tracking, indices

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-01 20:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e5f6a7b8c9d0"
down_revision: Union[str, None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- ai_agent_runs ---
    op.create_table(
        "ai_agent_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("agent_name", sa.String(120), nullable=False),
        sa.Column("model", sa.String(80), nullable=True),
        sa.Column("input_summary", sa.Text, nullable=True),
        sa.Column("output_summary", sa.Text, nullable=True),
        sa.Column("prompt_tokens", sa.Integer, nullable=True),
        sa.Column("completion_tokens", sa.Integer, nullable=True),
        sa.Column("total_tokens", sa.Integer, nullable=True),
        sa.Column("estimated_cost_usd", sa.Float, nullable=True),
        sa.Column("duration_ms", sa.Integer, nullable=True),
        sa.Column("status", sa.String(30), server_default="success"),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("metadata_json", postgresql.JSON, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )

    # --- Indices for ai_agent_runs ---
    op.create_index("ix_ai_agent_runs_user_id", "ai_agent_runs", ["user_id"])
    op.create_index("ix_ai_agent_runs_agent_name", "ai_agent_runs", ["agent_name"])
    op.create_index("ix_ai_agent_runs_created_at", "ai_agent_runs", ["created_at"])

    # --- Indices for existing tables (performance) ---
    # youtube_shorts
    op.create_index(
        "ix_youtube_shorts_user_id",
        "youtube_shorts",
        ["user_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_youtube_shorts_youtube_video_id",
        "youtube_shorts",
        ["youtube_video_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_youtube_shorts_created_at",
        "youtube_shorts",
        ["created_at"],
        if_not_exists=True,
    )

    # short_metrics
    op.create_index(
        "ix_short_metrics_youtube_short_id",
        "short_metrics",
        ["youtube_short_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_short_metrics_collected_at",
        "short_metrics",
        ["collected_at"],
        if_not_exists=True,
    )

    # videos
    op.create_index(
        "ix_videos_user_id",
        "videos",
        ["user_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_videos_created_at",
        "videos",
        ["created_at"],
        if_not_exists=True,
    )

    # scripts
    op.create_index(
        "ix_scripts_user_id",
        "scripts",
        ["user_id"],
        if_not_exists=True,
    )

    # style_profiles
    op.create_index(
        "ix_style_profiles_user_id",
        "style_profiles",
        ["user_id"],
        if_not_exists=True,
    )

    # learning_events
    op.create_index(
        "ix_learning_events_user_id",
        "learning_events",
        ["user_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_learning_events_created_at",
        "learning_events",
        ["created_at"],
        if_not_exists=True,
    )

    # performance_analyses
    op.create_index(
        "ix_performance_analyses_youtube_short_id",
        "performance_analyses",
        ["youtube_short_id"],
        if_not_exists=True,
    )
    op.create_index(
        "ix_performance_analyses_created_at",
        "performance_analyses",
        ["created_at"],
        if_not_exists=True,
    )

    # channel_insights
    op.create_index(
        "ix_channel_insights_user_id_is_active",
        "channel_insights",
        ["user_id", "is_active"],
        if_not_exists=True,
    )

    # youtube_short_segments (pgvector ANN index)
    # HNSW index for cosine similarity on embeddings.
    # Safe: only created if the column exists and pgvector is enabled.
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'youtube_short_segments' AND column_name = 'embedding'
            ) THEN
                CREATE INDEX IF NOT EXISTS ix_yss_embedding_hnsw
                ON youtube_short_segments
                USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64);
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_yss_embedding_hnsw")

    op.drop_index("ix_channel_insights_user_id_is_active", table_name="channel_insights")
    op.drop_index("ix_performance_analyses_created_at", table_name="performance_analyses")
    op.drop_index("ix_performance_analyses_youtube_short_id", table_name="performance_analyses")
    op.drop_index("ix_learning_events_created_at", table_name="learning_events")
    op.drop_index("ix_learning_events_user_id", table_name="learning_events")
    op.drop_index("ix_style_profiles_user_id", table_name="style_profiles")
    op.drop_index("ix_scripts_user_id", table_name="scripts")
    op.drop_index("ix_videos_created_at", table_name="videos")
    op.drop_index("ix_videos_user_id", table_name="videos")
    op.drop_index("ix_short_metrics_collected_at", table_name="short_metrics")
    op.drop_index("ix_short_metrics_youtube_short_id", table_name="short_metrics")
    op.drop_index("ix_youtube_shorts_created_at", table_name="youtube_shorts")
    op.drop_index("ix_youtube_shorts_youtube_video_id", table_name="youtube_shorts")
    op.drop_index("ix_youtube_shorts_user_id", table_name="youtube_shorts")
    op.drop_index("ix_ai_agent_runs_created_at", table_name="ai_agent_runs")
    op.drop_index("ix_ai_agent_runs_agent_name", table_name="ai_agent_runs")
    op.drop_index("ix_ai_agent_runs_user_id", table_name="ai_agent_runs")
    op.drop_table("ai_agent_runs")
