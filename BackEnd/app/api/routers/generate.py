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

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import openai_client
from app.db.session import get_db
from app.schemas.common import DataResponse
from app.schemas.generate import (
    HooksInput,
    HooksOutput,
    ImproveInput,
    ImproveOutput,
    ScriptGenerateInput,
    ScriptGenerateOutput,
)
from app.agents.script_generator_agent import ScriptGeneratorAgent
from app.agents.retention_critic_agent import RetentionCriticAgent

router = APIRouter()


@router.post("/script", response_model=DataResponse)
async def generate_script(
    body: ScriptGenerateInput,
    db: AsyncSession = Depends(get_db),
):
    agent = ScriptGeneratorAgent()
    result = await agent.run(
        theme=body.theme,
        idea=body.idea,
        duration=body.duration,
        niche=body.niche,
        goal=body.goal,
        hook_type=body.hook_type,
        aggressiveness=body.aggressiveness,
        cta=body.cta,
        platform=body.platform,
        style_profile_id=body.style_profile_id,
        db=db,
    )

    return DataResponse(data=ScriptGenerateOutput(**result))


@router.post("/improve", response_model=DataResponse)
async def improve_script(body: ImproveInput):
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
    db: AsyncSession = Depends(get_db),
):
    style_context = ""
    if body.style_profile_id:
        from app.models import StyleProfile

        profile = await db.get(StyleProfile, body.style_profile_id)
        if profile:
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
