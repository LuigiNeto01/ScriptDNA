import uuid

from pydantic import BaseModel, EmailStr


class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str | None = None


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class RefreshInput(BaseModel):
    refresh_token: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    avatar_url: str | None
    youtube_channel_id: str | None
    youtube_channel_name: str | None

    model_config = {"from_attributes": True}
