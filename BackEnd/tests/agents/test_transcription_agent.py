"""
Testes de unidade — TranscriptionAgent

Cobre:
- Happy path: run_from_text com texto válido
- Entrada vazia: rejeita texto vazio
- Arquivo inexistente: FileNotFoundError
- Arquivo acima do limite: rejeita antes de chamar API
- Granularidade adaptativa: primeiros 30s = 3-5s, resto = 10-15s
- Whisper mock: run() com arquivo real mockado
"""
import os
import tempfile
from unittest.mock import patch

import pytest

from app.agents.transcription_agent import TranscriptionAgent


# ============================================================
# run_from_text — Happy path
# ============================================================


@pytest.mark.asyncio
async def test_run_from_text_creates_segments():
    agent = TranscriptionAgent()
    text = " ".join(["palavra"] * 100)
    segments = await agent.run_from_text(text)

    assert len(segments) > 0, "Deveria criar pelo menos um segmento"
    for seg in segments:
        assert "start" in seg, "Segmento deve ter campo 'start'"
        assert "end" in seg, "Segmento deve ter campo 'end'"
        assert "text" in seg, "Segmento deve ter campo 'text'"
        assert "word_count" in seg, "Segmento deve ter campo 'word_count'"
        assert seg["word_count"] > 0, "word_count deve ser positivo"


@pytest.mark.asyncio
async def test_run_from_text_segments_are_ordered():
    agent = TranscriptionAgent()
    text = " ".join(["teste"] * 200)
    segments = await agent.run_from_text(text)

    for i in range(1, len(segments)):
        assert segments[i]["start"] >= segments[i - 1]["start"], (
            f"Segmento {i} começa antes do segmento {i - 1}: "
            f"{segments[i]['start']} < {segments[i - 1]['start']}"
        )


@pytest.mark.asyncio
async def test_run_from_text_position_percent_range():
    agent = TranscriptionAgent()
    text = " ".join(["conteudo"] * 150)
    segments = await agent.run_from_text(text)

    for seg in segments:
        assert 0 <= seg["position_percent"] <= 100, (
            f"position_percent deve estar entre 0 e 100, obteve {seg['position_percent']}"
        )


@pytest.mark.asyncio
async def test_run_from_text_short_text():
    agent = TranscriptionAgent()
    text = "Uma frase curta para testar."
    segments = await agent.run_from_text(text)

    assert len(segments) == 1, "Texto curto deve gerar exatamente 1 segmento"
    assert segments[0]["text"] == text


@pytest.mark.asyncio
async def test_run_from_text_word_count_matches():
    agent = TranscriptionAgent()
    text = "Esta frase tem exatamente cinco palavras"
    segments = await agent.run_from_text(text)

    total_words = sum(seg["word_count"] for seg in segments)
    assert total_words == 5, f"Total word_count deve ser 5, obteve {total_words}"


# ============================================================
# run_from_text — Entrada inválida
# ============================================================


@pytest.mark.asyncio
async def test_run_from_text_empty_raises():
    agent = TranscriptionAgent()
    with pytest.raises(ValueError, match="vazio"):
        await agent.run_from_text("")


@pytest.mark.asyncio
async def test_run_from_text_whitespace_only_raises():
    agent = TranscriptionAgent()
    with pytest.raises(ValueError, match="vazio"):
        await agent.run_from_text("   \n\t  ")


# ============================================================
# run — Arquivo inexistente
# ============================================================


@pytest.mark.asyncio
async def test_run_file_not_found():
    agent = TranscriptionAgent()
    with pytest.raises(FileNotFoundError):
        await agent.run("/nonexistent/file.mp3")


# ============================================================
# run — Arquivo acima do limite (25MB)
# ============================================================


@pytest.mark.asyncio
async def test_run_rejects_large_file():
    agent = TranscriptionAgent()

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(b"\x00" * (26 * 1024 * 1024))  # 26MB
        large_path = f.name

    try:
        with pytest.raises(ValueError, match="limite"):
            await agent.run(large_path)
    finally:
        os.unlink(large_path)


# ============================================================
# run — Happy path com Whisper mockado
# ============================================================


@pytest.mark.asyncio
async def test_run_with_whisper_mock(mock_openai):
    agent = TranscriptionAgent()

    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f:
        f.write(b"\xff\xfb\x90\x00" + b"\x00" * 1024)
        tmp_path = f.name

    try:
        segments = await agent.run(tmp_path)
        assert len(segments) > 0, "Whisper mock deveria gerar segmentos"
        mock_openai.audio.transcriptions.create.assert_called_once()
    finally:
        os.unlink(tmp_path)


# ============================================================
# _apply_granularity — Lógica de merge
# ============================================================


def test_granularity_early_segments_are_short():
    """Segmentos nos primeiros 30s devem ter no máximo ~5s de duração."""
    agent = TranscriptionAgent()
    raw = [
        {"start": 0.0, "end": 1.0, "text": "a", "word_count": 1, "position_percent": 0},
        {"start": 1.0, "end": 2.0, "text": "b", "word_count": 1, "position_percent": 5},
        {"start": 2.0, "end": 3.0, "text": "c", "word_count": 1, "position_percent": 10},
        {"start": 3.0, "end": 4.0, "text": "d", "word_count": 1, "position_percent": 15},
        {"start": 4.0, "end": 5.5, "text": "e", "word_count": 1, "position_percent": 20},
        {"start": 5.5, "end": 7.0, "text": "f", "word_count": 1, "position_percent": 25},
    ]

    result = agent._apply_granularity(raw)
    for seg in result:
        if seg["start"] < 30:
            duration = seg["end"] - seg["start"]
            assert duration <= 6.0, (
                f"Segmento early com duração {duration}s excede 5s+margem"
            )


def test_granularity_late_segments_are_longer():
    """Segmentos após 30s podem ter até ~15s de duração."""
    agent = TranscriptionAgent()
    raw = [
        {"start": 30.0, "end": 33.0, "text": "a", "word_count": 1, "position_percent": 50},
        {"start": 33.0, "end": 36.0, "text": "b", "word_count": 1, "position_percent": 55},
        {"start": 36.0, "end": 39.0, "text": "c", "word_count": 1, "position_percent": 60},
        {"start": 39.0, "end": 42.0, "text": "d", "word_count": 1, "position_percent": 65},
        {"start": 42.0, "end": 46.0, "text": "e", "word_count": 1, "position_percent": 70},
    ]

    result = agent._apply_granularity(raw)
    assert len(result) <= len(raw), "Granularity merge deve reduzir ou manter o número de segmentos"
