"""Redis-based cache for expensive parts of the generation context.

Caches per-user data that rarely changes between consecutive generations:
- Channel averages
- Ranked references
- Active insights
- Style profiles

Each key is scoped to user_id to prevent cross-user leakage.
TTLs are short (minutes) so stale data self-expires.
"""

import hashlib
import json
import logging
import uuid

from app.core.config import settings

logger = logging.getLogger(__name__)

DEFAULT_TTL = 300  # 5 minutes


def _cache_key(user_id: uuid.UUID, namespace: str) -> str:
    return f"ctx:{namespace}:{user_id}"


def _hash_key(user_id: uuid.UUID, namespace: str, params: str) -> str:
    h = hashlib.md5(params.encode(), usedforsecurity=False).hexdigest()[:12]
    return f"ctx:{namespace}:{user_id}:{h}"


async def _get_redis():
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await r.ping()
        return r
    except Exception:
        return None


async def get_cached(user_id: uuid.UUID, namespace: str, params: str = "") -> dict | None:
    """Return cached data or None."""
    r = await _get_redis()
    if not r:
        return None
    try:
        key = _hash_key(user_id, namespace, params) if params else _cache_key(user_id, namespace)
        raw = await r.get(key)
        await r.aclose()
        if raw:
            return json.loads(raw)
    except Exception:
        logger.debug("Cache get failed for %s", namespace, exc_info=True)
    return None


async def set_cached(
    user_id: uuid.UUID,
    namespace: str,
    data: dict,
    params: str = "",
    ttl: int = DEFAULT_TTL,
) -> None:
    """Store data in cache with TTL."""
    r = await _get_redis()
    if not r:
        return
    try:
        key = _hash_key(user_id, namespace, params) if params else _cache_key(user_id, namespace)
        await r.setex(key, ttl, json.dumps(data, default=str, ensure_ascii=False))
        await r.aclose()
    except Exception:
        logger.debug("Cache set failed for %s", namespace, exc_info=True)


async def invalidate(user_id: uuid.UUID, namespace: str) -> None:
    """Delete cache for a specific namespace. Call after mutations."""
    r = await _get_redis()
    if not r:
        return
    try:
        pattern = f"ctx:{namespace}:{user_id}*"
        async for key in r.scan_iter(match=pattern, count=100):
            await r.delete(key)
        await r.aclose()
    except Exception:
        logger.debug("Cache invalidate failed for %s", namespace, exc_info=True)
