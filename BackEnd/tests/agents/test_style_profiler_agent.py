"""
Testes de unidade — StyleProfilerAgent

Cobre:
- Happy path: retorna perfil consolidado com todos os campos
- Nenhum vídeo encontrado: raises ValueError
- JSON malformado do LLM
- API error
"""
import json
import uuid

import pytest

from app.agents.style_profiler_agent import StyleProfilerAgent
from app.models import VideoStatus


# ============================================================
# Happy path
# ============================================================


@pytest.mark.asyncio
async def test_profiler_returns_profile(mock_openai_style_profiler, db_session, video_factory, segment_factory, beat_factory):
    video = video_factory.create(status=VideoStatus.DONE)
    db_session.add(video)
    await db_session.flush()

    seg = segment_factory.create(video_id=video.id)
    db_session.add(seg)

    beat = beat_factory.create(video_id=video.id)
    db_session.add(beat)
    await db_session.flush()

    agent = StyleProfilerAgent()
    result = await agent.run(
        video_ids=[video.id],
        name="Estilo Gaming",
        db=db_session,
    )

    assert result["name"] == "Estilo Gaming"
    assert "tone" in result
    assert "pacing" in result
    assert "common_hooks" in result
    assert "do_rules" in result
    assert "avoid_rules" in result


@pytest.mark.asyncio
async def test_profiler_profile_fields_types(mock_openai_style_profiler, db_session, video_factory, segment_factory):
    video = video_factory.create()
    db_session.add(video)
    seg = segment_factory.create(video_id=video.id)
    db_session.add(seg)
    await db_session.flush()

    agent = StyleProfilerAgent()
    result = await agent.run(video_ids=[video.id], name="Test", db=db_session)

    assert isinstance(result["common_hooks"], list)
    assert isinstance(result["do_rules"], list)
    assert isinstance(result["avg_sentence_length"], (int, float))


# ============================================================
# Nenhum vídeo encontrado
# ============================================================


@pytest.mark.asyncio
async def test_profiler_no_videos_raises(mock_openai_style_profiler, db_session):
    agent = StyleProfilerAgent()
    with pytest.raises(ValueError, match="Nenhum vídeo"):
        await agent.run(
            video_ids=[uuid.uuid4()],
            name="Vazio",
            db=db_session,
        )


# ============================================================
# JSON malformado
# ============================================================


@pytest.mark.asyncio
async def test_profiler_malformed_json_raises(mock_openai_malformed, db_session, video_factory, segment_factory):
    video = video_factory.create()
    db_session.add(video)
    seg = segment_factory.create(video_id=video.id)
    db_session.add(seg)
    await db_session.flush()

    agent = StyleProfilerAgent()
    with pytest.raises(json.JSONDecodeError):
        await agent.run(video_ids=[video.id], name="Test", db=db_session)


# ============================================================
# API error
# ============================================================


@pytest.mark.asyncio
async def test_profiler_api_error_propagates(mock_openai_api_error, db_session, video_factory, segment_factory):
    from openai import APIError

    video = video_factory.create()
    db_session.add(video)
    seg = segment_factory.create(video_id=video.id)
    db_session.add(seg)
    await db_session.flush()

    agent = StyleProfilerAgent()
    with pytest.raises(APIError):
        await agent.run(video_ids=[video.id], name="Test", db=db_session)
