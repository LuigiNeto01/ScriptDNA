from pydantic import BaseModel, Field


class ScriptReferenceSegment(BaseModel):
    text: str
    start_time: float | None = None
    end_time: float | None = None
    beat_type: str | None = None
    techniques: list[str] = Field(default_factory=list)
    emotion: str | None = None
    intensity_score: float | None = None
    retention_function: str | None = None
    curiosity_question: str | None = None


class ScriptReference(BaseModel):
    source_type: str
    source_id: str
    title: str | None = None
    score: float = 0
    score_reasons: list[str] = Field(default_factory=list)
    metrics: dict = Field(default_factory=dict)
    segments: list[ScriptReferenceSegment] = Field(default_factory=list)


class ScriptGenerationContext(BaseModel):
    brief: dict
    channel_data: dict = Field(default_factory=dict)
    channel_baselines: dict = Field(default_factory=dict)
    positive_references: list[ScriptReference] = Field(default_factory=list)
    negative_references: list[ScriptReference] = Field(default_factory=list)
    semantic_segments: list[ScriptReferenceSegment] = Field(default_factory=list)
    winning_patterns: dict = Field(default_factory=dict)
    avoid_patterns: dict = Field(default_factory=dict)
    timing_patterns: dict = Field(default_factory=dict)
    active_insights: dict = Field(
        default_factory=lambda: {"do": [], "avoid": [], "watch_out": []}
    )
    style_profile: dict | None = None

    def to_prompt_payload(self) -> dict:
        return self.model_dump(mode="json", exclude_none=True)
