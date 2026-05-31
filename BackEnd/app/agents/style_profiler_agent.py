import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.openai_client import get_openai_client
from app.models import ScriptBeat, TranscriptSegment, Video


PROFILER_PROMPT = """Você é um especialista em análise de estilo de criadores de conteúdo.

Com base nos beats narrativos e segmentos de transcrição dos vídeos abaixo, gere um perfil de estilo consolidado.

Responda APENAS com JSON válido:
{
  "description": "descrição geral do estilo",
  "tone": "tom predominante",
  "pacing": "ritmo (rápido, moderado, lento)",
  "avg_sentence_length": 12.5,
  "common_hooks": ["tipo de hook 1", "tipo de hook 2"],
  "common_ctas": ["cta padrão 1"],
  "narrative_patterns": ["padrão 1", "padrão 2"],
  "do_rules": ["regra positiva 1"],
  "avoid_rules": ["regra negativa 1"]
}
"""


class StyleProfilerAgent:
    async def run(
        self, video_ids: list[uuid.UUID], name: str, db: AsyncSession
    ) -> dict:
        videos_data = []

        for vid in video_ids:
            video = await db.get(Video, vid)
            if not video:
                continue

            segments_result = await db.execute(
                select(TranscriptSegment)
                .where(TranscriptSegment.video_id == vid)
                .order_by(TranscriptSegment.start_time)
            )
            segments = segments_result.scalars().all()

            beats_result = await db.execute(
                select(ScriptBeat).where(ScriptBeat.video_id == vid)
            )
            beats = beats_result.scalars().all()

            videos_data.append(
                {
                    "title": video.title,
                    "niche": video.niche,
                    "segments": [
                        {"text": s.text, "start": s.start_time, "end": s.end_time}
                        for s in segments
                    ],
                    "beats": [
                        {
                            "beat_type": b.beat_type.value,
                            "emotion": b.emotion,
                            "intensity": b.intensity_score,
                        }
                        for b in beats
                    ],
                }
            )

        if not videos_data:
            raise ValueError("Nenhum vídeo encontrado com os IDs fornecidos")

        client = get_openai_client()
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": PROFILER_PROMPT},
                {"role": "user", "content": json.dumps(videos_data, ensure_ascii=False)},
            ],
            response_format={"type": "json_object"},
            temperature=0.4,
        )

        profile_data = json.loads(response.choices[0].message.content)
        profile_data["name"] = name
        return profile_data
