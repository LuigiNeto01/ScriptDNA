from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.logging_config import setup_logging

setup_logging(json_format=True)

from app.api.routers import (
    analysis,
    auth,
    comments,
    dashboard,
    experiments,
    generate,
    insights,
    scripts,
    search,
    strategy,
    styles,
    suggestions,
    tasks,
    videos,
    youtube,
)

app = FastAPI(
    title="ScriptDNA API",
    description="Plataforma de inteligência de roteiros para criadores de conteúdo",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth (public)
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# Existing
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(styles.router, prefix="/api/styles", tags=["styles"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])

# New v2
app.include_router(scripts.router, prefix="/api/scripts", tags=["scripts"])
app.include_router(youtube.router, prefix="/api/youtube", tags=["youtube"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["analysis"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(suggestions.router, prefix="/api/suggestions", tags=["suggestions"])
app.include_router(comments.router, prefix="/api/comments", tags=["comments"])
app.include_router(experiments.router, prefix="/api/experiments", tags=["experiments"])
app.include_router(strategy.router, prefix="/api/strategy", tags=["strategy"])


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/detailed")
async def health_detailed():
    """Detailed health check — tests DB, Redis, and config presence.

    Does NOT call external APIs (YouTube, OpenAI) to avoid cost/rate issues.
    """
    from app.core.config import settings

    checks: dict[str, dict] = {}

    # Database
    try:
        from sqlalchemy import text as sa_text
        from app.db.session import async_session_factory

        async with async_session_factory() as session:
            await session.execute(sa_text("SELECT 1"))
        checks["database"] = {"status": "ok"}
    except Exception as exc:
        checks["database"] = {"status": "error", "detail": str(exc)[:200]}

    # Redis
    try:
        import redis.asyncio as aioredis

        r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        await r.ping()
        await r.aclose()
        checks["redis"] = {"status": "ok"}
    except Exception as exc:
        checks["redis"] = {"status": "error", "detail": str(exc)[:200]}

    # Celery broker (just tests Redis connectivity, same as above for Redis broker)
    checks["celery_broker"] = checks.get("redis", {"status": "unknown"})

    # OpenAI config
    checks["openai_config"] = {
        "status": "ok" if settings.OPENAI_API_KEY else "missing",
    }

    # YouTube config
    checks["youtube_config"] = {
        "status": "ok" if settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET else "missing",
    }

    all_ok = all(c.get("status") == "ok" for c in checks.values())
    return {
        "status": "ok" if all_ok else "degraded",
        "checks": checks,
    }
