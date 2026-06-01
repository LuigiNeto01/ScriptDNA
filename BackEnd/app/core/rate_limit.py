"""Simple Redis-based rate limiting for expensive endpoints.

Usage in routers:
    from app.core.rate_limit import RateLimiter

    generate_limiter = RateLimiter(per_minute=5, per_day=50)

    @router.post("/script")
    async def generate_script(
        ...,
        _rl=Depends(generate_limiter),
    ):
        ...
"""

import logging
import time
import uuid

from fastapi import Depends, HTTPException, status

from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)


class RateLimiter:
    """FastAPI dependency that enforces per-user rate limits via Redis."""

    def __init__(
        self,
        per_minute: int = 10,
        per_day: int = 100,
        resource: str | None = None,
    ):
        self.per_minute = per_minute
        self.per_day = per_day
        self.resource = resource

    async def __call__(
        self,
        user: User = Depends(get_current_user),
    ) -> None:
        try:
            import redis.asyncio as aioredis
        except ImportError:
            logger.debug("redis.asyncio not available, skipping rate limit")
            return

        resource = self.resource or "default"
        user_key = str(user.id)
        now = time.time()

        try:
            r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

            # Per-minute check
            minute_key = f"rl:{resource}:{user_key}:min"
            pipe = r.pipeline()
            pipe.zremrangebyscore(minute_key, 0, now - 60)
            pipe.zcard(minute_key)
            pipe.zadd(minute_key, {str(now): now})
            pipe.expire(minute_key, 120)
            results = await pipe.execute()
            minute_count = results[1]

            if minute_count >= self.per_minute:
                await r.aclose()
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded: max {self.per_minute}/min for {resource}",
                )

            # Per-day check
            day_key = f"rl:{resource}:{user_key}:day"
            pipe = r.pipeline()
            pipe.zremrangebyscore(day_key, 0, now - 86400)
            pipe.zcard(day_key)
            pipe.zadd(day_key, {str(now): now})
            pipe.expire(day_key, 90000)
            results = await pipe.execute()
            day_count = results[1]

            if day_count >= self.per_day:
                await r.aclose()
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Daily limit exceeded: max {self.per_day}/day for {resource}",
                )

            await r.aclose()

        except HTTPException:
            raise
        except Exception:
            # If Redis is down, let the request through and log a warning
            logger.warning("Rate limit check failed (Redis unavailable)", exc_info=True)
