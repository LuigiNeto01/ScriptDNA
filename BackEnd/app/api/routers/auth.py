import uuid
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    ACCESS_TOKEN_EXPIRE_MINUTES,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthTokens,
    LoginInput,
    RefreshInput,
    RegisterInput,
    UserOut,
)
from app.schemas.common import DataResponse

router = APIRouter()


@router.post("/register", response_model=DataResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterInput, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
    )
    db.add(user)
    await db.flush()

    tokens = AuthTokens(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return DataResponse(data=tokens.model_dump())


@router.post("/login", response_model=DataResponse)
async def login(body: LoginInput, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    tokens = AuthTokens(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return DataResponse(data=tokens.model_dump())


@router.post("/refresh", response_model=DataResponse)
async def refresh(body: RefreshInput, db: AsyncSession = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    tokens = AuthTokens(
        access_token=create_access_token(user.id),
        refresh_token=create_refresh_token(user.id),
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )
    return DataResponse(data=tokens.model_dump())


@router.get("/me", response_model=DataResponse)
async def me(user: User = Depends(get_current_user)):
    return DataResponse(data=UserOut.model_validate(user).model_dump(mode="json"))


# ─── YouTube OAuth ───────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
YOUTUBE_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
]


@router.get("/youtube/connect")
async def youtube_connect(user: User = Depends(get_current_user)):
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=503,
            detail=(
                "YouTube OAuth is not configured. Set GOOGLE_CLIENT_ID and "
                "GOOGLE_CLIENT_SECRET in BackEnd/.env."
            ),
        )

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(YOUTUBE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "state": str(user.id),
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return DataResponse(data={"authorization_url": url})


@router.get("/youtube/callback")
async def youtube_callback(code: str, state: str, db: AsyncSession = Depends(get_db)):
    # Exchange code for tokens
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if token_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for tokens")

    token_data = token_response.json()
    access_token = token_data["access_token"]
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)

    # Fetch channel info
    async with httpx.AsyncClient() as client:
        channel_response = await client.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "snippet", "mine": "true"},
            headers={"Authorization": f"Bearer {access_token}"},
        )

    if channel_response.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch channel info")

    channel_data = channel_response.json()
    items = channel_data.get("items", [])
    if not items:
        raise HTTPException(status_code=400, detail="No YouTube channel found")

    channel = items[0]
    channel_id = channel["id"]
    channel_name = channel["snippet"]["title"]

    # Update user
    from datetime import datetime, timedelta, timezone

    result = await db.execute(select(User).where(User.id == uuid.UUID(state)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.youtube_channel_id = channel_id
    user.youtube_channel_name = channel_name
    user.youtube_access_token = access_token
    user.youtube_refresh_token = refresh_token
    user.youtube_token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)

    await db.flush()

    # Redirect to frontend
    return RedirectResponse(url="http://localhost:3000/youtube?connected=true")


@router.delete("/youtube/disconnect", response_model=DataResponse)
async def youtube_disconnect(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user.youtube_channel_id = None
    user.youtube_channel_name = None
    user.youtube_access_token = None
    user.youtube_refresh_token = None
    user.youtube_token_expires_at = None
    await db.flush()
    return DataResponse(data={"disconnected": True})
