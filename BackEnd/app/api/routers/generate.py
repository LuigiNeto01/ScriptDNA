"""
[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/generate/script
Body: { theme: str, duration: int, style_profile_id?: uuid, goal?: str, platform?: str }
Resposta 200: { data: { lines: [...], analysis: {...} } }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/generate/improve
Body: { lines: [...], goal?: str }
Resposta 200: { data: { improved_lines: [...], problems_found: [...], analysis: {...} } }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/generate/hooks
Body: { theme: str, count?: int, platform?: str, style_profile_id?: uuid }
Resposta 200: { data: { hooks: [...] } }
"""
import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.retention_critic_agent import RetentionCriticAgent
from app.agents.script_generator_agent import ScriptGenerationError, ScriptGeneratorAgent
from app.core.openai_client import openai_client
from app.core.rate_limit import RateLimiter
from app.core.security import get_current_user
from app.db.session import get_db
from app.services.agent_run_logger import AgentRunLogger

logger = logging.getLogger(__name__)

_generate_limiter = RateLimiter(per_minute=5, per_day=50, resource="generate_script")
_improve_limiter = RateLimiter(per_minute=10, per_day=100, resource="improve_script")
_hooks_limiter = RateLimiter(per_minute=10, per_day=100, resource="generate_hooks")
_titles_limiter = RateLimiter(per_minute=10, per_day=100, resource="generate_titles")
_thumbnails_limiter = RateLimiter(per_minute=10, per_day=100, resource="generate_thumbnails")
from app.models.script import Script, ScriptVersion
from app.models.suggestion import VideoSuggestion
from app.models.user import User
from app.schemas.common import DataResponse
from app.schemas.generate import (
    HooksInput,
    HooksOutput,
    ImproveInput,
    ImproveOutput,
    ScriptGenerateInput,
    ScriptGenerateOutput,
    ThumbnailInput,
    ThumbnailOutput,
    TitlesInput,
    TitlesOutput,
)
from app.schemas.script_generation_context import ScriptGenerationContext
from app.services.script_generation_context_builder import ScriptGenerationContextBuilder

router = APIRouter()


@router.post("/script", response_model=DataResponse)
async def generate_script(
    body: ScriptGenerateInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rl=Depends(_generate_limiter),
):
    context = await ScriptGenerationContextBuilder().build(body, user.id, db)
    agent = ScriptGeneratorAgent()
    async with AgentRunLogger(
        db, agent_name="ScriptGeneratorAgent", user_id=user.id,
        model="gpt-4o", input_summary=f"theme={body.theme} variants={body.variants}",
    ) as run:
        try:
            result = await agent.run_with_context(context, variants=body.variants)
            run.set_output_summary(f"variants={body.variants} save={body.save}")
        except ScriptGenerationError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    if body.variants > 1:
        data = result
        output = _recommended_output(result)
        variant_id = result.get("recommended_variant")
    else:
        output = ScriptGenerateOutput(**result)
        data = output.model_dump()
        variant_id = 1

    if body.save:
        saved = await _save_generated_script(
            body,
            output,
            user,
            db,
            context_snapshot=_context_snapshot(context, output, variant_id),
        )
        data.update(saved)

    return DataResponse(data=data)


@router.post("/improve", response_model=DataResponse)
async def improve_script(
    body: ImproveInput,
    user: User = Depends(get_current_user),
    _rl=Depends(_improve_limiter),
):
    agent = RetentionCriticAgent()
    if body.lines:
        lines_dicts = [line.model_dump() for line in body.lines]
    else:
        lines_dicts = [
            {
                "start": "",
                "end": "",
                "line": line.strip(),
                "function": "unknown",
                "retention_note": None,
            }
            for line in (body.script_text or "").splitlines()
            if line.strip()
        ]

    result = await agent.run(lines=lines_dicts, goal=body.goal or body.focus)

    return DataResponse(data=ImproveOutput(**result))


