import json
import logging
import uuid

from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.generate import ScriptGenerateInput, ScriptGenerateOutput
from app.schemas.script_generation_context import ScriptGenerationContext
from app.services.script_generation_context_builder import ScriptGenerationContextBuilder
from app.services.script_quality_evaluator import ScriptQualityEvaluator

logger = logging.getLogger(__name__)


class ScriptGenerationError(ValueError):
    """Raised when the LLM returns an invalid script payload."""


GENERATOR_PROMPT = """Voce e um roteirista profissional especializado em Shorts de alta retencao.

Use o contexto estruturado fornecido para gerar um roteiro original.

Regras:
- Nao copie frases longas das referencias. Use evidencias apenas como inspiracao estrategica.
- Priorize positive_references, winning_patterns e insights em active_insights.do.
- Use negative_references, avoid_patterns e active_insights.avoid apenas como anti-padroes.
- Preserve o estilo do canal quando style_profile existir.
- Adapte o roteiro ao objetivo, CTA, plataforma e duracao do brief.
- Gere timestamps coerentes.
- Cada linha precisa ter function, retention_note e viewer_question.
- Use apenas estas funcoes narrativas: hook, setup, conflict, escalation, payoff, cta.
- Abra uma curiosidade forte nos primeiros 3 segundos.
- Nao revele o payoff principal cedo demais.
- hook_strength: avalie honestamente de 0.0 a 1.0 o poder do hook gerado. Hook generico como "Vou te mostrar..." = 0.3. Hook com curiosity gap especifico e dado concreto = 0.85+. Seja criterioso.

Responda APENAS com JSON valido:
{
  "lines": [
    {
      "start": "0.0",
      "end": "3.0",
      "line": "texto original da linha",
      "function": "hook",
      "retention_note": "como esta linha ajuda retencao",
      "viewer_question": "curiosidade aberta ou resolvida"
    }
  ],
  "analysis": {
    "hook_strength": 0.0,
    "curiosity_gaps": [],
    "weak_points": [],
    "evidence_used": [],
    "patterns_applied": [],
    "patterns_avoided": [],
    "predicted_retention_risks": [],
    "improvement_suggestions": []
  },
  "evidence_used": [],
  "patterns_applied": [],
  "patterns_avoided": [],
  "predicted_retention_risks": [],
  "improvement_suggestions": []
}
"""


class ScriptGeneratorAgent:
    async def run(
        self,
        theme: str,
        duration: int,
        db: AsyncSession,
        niche: str | None = None,
        goal: str | None = None,
        hook_type: str | None = None,
        aggressiveness: int | None = None,
        cta: str | None = None,
        idea: str | None = None,
        platform: str = "youtube",
        style_profile_id: uuid.UUID | None = None,
        user_id: uuid.UUID | None = None,
        variants: int = 1,
    ) -> dict:
        body = ScriptGenerateInput(
            theme=theme,
            idea=idea,
            duration=duration,
            niche=niche,
            style_profile_id=style_profile_id,
            goal=goal,
            hook_type=hook_type,
            aggressiveness=aggressiveness,
            cta=cta,
            platform=platform,
            variants=variants,
        )

        if user_id:
            context = await ScriptGenerationContextBuilder().build(body, user_id, db)
        else:
            context = await self._minimal_context(body, db)

        return await self.run_with_context(context, variants=variants)

    async def run_with_context(
        self,
        context: ScriptGenerationContext,
        variants: int = 1,
    ) -> dict:
        variants = max(1, min(variants, 5))

        if variants == 1:
            output = await self._call_and_validate(self._context_prompt(context))
            evaluated = self._attach_quality(output, context)
            return evaluated.model_dump()

        generated = []
        for index in range(variants):
            angle = _variant_angle(index)
            output = await self._call_and_validate(
                self._context_prompt(context, angle=angle, variant_id=index + 1)
            )
            evaluated = self._attach_quality(output, context)
            quality = evaluated.quality_evaluation or {}
            generated.append(
                {
                    "variant_id": index + 1,
                    "angle": angle,
                    "score": quality.get("quality_score", 0),
                    **evaluated.model_dump(),
                }
            )

        recommended = max(generated, key=lambda item: item.get("score", 0))
        return {
            "variants": generated,
            "recommended_variant": recommended["variant_id"],
        }

    async def _call_and_validate(self, briefing: str) -> dict:
        from app.core.openai_client import get_openai_client

        client = get_openai_client()
        last_error: Exception | None = None

        for attempt in range(2):
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": GENERATOR_PROMPT},
                    {"role": "user", "content": briefing},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )

            content = response.choices[0].message.content or ""
            try:
                data = json.loads(content)
                return ScriptGenerateOutput(**data).model_dump()
            except (json.JSONDecodeError, ValidationError) as exc:
                last_error = exc
                logger.warning(
                    "Invalid script generator response on attempt %s: %s",
                    attempt + 1,
                    exc,
                )

        raise ScriptGenerationError(
            "A IA retornou um roteiro em formato invalido. Tente novamente em alguns instantes."
        ) from last_error

    def _context_prompt(
        self,
        context: ScriptGenerationContext,
        angle: str | None = None,
        variant_id: int | None = None,
    ) -> str:
        parts = [
            "## CONTEXTO ESTRUTURADO",
            json.dumps(context.to_prompt_payload(), ensure_ascii=False, indent=2),
        ]
        if angle:
            parts.append(
                f"\n## VARIANTE {variant_id}\nUse um angulo diferente: {angle}."
            )
        return "\n".join(parts)

    def _attach_quality(
        self,
        output: dict,
        context: ScriptGenerationContext,
    ) -> ScriptGenerateOutput:
        parsed = ScriptGenerateOutput(**output)
        parsed.quality_evaluation = ScriptQualityEvaluator().evaluate(parsed, context)
        return parsed

    async def _minimal_context(
        self,
        body: ScriptGenerateInput,
        db: AsyncSession,
    ) -> ScriptGenerationContext:
        style_profile = None
        if body.style_profile_id:
            from app.models import StyleProfile

            profile = await db.get(StyleProfile, body.style_profile_id)
            if profile:
                style_profile = {
                    "id": str(profile.id),
                    "name": profile.name,
                    "tone": profile.tone,
                    "pacing": profile.pacing,
                    "avg_sentence_length": profile.avg_sentence_length,
                    "common_hooks": profile.common_hooks or [],
                    "common_ctas": profile.common_ctas or [],
                    "narrative_patterns": profile.narrative_patterns or [],
                    "do_rules": profile.do_rules or [],
                    "avoid_rules": profile.avoid_rules or [],
                }

        return ScriptGenerationContext(
            brief={
                "theme": body.theme,
                "idea": body.idea,
                "duration": body.duration,
                "niche": body.niche,
                "goal": body.goal,
                "hook_type": body.hook_type,
                "aggressiveness": body.aggressiveness,
                "cta": body.cta,
                "platform": body.platform,
                "variants": body.variants,
            },
            style_profile=style_profile,
        )


def _variant_angle(index: int) -> str:
    angles = [
        "curiosidade agressiva",
        "historia pessoal com conflito",
        "erro comum e virada rapida",
        "contraste antes/depois",
        "lista ritmada com payoff final",
    ]
    return angles[index % len(angles)]
