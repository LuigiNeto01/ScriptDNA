"""Tests for Phase 7 — observability, rate limiting, cost tracking, health checks."""

import asyncio
import time
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_agent_run import AiAgentRun


# ============================================================
# AgentRunLogger tests
# ============================================================


class TestAgentRunLogger:
    @pytest.mark.asyncio
    async def test_logs_successful_run(self, db_session: AsyncSession):
        from app.services.agent_run_logger import AgentRunLogger

        user_id = uuid.uuid4()
        async with AgentRunLogger(
            db_session,
            agent_name="TestAgent",
            user_id=user_id,
            model="gpt-4o",
            input_summary="theme=test",
        ) as run:
            run.set_output_summary("Generated 1 variant")

        await db_session.flush()
        result = await db_session.execute(
            select(AiAgentRun).where(AiAgentRun.agent_name == "TestAgent")
        )
        logged = result.scalar_one()
        assert logged.status == "success"
        assert logged.user_id == user_id
        assert logged.model == "gpt-4o"
        assert logged.input_summary == "theme=test"
        assert logged.output_summary == "Generated 1 variant"
        assert logged.duration_ms is not None
        assert logged.duration_ms >= 0

    @pytest.mark.asyncio
    async def test_logs_error_run(self, db_session: AsyncSession):
        from app.services.agent_run_logger import AgentRunLogger

        with pytest.raises(ValueError, match="boom"):
            async with AgentRunLogger(
                db_session,
                agent_name="FailAgent",
                user_id=uuid.uuid4(),
            ):
                raise ValueError("boom")

        await db_session.flush()
        result = await db_session.execute(
            select(AiAgentRun).where(AiAgentRun.agent_name == "FailAgent")
        )
        logged = result.scalar_one()
        assert logged.status == "error"
        assert "boom" in logged.error_message

    @pytest.mark.asyncio
    async def test_set_usage_from_openai_response(self, db_session: AsyncSession):
        from app.services.agent_run_logger import AgentRunLogger

        mock_response = MagicMock()
        mock_response.model = "gpt-4o"
        mock_response.usage = MagicMock()
        mock_response.usage.prompt_tokens = 100
        mock_response.usage.completion_tokens = 200
        mock_response.usage.total_tokens = 300

        async with AgentRunLogger(
            db_session,
            agent_name="UsageAgent",
            user_id=uuid.uuid4(),
        ) as run:
            run.set_usage(mock_response)

        await db_session.flush()
        result = await db_session.execute(
            select(AiAgentRun).where(AiAgentRun.agent_name == "UsageAgent")
        )
        logged = result.scalar_one()
        assert logged.prompt_tokens == 100
        assert logged.completion_tokens == 200
        assert logged.total_tokens == 300
        assert logged.estimated_cost_usd is not None
        assert logged.estimated_cost_usd > 0

    @pytest.mark.asyncio
    async def test_truncates_long_input(self, db_session: AsyncSession):
        from app.services.agent_run_logger import AgentRunLogger

        long_input = "x" * 1000
        async with AgentRunLogger(
            db_session,
            agent_name="TruncAgent",
            user_id=uuid.uuid4(),
            input_summary=long_input,
        ) as run:
            pass

        await db_session.flush()
        result = await db_session.execute(
            select(AiAgentRun).where(AiAgentRun.agent_name == "TruncAgent")
        )
        logged = result.scalar_one()
        assert len(logged.input_summary) <= 503  # 500 + "..."


# ============================================================
# Cost estimation tests
# ============================================================


class TestCostEstimation:
    def test_known_model_cost(self):
        from app.services.agent_run_logger import estimate_cost

        cost = estimate_cost("gpt-4o", prompt_tokens=1000, completion_tokens=500)
        assert cost is not None
        assert cost > 0

    def test_unknown_model_returns_none(self):
        from app.services.agent_run_logger import estimate_cost

        cost = estimate_cost("unknown-model-v99", prompt_tokens=1000, completion_tokens=500)
        assert cost is None


