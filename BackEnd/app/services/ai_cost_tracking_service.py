"""Tracks and aggregates AI costs per user.

Reads from `ai_agent_runs` to provide cost summaries. Does not invent
costs when tokens are unknown — those runs are reported as `unknown`.
"""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_agent_run import AiAgentRun


class AiCostTrackingService:
    async def user_cost_summary(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
        days: int = 30,
    ) -> dict:
        """Return cost aggregation for a user over the last N days."""
        since = datetime.now(timezone.utc) - timedelta(days=days)

        result = await db.execute(
            select(
                func.count(AiAgentRun.id).label("total_runs"),
                func.sum(AiAgentRun.estimated_cost_usd).label("total_cost_usd"),
                func.sum(AiAgentRun.total_tokens).label("total_tokens"),
                func.sum(AiAgentRun.prompt_tokens).label("total_prompt_tokens"),
                func.sum(AiAgentRun.completion_tokens).label("total_completion_tokens"),
                func.avg(AiAgentRun.duration_ms).label("avg_duration_ms"),
            ).where(
                AiAgentRun.user_id == user_id,
                AiAgentRun.created_at >= since,
            )
        )
        row = result.one()

        # Count runs with unknown cost
        unknown_result = await db.execute(
            select(func.count(AiAgentRun.id)).where(
                AiAgentRun.user_id == user_id,
                AiAgentRun.created_at >= since,
                AiAgentRun.estimated_cost_usd.is_(None),
            )
        )
        unknown_count = unknown_result.scalar() or 0

        # Cost by agent
        agent_result = await db.execute(
            select(
                AiAgentRun.agent_name,
                func.count(AiAgentRun.id).label("runs"),
                func.sum(AiAgentRun.estimated_cost_usd).label("cost_usd"),
                func.sum(AiAgentRun.total_tokens).label("tokens"),
            )
            .where(
                AiAgentRun.user_id == user_id,
                AiAgentRun.created_at >= since,
            )
            .group_by(AiAgentRun.agent_name)
            .order_by(func.sum(AiAgentRun.estimated_cost_usd).desc().nullslast())
        )
        by_agent = [
            {
                "agent": r.agent_name,
                "runs": r.runs,
                "cost_usd": float(r.cost_usd) if r.cost_usd else 0.0,
                "tokens": r.tokens or 0,
            }
            for r in agent_result.all()
        ]

        # Error rate
        error_result = await db.execute(
            select(func.count(AiAgentRun.id)).where(
                AiAgentRun.user_id == user_id,
                AiAgentRun.created_at >= since,
                AiAgentRun.status == "error",
            )
        )
        error_count = error_result.scalar() or 0

        total_runs = row.total_runs or 0
        return {
            "period_days": days,
            "total_runs": total_runs,
            "total_cost_usd": float(row.total_cost_usd) if row.total_cost_usd else 0.0,
            "total_tokens": row.total_tokens or 0,
            "total_prompt_tokens": row.total_prompt_tokens or 0,
            "total_completion_tokens": row.total_completion_tokens or 0,
            "avg_duration_ms": round(float(row.avg_duration_ms)) if row.avg_duration_ms else 0,
            "unknown_cost_runs": unknown_count,
            "error_runs": error_count,
            "error_rate": round(error_count / total_runs, 4) if total_runs > 0 else 0.0,
            "by_agent": by_agent,
        }

    async def recent_runs(
        self,
        user_id: uuid.UUID,
        db: AsyncSession,
        limit: int = 20,
    ) -> list[dict]:
        """Return recent agent runs for a user."""
        result = await db.execute(
            select(AiAgentRun)
            .where(AiAgentRun.user_id == user_id)
            .order_by(AiAgentRun.created_at.desc())
            .limit(limit)
        )
        return [
            {
                "id": str(run.id),
                "agent_name": run.agent_name,
                "model": run.model,
                "status": run.status,
                "total_tokens": run.total_tokens,
                "estimated_cost_usd": run.estimated_cost_usd,
                "duration_ms": run.duration_ms,
                "error_message": run.error_message,
                "created_at": run.created_at.isoformat() if run.created_at else None,
            }
            for run in result.scalars().all()
        ]
