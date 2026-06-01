"""Logs AI agent executions to `ai_agent_runs` for observability.

Usage:
    async with AgentRunLogger(db, user_id=..., agent_name="ScriptGeneratorAgent") as run:
        result = await some_agent.run(...)
        run.set_output_summary("Generated 3 variants")
        run.set_usage(response)  # extracts tokens from OpenAI response
"""

import logging
import time
import uuid
from types import TracebackType

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai_agent_run import AiAgentRun

logger = logging.getLogger(__name__)

# Pricing per 1M tokens (as of 2025-Q4 public pricing). Updated when known.
MODEL_PRICING: dict[str, dict[str, float]] = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "text-embedding-3-small": {"input": 0.02, "output": 0.0},
    "text-embedding-3-large": {"input": 0.13, "output": 0.0},
    "whisper-1": {"input": 0.006, "output": 0.0},  # per minute, approximated
}


def _truncate(text: str | None, max_len: int = 500) -> str | None:
    if not text:
        return text
    return text[:max_len] + ("..." if len(text) > max_len else "")


def estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float | None:
    pricing = MODEL_PRICING.get(model)
    if not pricing:
        return None
    input_cost = (prompt_tokens / 1_000_000) * pricing["input"]
    output_cost = (completion_tokens / 1_000_000) * pricing["output"]
    return round(input_cost + output_cost, 6)


class AgentRunLogger:
    def __init__(
        self,
        db: AsyncSession,
        agent_name: str,
        user_id: uuid.UUID | None = None,
        model: str | None = None,
        input_summary: str | None = None,
    ):
        self._db = db
        self._run = AiAgentRun(
            user_id=user_id,
            agent_name=agent_name,
            model=model,
            input_summary=_truncate(input_summary),
            status="running",
        )
        self._start: float = 0.0

    async def __aenter__(self) -> "AgentRunLogger":
        self._start = time.monotonic()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None,
    ) -> None:
        elapsed_ms = int((time.monotonic() - self._start) * 1000)
        self._run.duration_ms = elapsed_ms

        if exc_val is not None:
            self._run.status = "error"
            self._run.error_message = _truncate(str(exc_val), 1000)
        elif self._run.status == "running":
            self._run.status = "success"

        try:
            self._db.add(self._run)
            await self._db.flush()
        except Exception:
            logger.warning("Failed to persist agent run log", exc_info=True)

    def set_output_summary(self, summary: str) -> None:
        self._run.output_summary = _truncate(summary)

    def set_model(self, model: str) -> None:
        self._run.model = model

    def set_metadata(self, data: dict) -> None:
        self._run.metadata_json = data

    def set_usage(self, response) -> None:
        """Extract token usage from an OpenAI ChatCompletion response."""
        usage = getattr(response, "usage", None)
        if not usage:
            return
        self._run.prompt_tokens = getattr(usage, "prompt_tokens", None)
        self._run.completion_tokens = getattr(usage, "completion_tokens", None)
        self._run.total_tokens = getattr(usage, "total_tokens", None)
        model = self._run.model or getattr(response, "model", None)
        if model:
            self._run.model = model
        if self._run.prompt_tokens and self._run.completion_tokens and model:
            self._run.estimated_cost_usd = estimate_cost(
                model, self._run.prompt_tokens, self._run.completion_tokens
            )

    def set_usage_raw(
        self,
        prompt_tokens: int | None = None,
        completion_tokens: int | None = None,
        model: str | None = None,
    ) -> None:
        self._run.prompt_tokens = prompt_tokens
        self._run.completion_tokens = completion_tokens
        if prompt_tokens and completion_tokens:
            self._run.total_tokens = prompt_tokens + completion_tokens
        if model:
            self._run.model = model
        if prompt_tokens and completion_tokens and (model or self._run.model):
            self._run.estimated_cost_usd = estimate_cost(
                model or self._run.model, prompt_tokens, completion_tokens
            )