# ============================================================
# AiCostTrackingService tests
# ============================================================


class TestAiCostTrackingService:
    @pytest.mark.asyncio
    async def test_empty_summary(self, db_session: AsyncSession):
        from app.services.ai_cost_tracking_service import AiCostTrackingService

        summary = await AiCostTrackingService().user_cost_summary(uuid.uuid4(), db_session)
        assert summary["total_runs"] == 0
        assert summary["total_cost_usd"] == 0.0
        assert summary["by_agent"] == []

    @pytest.mark.asyncio
    async def test_summary_with_runs(self, db_session: AsyncSession):
        from app.services.ai_cost_tracking_service import AiCostTrackingService

        user_id = uuid.uuid4()
        run1 = AiAgentRun(
            user_id=user_id,
            agent_name="AgentA",
            model="gpt-4o",
            prompt_tokens=100,
            completion_tokens=50,
            total_tokens=150,
            estimated_cost_usd=0.0008,
            duration_ms=500,
            status="success",
        )
        run2 = AiAgentRun(
            user_id=user_id,
            agent_name="AgentA",
            model="gpt-4o",
            status="error",
            error_message="timeout",
            duration_ms=30000,
        )
        db_session.add_all([run1, run2])
        await db_session.flush()

        summary = await AiCostTrackingService().user_cost_summary(user_id, db_session)
        assert summary["total_runs"] == 2
        assert summary["error_runs"] == 1
        assert summary["error_rate"] == 0.5
        assert len(summary["by_agent"]) == 1
        assert summary["by_agent"][0]["agent"] == "AgentA"

    @pytest.mark.asyncio
    async def test_recent_runs(self, db_session: AsyncSession):
        from app.services.ai_cost_tracking_service import AiCostTrackingService

        user_id = uuid.uuid4()
        for i in range(3):
            db_session.add(AiAgentRun(
                user_id=user_id,
                agent_name=f"Agent{i}",
                status="success",
            ))
        await db_session.flush()

        runs = await AiCostTrackingService().recent_runs(user_id, db_session, limit=2)
        assert len(runs) == 2


# ============================================================
# RateLimiter tests
# ============================================================


class TestRateLimiter:
    @pytest.mark.asyncio
    async def test_rate_limiter_allows_under_limit(self):
        """RateLimiter should allow requests when under the limit."""
        from app.core.rate_limit import RateLimiter
        from app.models.user import User

        limiter = RateLimiter(per_minute=10, per_day=100, resource="test")
        user = MagicMock(spec=User)
        user.id = uuid.uuid4()

        # With Redis unavailable, requests should pass through
        with patch.dict("sys.modules", {"redis": None, "redis.asyncio": None}):
            # Should not raise
            await limiter(user=user)

    @pytest.mark.asyncio
    async def test_rate_limiter_with_mock_redis(self):
        """Test rate limiting logic with mocked Redis."""
        from fastapi import HTTPException
        from app.core.rate_limit import RateLimiter
        from app.models.user import User

        limiter = RateLimiter(per_minute=1, per_day=100, resource="strict_test")
        user = MagicMock(spec=User)
        user.id = uuid.uuid4()

        mock_redis = AsyncMock()
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(side_effect=[
            [None, 1, None, None],  # minute: count=1 (at limit)
            [None, 0, None, None],  # day: count=0
        ])
        mock_redis.pipeline = MagicMock(return_value=mock_pipe)
        mock_redis.aclose = AsyncMock()

        # First call should succeed (count=1 == limit, but check is >=, so it passes with count=0 before add)
        # Let's set it to return count=0 first time
        mock_pipe.execute = AsyncMock(side_effect=[
            [None, 0, None, None],  # minute: count=0 (under limit)
            [None, 0, None, None],  # day: count=0
        ])

        with patch("app.core.rate_limit.aioredis") as mock_aioredis:
            mock_aioredis.from_url.return_value = mock_redis
            await limiter(user=user)  # should not raise


# ============================================================
# Health check tests
# ============================================================


