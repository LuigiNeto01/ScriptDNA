import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import get_openai_client
from app.models import ScriptBeat, StyleProfile, TranscriptSegment, Video

GENERATOR_PROMPT = """Você é um roteirista profissional especializado em conteúdo digital de alta retenção.

Gere um roteiro completo com base no briefing abaixo.

## REGRA PRINCIPAL DE ESTILO
Você DEVE replicar o estilo de fala dos vídeos de referência fornecidos. Isso inclui:
- Linguajar e vocabulário (formal, informal, gírias, abreviações)
- Trejeitos verbais e bordões (ex: "mano", "tipo assim", "olha só", "sacou?")
- Ritmo e entonação (frases curtas e diretas vs. explicações longas)
- Método de storytelling (começa com história pessoal? vai direto ao ponto? usa analogias?)
- Tom emocional (empolgado, sério, provocativo, didático)
- Estrutura narrativa (como o criador transiciona entre beats)

NÃO escreva de forma genérica ou "corporativa". O roteiro deve soar como se o criador dos vídeos de referência estivesse falando.

## CAMPO "IDEIA DO VÍDEO"
Quando o briefing incluir uma "Ideia do vídeo", use como ponto de partida criativo:
- A ideia é um CONCEITO ou RASCUNHO, NÃO um roteiro pronto.
- Desenvolva a ideia em um roteiro completo com estrutura narrativa.
- Mantenha a essência da ideia mas aplique técnicas de retenção.
- Expanda detalhes, adicione hooks, conflito e payoff onde a ideia só sugere.

## CAMPOS OPCIONAIS DO BRIEFING
- Tipo de hook: se informado, use esse estilo de hook (ex: "pergunta provocativa", "dado chocante", "história pessoal")
- Nível de agressividade: controla o quão direto/provocativo o roteiro é (ex: "leve", "moderado", "agressivo")
- CTA desejado: se informado, use esse call-to-action específico no final

## FUNÇÕES NARRATIVAS
Use APENAS um destes valores no campo "function": hook, setup, conflict, escalation, payoff, cta

## WEAK POINTS
- Liste APENAS pontos genuinamente fracos (score abaixo de 7/10).
- Descreva de forma clara e acionável.
- Se não houver pontos fracos, retorne [].

Responda APENAS com JSON válido:
{
  "lines": [
    {
      "start": "0.0",
      "end": "3.0",
      "line": "texto da linha",
      "function": "hook",
      "retention_note": "nota sobre retenção"
    }
  ],
  "analysis": {
    "hook_strength": 0.85,
    "curiosity_gaps": ["pergunta implícita 1", "pergunta implícita 2"],
    "weak_points": ["descrição do problema acionável"]
  }
}
"""


