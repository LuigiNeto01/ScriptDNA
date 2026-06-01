from pydantic import BaseModel

from app.models.script import ScriptStatus


class ScriptCreateInput(BaseModel):
    title: str
    theme: str | None = None
    objective: str | None = None
    niche: str | None = None
    speaking_style: str | None = None
    estimated_duration_seconds: int | None = None
    # Initial version content
    hook: str | None = None
    narrative_structure: list[dict] | None = None
    cta: str | None = None
    lines: list[dict] | None = None
    analysis: dict | None = None
    generation_params: dict | None = None


class ScriptUpdateInput(BaseModel):
    title: str | None = None
    theme: str | None = None
    objective: str | None = None
    niche: str | None = None
    speaking_style: str | None = None
    estimated_duration_seconds: int | None = None
    youtube_video_id: str | None = None


class ScriptStatusInput(BaseModel):
    status: ScriptStatus


class ScriptLinkVideoInput(BaseModel):
    youtube_video_id: str


class VersionCreateInput(BaseModel):
    hook: str | None = None
    narrative_structure: list[dict] | None = None
    cta: str | None = None
    lines: list[dict] | None = None
    analysis: dict | None = None
    generation_params: dict | None = None
    change_summary: str | None = None
    created_by: str = "user"


class ScriptVersionOut(BaseModel):
    id: str
    script_id: str
    version_number: int
    hook: str | None
    narrative_structure: list[dict] | None
    cta: str | None
    lines: list[dict] | None
    analysis: dict | None
    generation_params: dict | None
    change_summary: str | None
    created_by: str
    created_at: str

    model_config = {"from_attributes": True}


class ScriptOut(BaseModel):
    id: str
    user_id: str
    current_version_id: str | None
    title: str
    theme: str | None
    objective: str | None
    niche: str | None
    speaking_style: str | None
    estimated_duration_seconds: int | None
    status: str
    youtube_video_id: str | None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class ScriptWithVersionOut(ScriptOut):
    current_version: ScriptVersionOut | None = None
