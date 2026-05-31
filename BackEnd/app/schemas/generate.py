import uuid

from pydantic import BaseModel, Field, field_validator


def _empty_string_to_none(value):
    if value == "":
        return None
    return value


class ScriptGenerateInput(BaseModel):
    theme: str = Field(min_length=3, max_length=500)
    idea: str | None = Field(default=None, max_length=2000)
    duration: int = Field(ge=15, le=600, description="Duração em segundos")
    niche: str | None = Field(default=None, max_length=100)
    style_profile_id: uuid.UUID | None = None
    goal: str | None = Field(default=None, max_length=300)
    hook_type: str | None = Field(default=None, max_length=100)
    aggressiveness: int | None = Field(default=None, ge=1, le=10)
    cta: str | None = Field(default=None, max_length=300)
    platform: str = Field(default="youtube", max_length=50)

    _normalize_style_profile_id = field_validator(
        "style_profile_id", mode="before"
    )(_empty_string_to_none)


class ScriptLine(BaseModel):
    start: str
    end: str
    line: str
    function: str
    retention_note: str | None = None


class ScriptAnalysis(BaseModel):
    hook_strength: float
    curiosity_gaps: list[str]
    weak_points: list[str]


class ScriptGenerateOutput(BaseModel):
    lines: list[ScriptLine]
    analysis: ScriptAnalysis


class ImproveInput(BaseModel):
    lines: list[ScriptLine] | None = None
    script_text: str | None = None
    goal: str | None = None
    focus: str | None = None


class ImproveOutput(BaseModel):
    improved_lines: list[ScriptLine]
    problems_found: list[str]
    analysis: ScriptAnalysis


class HooksInput(BaseModel):
    theme: str = Field(min_length=3, max_length=500)
    count: int = Field(default=5, ge=1, le=20)
    platform: str = Field(default="youtube", max_length=50)
    style_profile_id: uuid.UUID | None = None

    _normalize_style_profile_id = field_validator(
        "style_profile_id", mode="before"
    )(_empty_string_to_none)


class HooksOutput(BaseModel):
    hooks: list[str]
