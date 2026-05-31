"""
Testes de unidade — RetentionCriticAgent

Cobre:
- Happy path: retorna improved_lines, problems_found, analysis
- Output validável pelo schema Pydantic
- Entrada vazia: rejeita roteiro vazio
- JSON malformado do LLM
- Com e sem goal
"""
import json

import pytest

from app.agents.retention_critic_agent import RetentionCriticAgent
from app.schemas.generate import ImproveOutput


# ============================================================
# Happy path
# ============================================================


@pytest.mark.asyncio
async def test_critic_returns_improved_script(mock_openai_improve, sample_script_lines):
    agent = RetentionCriticAgent()
    result = await agent.run(lines=sample_script_lines)

    assert "improved_lines" in result, "Deve retornar 'improved_lines'"
    assert "problems_found" in result, "Deve retornar 'problems_found'"
    assert "analysis" in result, "Deve retornar 'analysis'"


@pytest.mark.asyncio
async def test_critic_improved_lines_have_fields(mock_openai_improve, sample_script_lines):
    agent = RetentionCriticAgent()
    result = await agent.run(lines=sample_script_lines)

    for line in result["improved_lines"]:
        assert "start" in line
        assert "end" in line
        assert "line" in line
        assert "function" in line


@pytest.mark.asyncio
async def test_critic_output_validates_against_schema(mock_openai_improve, sample_script_lines):
    agent = RetentionCriticAgent()
    result = await agent.run(lines=sample_script_lines)

    output = ImproveOutput(**result)
    assert len(output.improved_lines) > 0
    assert isinstance(output.problems_found, list)


# ============================================================
# Com goal
# ============================================================


@pytest.mark.asyncio
async def test_critic_with_goal(mock_openai_improve, sample_script_lines):
    agent = RetentionCriticAgent()
    result = await agent.run(lines=sample_script_lines, goal="mais curiosity gaps")

    # Verify goal was included in prompt
    call_args = mock_openai_improve.chat.completions.create.call_args
    user_message = call_args.kwargs["messages"][1]["content"]
    assert "mais curiosity gaps" in user_message


# ============================================================
# Entrada inválida
# ============================================================


@pytest.mark.asyncio
async def test_critic_empty_lines_raises():
    agent = RetentionCriticAgent()
    with pytest.raises(ValueError, match="vazio"):
        await agent.run(lines=[])


# ============================================================
# JSON malformado
# ============================================================


@pytest.mark.asyncio
async def test_critic_malformed_json_raises(mock_openai_malformed, sample_script_lines):
    agent = RetentionCriticAgent()
    with pytest.raises(json.JSONDecodeError):
        await agent.run(lines=sample_script_lines)


# ============================================================
# API error
# ============================================================


@pytest.mark.asyncio
async def test_critic_api_error_propagates(mock_openai_api_error, sample_script_lines):
    from openai import APIError

    agent = RetentionCriticAgent()
    with pytest.raises(APIError):
        await agent.run(lines=sample_script_lines)
