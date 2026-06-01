from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import (
    analysis,
    auth,
    dashboard,
    generate,
    insights,
    scripts,
    search,
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


@app.get("/health")
async def health():
    return {"status": "ok"}
