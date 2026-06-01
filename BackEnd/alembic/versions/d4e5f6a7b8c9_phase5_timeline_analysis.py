"""phase5: retention windows and timeline analysis

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-01 17:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("performance_analyses", sa.Column("timeline_analysis", postgresql.JSON(), nullable=True))
    op.add_column("performance_analyses", sa.Column("beat_scores", postgresql.JSON(), nullable=True))
    op.create_table(
        "short_retention_windows",
        sa.Column("id", sa.UUID(), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("short_id", sa.UUID(), nullable=False),
        sa.Column("start_time", sa.Float(), nullable=False),
        sa.Column("end_time", sa.Float(), nullable=False),
        sa.Column("retention_percentage", sa.Float(), nullable=True),
        sa.Column("relative_retention", sa.Float(), nullable=True),
        sa.Column("drop_rate", sa.Float(), nullable=True),
        sa.Column("source", sa.String(50), nullable=False, server_default="manual"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["short_id"], ["youtube_shorts.id"], ondelete="CASCADE"),
    )
    op.create_index("idx_short_retention_windows_short", "short_retention_windows", ["short_id"])


def downgrade() -> None:
    op.drop_index("idx_short_retention_windows_short", table_name="short_retention_windows")
    op.drop_table("short_retention_windows")
    op.drop_column("performance_analyses", "beat_scores")
    op.drop_column("performance_analyses", "timeline_analysis")
