"""
Testes de unidade — ScriptGeneratorAgent

Cobre:
- Happy path: gera roteiro com lines e analysis
- Output validável pelo schema Pydantic
- RAG busca segmentos similares
- Com e sem style_profile_id
- JSON malformado do LLM
- Falha de API
"""
import json
import uuid

import pytest

from app.agents.script_generator_agent import ScriptGenerationError, ScriptGeneratorAgent
from app.schemas.generate import ScriptGenerateOutput


# ============================================================
# Happy path
# ============================================================


@pytest.mark.asyncio
async def test_generator_returns_lines_and_analysis(mock_openai_script, db_session):
    agent = ScriptGeneratorAgent()
    result = await agent.run(
        theme="Atualização do Minecraft",
        duration=60,
        goal="engajamento",
        platform="youtube",
        style_profile_id=None,
        db=db_session,
    )

    assert "lines" in result, "Resultado deve conter 'lines'"
    assert "analysis" in result, "Resultado deve conter 'analysis'"
    assert len(result["lines"]) > 0, "Deve gerar pelo menos 1 linha de roteiro"


@pytest.mark.asyncio
async def test_generator_lines_have_required_fields(mock_openai_script, db_session):
    agent = ScriptGeneratorAgent()
    result = await agent.run(
        theme="teste", duration=30, goal=None,
        platform="youtube", style_profile_id=None, db=db_session,
    )

    for line in result["lines"]:
        assert "start" in line, "Linha deve ter 'start'"
        assert "end" in line, "Linha deve ter 'end'"
        assert "line" in line, "Linha deve ter 'line'"
        assert "function" in line, "Linha deve ter 'function'"


@pytest.mark.asyncio
async def test_generator_analysis_has_required_fields(mock_openai_script, db_session):
    agent = ScriptGeneratorAgent()
    result = await agent.run(
        theme="teste", duration=30, goal=None,
        platform="youtube", style_profile_id=None, db=db_session,
    )

    analysis = result["analysis"]
    assert "hook_strength" in analysis
    assert "curiosity_gaps" in analysis
    assert "weak_points" in analysis


@pytest.mark.asyncio
async def test_generator_output_validates_against_schema(mock_openai_script, db_session):
    agent = ScriptGeneratorAgent()
    result = await agent.run(
        theme="teste", duration=30, goal=None,
        platform="youtube", style_profile_id=None, db=db_session,
    )

    output = ScriptGenerateOutput(**result)
    assert len(output.lines) > 0
    assert 0 <= output.analysis.hook_strength <= 1.0


# ============================================================
# Com style_profile_id
# ============================================================


@pytest.mark.asyncio
async def test_generator_with_style_profile(mock_openai_script, db_session, style_factory):
    profile = style_factory.create()
    db_session.add(profile)
    await db_session.flush()

    agent = ScriptGeneratorAgent()
    result = await agent.run(
        theme="teste", duration=30, goal=None,
        platform="youtube", style_profile_id=profile.id, db=db_session,
    )

    assert "lines" in result
    # Verify prompt included style info
    call_args = mock_openai_script.chat.completions.create.call_args
    user_message = call_args.kwargs["messages"][1]["content"]
    assert "style_profile" in user_message, "Briefing deve incluir perfil de estilo"


@pytest.mark.asyncio
async def test_generator_with_invalid_style_id(mock_openai_script, db_session):
    """Style profile inexistente não deve causar erro — apenas ignora."""
    agent = ScriptGeneratorAgent()
    result = await agent.run(
        theme="teste", duration=30, goal=None,
        platform="youtube", style_profile_id=uuid.uuid4(), db=db_session,
    )

    assert "lines" in result


# ============================================================
# JSON malformado
# ============================================================


@pytest.mark.asyncio
async def test_generator_malformed_json_raises(mock_openai_malformed, db_session):
    agent = ScriptGeneratorAgent()
    with pytest.raises(ScriptGenerationError):
        await agent.run(
            theme="teste", duration=30, goal=None,
            platform="youtube", style_profile_id=None, db=db_session,
        )


# ============================================================
# API error
# ============================================================


@pytest.mark.asyncio
async def test_generator_api_error_propagates(mock_openai_api_error, db_session):
    from openai import APIError

    agent = ScriptGeneratorAgent()
    with pytest.raises(APIError):
        await agent.run(
            theme="teste", duration=30, goal=None,
            platform="youtube", style_profile_id=None, db=db_session,
        )
