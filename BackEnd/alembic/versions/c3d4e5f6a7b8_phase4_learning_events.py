"""phase4: learning events and script adherence

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-01 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "performance_analyses",
        sa.Column("script_adherence", postgresql.JSON(), nullable=True),
    )
    op.create_table(
        "learning_events",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("short_id", sa.UUID(), nullable=False),
        sa.Column("performance_analysis_id", sa.UUID(), nullable=True),
        sa.Column("event_type", sa.String(80), nullable=False, server_default="performance_analysis"),
        sa.Column("status", sa.String(50), nullable=False, server_default="pending"),
        sa.Column("metadata_json", postgresql.JSON(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["short_id"], ["youtube_shorts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["performance_analysis_id"],
            ["performance_analyses.id"],
            ondelete="SET NULL",
        ),
    )
    op.create_index("idx_learning_events_user_status", "learning_events", ["user_id", "status"])
    op.create_index("idx_learning_events_short", "learning_events", ["short_id"])
    op.create_unique_constraint(
        "uq_learning_event_analysis_type",
        "learning_events",
        ["performance_analysis_id", "event_type"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_learning_event_analysis_type", "learning_events", type_="unique")
    op.drop_index("idx_learning_events_short", table_name="learning_events")
    op.drop_index("idx_learning_events_user_status", table_name="learning_events")
    op.drop_table("learning_events")
    op.drop_column("performance_analyses", "script_adherence")