@router.post("/hooks", response_model=DataResponse)
async def generate_hooks(
    body: HooksInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rl=Depends(_hooks_limiter),
):
    style_context = ""
    if body.style_profile_id:
        from app.models import StyleProfile

        profile = await db.get(StyleProfile, body.style_profile_id)
        if profile and (
            profile.user_id == user.id or profile.visibility == "public"
        ):
            style_context = (
                f"\nTom: {profile.tone}. "
                f"Hooks comuns: {json.dumps(profile.common_hooks, ensure_ascii=False)}"
            )

    prompt = (
        f"Gere {body.count} hooks criativos e de alta retenção para o tema: {body.theme}\n"
        f"Plataforma: {body.platform}\n"
        f"{style_context}\n\n"
        "Responda APENAS com JSON: {\"hooks\": [\"hook1\", \"hook2\", ...]}"
    )

    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.8,
    )

    data = json.loads(response.choices[0].message.content)
    return DataResponse(data=HooksOutput(hooks=data["hooks"]))


@router.post("/from-suggestion/{suggestion_id}", response_model=DataResponse)
async def generate_from_suggestion(
    suggestion_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate a full script from a video suggestion."""
    result = await db.execute(
        select(VideoSuggestion).where(
            VideoSuggestion.id == suggestion_id,
            VideoSuggestion.user_id == user.id,
        )
    )
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")

    agent = ScriptGeneratorAgent()
    suggestion_body = ScriptGenerateInput(
        theme=suggestion.theme or suggestion.title,
        idea=suggestion.description,
        duration=suggestion.estimated_duration_seconds or 45,
        niche=suggestion.niche,
        goal="views",
        aggressiveness=7,
        platform="youtube_shorts",
    )
    context = await ScriptGenerationContextBuilder().build(
        suggestion_body, user.id, db
    )
    try:
        result = await agent.run_with_context(context)
    except ScriptGenerationError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return DataResponse(data=ScriptGenerateOutput(**result))


@router.post("/titles", response_model=DataResponse)
async def generate_titles(
    body: TitlesInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    _rl=Depends(_titles_limiter),
):
    style_context = ""
    if body.style_profile_id:
        from app.models import StyleProfile

        profile = await db.get(StyleProfile, body.style_profile_id)
        if profile and (profile.user_id == user.id or profile.visibility == "public"):
            style_context = f"\nTom: {profile.tone}. Hooks comuns: {json.dumps(profile.common_hooks, ensure_ascii=False)}"

    script_context = ""
    if body.script_lines:
        lines_text = "\n".join(f"[{l.function}] {l.line}" for l in body.script_lines)
        script_context = f"\n\nRoteiro do video:\n{lines_text}"

    prompt = (
        f"Gere {body.count} titulos criativos para um YouTube Short sobre: {body.theme}\n"
        f"Nicho: {body.niche or 'geral'}\n"
        f"Plataforma: {body.platform}\n"
        f"{style_context}{script_context}\n\n"
        "Para cada titulo, indique a estrategia usada (curiosity_gap, shock_value, question, "
        "list, how_to, controversy, urgency) e CTR previsto (alto/medio/baixo).\n\n"
        'Responda APENAS com JSON: {"titles": [{"title": "...", "strategy": "...", "predicted_ctr": "..."}]}'
    )

    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.8,
    )

    data = json.loads(response.choices[0].message.content)
    return DataResponse(data=TitlesOutput(titles=data["titles"]))


@router.post("/thumbnail-ideas", response_model=DataResponse)
async def generate_thumbnail_ideas(
    body: ThumbnailInput,
    user: User = Depends(get_current_user),
    _rl=Depends(_thumbnails_limiter),
):
    script_context = ""
    if body.script_lines:
        lines_text = "\n".join(f"[{l.function}] {l.line}" for l in body.script_lines)
        script_context = f"\n\nRoteiro do video:\n{lines_text}"

    prompt = (
        f"Gere {body.count} ideias de thumbnail para um YouTube Short sobre: {body.theme}\n"
        f"Titulo: {body.title or 'nao definido'}\n"
        f"Nicho: {body.niche or 'geral'}\n"
        f"{script_context}\n\n"
        "Para cada ideia, descreva:\n"
        "- concept: descricao visual detalhada da thumbnail\n"
        "- text_overlay: texto sobreposto (curto, impactante, maximo 5 palavras)\n"
        "- emotion: emocao dominante que a thumbnail deve transmitir\n"
        "- color_palette: 2-4 cores principais (nomes simples)\n"
        "- composition: descricao da composicao visual\n\n"
        "IMPORTANTE: Nao gere imagens. Apenas descreva ideias em texto para que o criador execute.\n\n"
        'Responda APENAS com JSON: {"ideas": [{"concept": "...", "text_overlay": "...", '
        '"emotion": "...", "color_palette": ["..."], "composition": "..."}]}'
    )

    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
        temperature=0.8,
    )

    data = json.loads(response.choices[0].message.content)
    return DataResponse(data=ThumbnailOutput(ideas=data["ideas"]))


async def _save_generated_script(
    body: ScriptGenerateInput,
    output: ScriptGenerateOutput,
    user: User,
    db: AsyncSession,
    context_snapshot: dict | None = None,
) -> dict:
    script = Script(
        user_id=user.id,
        title=body.theme,
        theme=body.theme,
        objective=body.goal,
        niche=body.niche,
        estimated_duration_seconds=body.duration,
    )
    db.add(script)
    await db.flush()

    lines = [line.model_dump() for line in output.lines]
    version = ScriptVersion(
        script_id=script.id,
        version_number=1,
        hook=_first_line_by_function(lines, "hook"),
        cta=body.cta or _first_line_by_function(lines, "cta"),
        lines=lines,
        analysis=output.analysis.model_dump(),
        generation_params={
            **body.model_dump(mode="json"),
            "context_snapshot": context_snapshot or {},
        },
        created_by="ai",
    )
    db.add(version)
    await db.flush()

    script.current_version_id = version.id
    await db.flush()
    await db.commit()

    return {"script_id": str(script.id), "version_id": str(version.id)}


def _first_line_by_function(lines: list[dict], function_name: str) -> str | None:
    for line in lines:
        if line.get("function") == function_name:
            return line.get("line")
    return None


def _recommended_output(result: dict) -> ScriptGenerateOutput:
    recommended_variant = result.get("recommended_variant")
    variants = result.get("variants") or []
    selected = next(
        (item for item in variants if item.get("variant_id") == recommended_variant),
        variants[0] if variants else None,
    )
    if not selected:
        raise HTTPException(status_code=502, detail="Nenhuma variante gerada")
    return ScriptGenerateOutput(**selected)


def _context_snapshot(
    context: ScriptGenerationContext,
    output: ScriptGenerateOutput,
    variant_id: int | None,
) -> dict:
    return {
        "insight_ids": [
            item["id"]
            for bucket in context.active_insights.values()
            for item in bucket
            if item.get("id")
        ],
        "reference_ids": [
            reference.source_id
            for reference in context.positive_references + context.negative_references
        ],
        "patterns_applied": output.patterns_applied or output.analysis.patterns_applied,
        "patterns_avoided": output.patterns_avoided or output.analysis.patterns_avoided,
        "quality_score": (
            output.quality_evaluation or {}
        ).get("quality_score"),
        "variant_id": variant_id,
        "context_summary": {
            "positive_references": len(context.positive_references),
            "negative_references": len(context.negative_references),
            "semantic_segments": len(context.semantic_segments),
            "insights_do": len(context.active_insights.get("do", [])),
            "insights_avoid": len(context.active_insights.get("avoid", [])),
            "insights_watch_out": len(context.active_insights.get("watch_out", [])),
        },
    }
