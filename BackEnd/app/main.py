from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers import dashboard, generate, search, styles, tasks, videos

app = FastAPI(
    title="ScriptDNA API",
    description="Plataforma de inteligência de roteiros para criadores de conteúdo",
    version="0.1.0",
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

app.include_router(videos.router, prefix="/api/videos", tags=["videos"])
app.include_router(generate.router, prefix="/api/generate", tags=["generate"])
app.include_router(styles.router, prefix="/api/styles", tags=["styles"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])


@app.get("/health")
async def health():
    return {"status": "ok"}