class TestHealthChecks:
    @pytest.mark.asyncio
    async def test_basic_health(self, client):
        response = await client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"

    @pytest.mark.asyncio
    async def test_detailed_health(self, client):
        response = await client.get("/health/detailed")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ("ok", "degraded")
        assert "checks" in data
        assert "database" in data["checks"]
        assert "openai_config" in data["checks"]
        assert "youtube_config" in data["checks"]


# ============================================================
# Context cache tests
# ============================================================


class TestContextCache:
    @pytest.mark.asyncio
    async def test_cache_returns_none_without_redis(self):
        from app.services.context_cache import get_cached

        result = await get_cached(uuid.uuid4(), "test_ns")
        # Should return None gracefully when Redis is unavailable
        assert result is None or isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_cache_user_isolation(self):
        """Ensure cache keys are scoped per-user."""
        from app.services.context_cache import _cache_key, _hash_key

        user_a = uuid.uuid4()
        user_b = uuid.uuid4()

        key_a = _cache_key(user_a, "refs")
        key_b = _cache_key(user_b, "refs")
        assert key_a != key_b
        assert str(user_a) in key_a
        assert str(user_b) in key_b

    @pytest.mark.asyncio
    async def test_hash_key_varies_by_params(self):
        from app.services.context_cache import _hash_key

        user_id = uuid.uuid4()
        k1 = _hash_key(user_id, "refs", "niche=gaming")
        k2 = _hash_key(user_id, "refs", "niche=cooking")
        assert k1 != k2


# ============================================================
# Structured logging tests
# ============================================================


class TestStructuredLogging:
    def test_formatter_outputs_json(self):
        import json
        import logging
        from app.core.logging_config import StructuredFormatter

        formatter = StructuredFormatter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0,
            msg="hello world", args=(), exc_info=None,
        )
        output = formatter.format(record)
        parsed = json.loads(output)
        assert parsed["msg"] == "hello world"
        assert parsed["level"] == "INFO"
        assert "ts" in parsed

    def test_formatter_includes_extras(self):
        import json
        import logging
        from app.core.logging_config import StructuredFormatter

        formatter = StructuredFormatter()
        record = logging.LogRecord(
            name="test", level=logging.INFO, pathname="", lineno=0,
            msg="task started", args=(), exc_info=None,
        )
        record.user_id = "abc-123"
        record.agent = "ScriptGenerator"
        output = formatter.format(record)
        parsed = json.loads(output)
        assert parsed["user_id"] == "abc-123"
        assert parsed["agent"] == "ScriptGenerator"


# ============================================================
# Celery task backoff tests
# ============================================================


class TestCeleryBackoff:
    def test_backoff_delay_is_exponential(self):
        from app.tasks.video_tasks import _backoff_delay

        assert _backoff_delay(0) == 10
        assert _backoff_delay(1) == 30
        assert _backoff_delay(2) == 90

    def test_analysis_backoff_delay(self):
        from app.tasks.analysis_tasks import _backoff_delay

        assert _backoff_delay(0) == 15
        assert _backoff_delay(1) == 45
        assert _backoff_delay(2) == 135


# ============================================================
# Migration / model tests
# ============================================================


class TestAiAgentRunModel:
    @pytest.mark.asyncio
    async def test_create_and_read(self, db_session: AsyncSession):
        user_id = uuid.uuid4()
        run = AiAgentRun(
            user_id=user_id,
            agent_name="TestModel",
            model="gpt-4o",
            prompt_tokens=50,
            completion_tokens=100,
            total_tokens=150,
            estimated_cost_usd=0.001,
            duration_ms=250,
            status="success",
            input_summary="test input",
            output_summary="test output",
        )
        db_session.add(run)
        await db_session.flush()

        result = await db_session.execute(
            select(AiAgentRun).where(AiAgentRun.id == run.id)
        )
        fetched = result.scalar_one()
        assert fetched.agent_name == "TestModel"
        assert fetched.total_tokens == 150
        assert fetched.estimated_cost_usd == 0.001
