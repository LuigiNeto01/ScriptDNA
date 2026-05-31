import asyncio
import uuid

from app.core.celery_app import celery_app
from app.db.session import make_session_factory
from app.models import StyleProfile, StyleVideo
from app.agents.style_profiler_agent import StyleProfilerAgent


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def generate_style_profile(self, video_ids: list[str], name: str):
    try:
        result = _run_async(_generate_profile(video_ids, name))
        return result
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=10)
def regenerate_style_profile(self, style_profile_id: str):
    try:
        result = _run_async(_regenerate_profile(style_profile_id))
        return result
    except Exception as exc:
        raise self.retry(exc=exc)


async def _generate_profile(video_ids_str: list[str], name: str) -> dict:
    video_ids = [uuid.UUID(vid) for vid in video_ids_str]

    session_factory = make_session_factory()
    async with session_factory() as db:
        agent = StyleProfilerAgent()
        profile_data = await agent.run(video_ids, name, db)

        profile = StyleProfile(
            name=profile_data["name"],
            description=profile_data.get("description"),
            tone=profile_data.get("tone"),
            pacing=profile_data.get("pacing"),
            avg_sentence_length=profile_data.get("avg_sentence_length"),
            common_hooks=profile_data.get("common_hooks"),
            common_ctas=profile_data.get("common_ctas"),
            narrative_patterns=profile_data.get("narrative_patterns"),
            do_rules=profile_data.get("do_rules"),
            avoid_rules=profile_data.get("avoid_rules"),
        )
        db.add(profile)
        await db.flush()

        for vid in video_ids:
            db.add(StyleVideo(style_profile_id=profile.id, video_id=vid))

        await db.commit()
        await db.refresh(profile)

        return {"style_profile_id": str(profile.id)}


async def _regenerate_profile(style_profile_id_str: str) -> dict:
    profile_id = uuid.UUID(style_profile_id_str)

    session_factory = make_session_factory()
    async with session_factory() as db:
        profile = await db.get(StyleProfile, profile_id)
        if not profile:
            raise ValueError(f"StyleProfile {profile_id} não encontrado")

        # Buscar vídeos vinculados
        from sqlalchemy import select
        result = await db.execute(
            select(StyleVideo.video_id).where(
                StyleVideo.style_profile_id == profile_id
            )
        )
        video_ids = [row[0] for row in result.all()]

        if not video_ids:
            raise ValueError("Nenhum vídeo vinculado ao perfil")

        agent = StyleProfilerAgent()
        profile_data = await agent.run(video_ids, profile.name, db)

        # Atualizar campos do perfil existente
        profile.description = profile_data.get("description")
        profile.tone = profile_data.get("tone")
        profile.pacing = profile_data.get("pacing")
        profile.avg_sentence_length = profile_data.get("avg_sentence_length")
        profile.common_hooks = profile_data.get("common_hooks")
        profile.common_ctas = profile_data.get("common_ctas")
        profile.narrative_patterns = profile_data.get("narrative_patterns")
        profile.do_rules = profile_data.get("do_rules")
        profile.avoid_rules = profile_data.get("avoid_rules")

        await db.commit()

        return {"style_profile_id": str(profile_id)}