class ScriptGeneratorAgent:
    async def run(
        self,
        theme: str,
        duration: int,
        niche: str | None,
        goal: str | None,
        hook_type: str | None,
        aggressiveness: int | None,
        cta: str | None,
        idea: str | None,
        platform: str,
        style_profile_id: uuid.UUID | None,
        db: AsyncSession,
    ) -> dict:
        briefing_parts = [
            f"Tema/Título: {theme}",
            f"Duração alvo: {duration} segundos",
            f"Plataforma: {platform}",
        ]
        if idea:
            briefing_parts.append(
                f"\nIdeia do vídeo (use como base criativa, NÃO é um roteiro pronto):\n{idea}"
            )
        if niche:
            briefing_parts.append(f"Nicho: {niche}")
        if goal:
            briefing_parts.append(f"Objetivo: {goal}")
        if hook_type:
            briefing_parts.append(f"Tipo de hook desejado: {hook_type}")
        if aggressiveness:
            briefing_parts.append(f"Nível de agressividade: {aggressiveness}")
        if cta:
            briefing_parts.append(f"CTA desejado: {cta}")

        # Channel insights relevant to this topic
        insights_context = await self._build_insights_context(niche, theme, db)
        if insights_context:
            briefing_parts.append(insights_context)

        # RAG: buscar vídeos do nicho para extrair estilo de fala
        style_context = await self._build_niche_style(theme, niche, db)
        if style_context:
            briefing_parts.append(style_context)

        # Buscar perfil de estilo se fornecido
        if style_profile_id:
            profile = await db.get(StyleProfile, style_profile_id)
            if profile:
                style_info = {
                    "tone": profile.tone,
                    "pacing": profile.pacing,
                    "common_hooks": profile.common_hooks,
                    "do_rules": profile.do_rules,
                    "avoid_rules": profile.avoid_rules,
                }
                briefing_parts.append(
                    f"\nPerfil de estilo consolidado:\n{json.dumps(style_info, ensure_ascii=False)}"
                )

        briefing = "\n".join(briefing_parts)

        client = get_openai_client()
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": GENERATOR_PROMPT},
                {"role": "user", "content": briefing},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        return json.loads(response.choices[0].message.content)

    async def _build_niche_style(
        self, theme: str, niche: str | None, db: AsyncSession
    ) -> str | None:
        """Constrói contexto de estilo a partir dos vídeos do nicho,
        priorizando os com mais views/likes."""

        # Buscar vídeos do nicho (ou todos se niche não informado),
        # priorizados por views
        video_stmt = (
            select(Video)
            .where(Video.status == "done")
        )
        if niche:
            video_stmt = video_stmt.where(Video.niche == niche)

        video_stmt = video_stmt.order_by(
            Video.view_count.desc().nullslast(),
            Video.like_count.desc().nullslast(),
            Video.created_at.desc(),
        ).limit(10)

        result = await db.execute(video_stmt)
        videos = result.scalars().all()

        if not videos:
            # Fallback: busca por similaridade semântica sem filtro de nicho
            return await self._fallback_semantic(theme, db)

        video_ids = [v.id for v in videos]

        # Buscar segmentos desses vídeos
        seg_result = await db.execute(
            select(TranscriptSegment)
            .where(TranscriptSegment.video_id.in_(video_ids))
            .order_by(TranscriptSegment.start_time)
        )
        all_segments = seg_result.scalars().all()

        # Buscar beats desses vídeos
        beat_result = await db.execute(
            select(ScriptBeat)
            .where(ScriptBeat.video_id.in_(video_ids))
        )
        all_beats = beat_result.scalars().all()
        beats_by_video = {}
        for b in all_beats:
            beats_by_video.setdefault(b.video_id, []).append(b)

        # Agrupar segmentos por vídeo
        segments_by_video = {}
        for s in all_segments:
            segments_by_video.setdefault(s.video_id, []).append(s)

        # Montar contexto com exemplos reais de fala
        parts = ["\n## VÍDEOS DE REFERÊNCIA DO NICHO"]
        parts.append("Analise o estilo de fala abaixo e REPLIQUE o linguajar, "
                      "trejeitos, abreviações e método de storytelling.\n")

        for video in videos:
            segs = segments_by_video.get(video.id, [])
            if not segs:
                continue

            header = f"### {video.title}"
            if video.view_count:
                header += f" ({video.view_count:,} views)"
            parts.append(header)

            # Hooks do vídeo (os primeiros segmentos são os mais importantes para estilo)
            beats = beats_by_video.get(video.id, [])
            hook_seg_ids = {
                b.segment_id for b in beats
                if b.beat_type and b.beat_type.value == "hook"
            }

            # Mostrar os hooks explicitamente
            for s in segs:
                if s.id in hook_seg_ids:
                    parts.append(f"  [HOOK] \"{s.text}\"")

            # Amostra de falas do vídeo (primeiros + meio + final)
            sample = _pick_samples(segs, max_per_video=6)
            for s in sample:
                if s.id not in hook_seg_ids:
                    parts.append(f"  ({s.start_time:.0f}s) \"{s.text}\"")

            parts.append("")

        # Também buscar segmentos semanticamente similares ao tema
        similar = await self._search_similar(theme, db, niche=niche)
        if similar:
            parts.append("### Trechos mais relevantes para o tema")
            for s in similar:
                parts.append(f"  \"{s.text}\"")

        return "\n".join(parts)

    async def _search_similar(
        self, theme: str, db: AsyncSession, niche: str | None = None, limit: int = 5
    ) -> list:
        client = get_openai_client()
        embedding_response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=theme,
        )
        query_embedding = embedding_response.data[0].embedding

        stmt = (
            select(TranscriptSegment)
            .where(TranscriptSegment.embedding.isnot(None))
        )
        if niche:
            stmt = stmt.join(Video, TranscriptSegment.video_id == Video.id).where(
                Video.niche == niche
            )

        stmt = stmt.order_by(
            TranscriptSegment.embedding.cosine_distance(query_embedding)
        ).limit(limit)

        result = await db.execute(stmt)
        return result.scalars().all()

    async def _build_insights_context(
        self, niche: str | None, theme: str | None, db: AsyncSession
    ) -> str | None:
        """Fetch active channel insights relevant to the niche/theme."""
        from app.models.insight import ChannelInsight

        stmt = (
            select(ChannelInsight)
            .where(ChannelInsight.is_active == True)  # noqa: E712
        )
        if niche:
            stmt = stmt.where(
                (ChannelInsight.niche == niche) | (ChannelInsight.niche.is_(None))
            )
        stmt = stmt.order_by(ChannelInsight.confidence.desc()).limit(10)

        result = await db.execute(stmt)
        insights = result.scalars().all()

        if not insights:
            return None

        parts = ["\n## APRENDIZADOS DO CANAL (insights validados por dados reais)"]
        parts.append("Use estes insights para informar suas decisoes criativas:\n")

        for i in insights:
            sentiment_emoji = "✅" if i.sentiment.value == "positive" else "❌" if i.sentiment.value == "negative" else "ℹ️"
            parts.append(
                f"  {sentiment_emoji} [{i.category.value}] {i.title} "
                f"(confianca: {i.confidence:.0%}, validado {i.times_validated}x)"
            )
            parts.append(f"     {i.description}")

        return "\n".join(parts)

    async def _fallback_semantic(self, theme: str, db: AsyncSession) -> str | None:
        """Quando não há vídeos no nicho, busca por similaridade pura."""
        similar = await self._search_similar(theme, db)
        if not similar:
            return None

        parts = ["\n## EXEMPLOS DE REFERÊNCIA (busca semântica)"]
        parts.append("Use estes trechos como referência de linguagem e estilo.\n")
        for s in similar:
            parts.append(f"  ({s.start_time:.1f}s) \"{s.text}\"")
        return "\n".join(parts)


def _pick_samples(segments: list, max_per_video: int = 6) -> list:
    """Pega amostras do início, meio e final do vídeo."""
    if len(segments) <= max_per_video:
        return segments

    n = max_per_video
    third = n // 3
    rest = n - 2 * third

    start = segments[:third]
    mid_idx = len(segments) // 2
    middle = segments[mid_idx - third // 2 : mid_idx + (third - third // 2)]
    end = segments[-rest:]

    seen = set()
    result = []
    for s in start + middle + end:
        if s.id not in seen:
            seen.add(s.id)
            result.append(s)
    return result
