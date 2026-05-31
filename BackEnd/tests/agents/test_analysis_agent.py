"""
Testes de unidade — AnalysisAgent

Cobre:
- Happy path: segmentos válidos geram beats classificados
- Output malformado do LLM: JSON inválido
- Campos ausentes: resposta sem 'beats'
- Beats vazios: LLM retorna array vazio
- Entrada inválida: lista de segmentos vazia
- Falha de API: OpenAI retorna erro (429/500)
"""
import json

import pytest

from app.agents.analysis_agent import AnalysisAgent


# ============================================================
# Happy path
# ============================================================


@pytest.mark.asyncio
async def test_analysis_returns_beats(mock_openai, sample_segments):
    agent = AnalysisAgent()
    result = await agent.run(sample_segments)

    assert "beats" in result, "Resultado deve conter chave 'beats'"
    assert len(result["beats"]) > 0, "Deve retornar pelo menos 1 beat"


@pytest.mark.asyncio
async def test_analysis_beat_has_required_fields(mock_openai, sample_segments):
    agent = AnalysisAgent()
    result = await agent.run(sample_segments)

    beat = result["beats"][0]
    required_fields = [
        "segment_index", "beat_type", "techniques",
        "attention_goal", "emotion", "intensity_score",
    ]
    for field in required_fields:
        assert field in beat, f"Beat deve conter campo '{field}'"


@pytest.mark.asyncio
async def test_analysis_beat_type_is_valid(mock_openai, sample_segments):
    agent = AnalysisAgent()
    result = await agent.run(sample_segments)

    valid_types = {"hook", "setup", "conflict", "escalation", "payoff", "cta"}
    for beat in result["beats"]:
        assert beat["beat_type"] in valid_types, (
            f"beat_type '{beat['beat_type']}' não é válido. "
            f"Esperado: {valid_types}"
        )


@pytest.mark.asyncio
async def test_analysis_intensity_score_range(mock_openai, sample_segments):
    agent = AnalysisAgent()
    result = await agent.run(sample_segments)

    for beat in result["beats"]:
        score = beat["intensity_score"]
        assert 0.0 <= score <= 1.0, (
            f"intensity_score deve estar entre 0.0 e 1.0, obteve {score}"
        )


@pytest.mark.asyncio
async def test_analysis_techniques_have_name_and_confidence(mock_openai, sample_segments):
    agent = AnalysisAgent()
    result = await agent.run(sample_segments)

    for beat in result["beats"]:
        for tech in beat.get("techniques", []):
            assert "name" in tech, "Técnica deve ter campo 'name'"
            assert "confidence" in tech, "Técnica deve ter campo 'confidence'"


@pytest.mark.asyncio
async def test_analysis_calls_gpt4o(mock_openai, sample_segments):
    agent = AnalysisAgent()
    await agent.run(sample_segments)

    call_args = mock_openai.chat.completions.create.call_args
    assert call_args.kwargs["model"] == "gpt-4o", "AnalysisAgent deve usar gpt-4o"
    assert call_args.kwargs["response_format"] == {"type": "json_object"}


# ============================================================
# Output malformado do LLM
# ============================================================


@pytest.mark.asyncio
async def test_analysis_malformed_json_raises(mock_openai_malformed, sample_segments):
    agent = AnalysisAgent()
    with pytest.raises(json.JSONDecodeError):
        await agent.run(sample_segments)


# ============================================================
# Campos ausentes
# ============================================================


@pytest.mark.asyncio
async def test_analysis_missing_beats_key(mock_openai_missing_fields, sample_segments):
    agent = AnalysisAgent()
    result = await agent.run(sample_segments)
    assert "beats" not in result, (
        "Quando LLM retorna JSON sem 'beats', resultado não deve ter 'beats'"
    )


# ============================================================
# Beats vazios
# ============================================================


@pytest.mark.asyncio
async def test_analysis_empty_beats(mock_openai_empty_beats, sample_segments):
    agent = AnalysisAgent()
    result = await agent.run(sample_segments)
    assert result["beats"] == [], "Quando LLM retorna beats vazio, deve ser []"


# ============================================================
# Entrada inválida
# ============================================================


@pytest.mark.asyncio
async def test_analysis_empty_segments_raises():
    agent = AnalysisAgent()
    with pytest.raises(ValueError, match="vazia"):
        await agent.run([])


# ============================================================
# Falha de API
# ============================================================


@pytest.mark.asyncio
async def test_analysis_api_error_propagates(mock_openai_api_error, sample_segments):
    from openai import APIError

    agent = AnalysisAgent()
    with pytest.raises(APIError):
        await agent.run(sample_segments)
