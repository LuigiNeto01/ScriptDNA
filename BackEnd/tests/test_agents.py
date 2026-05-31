"""
Testes de agentes básicos (mantidos para compatibilidade).
Testes completos estão em tests/agents/.

Cobre:
- TranscriptionAgent.run_from_text happy path
- TranscriptionAgent.run_from_text texto vazio
- TranscriptionAgent.run arquivo inexistente
"""
import pytest

from app.agents.transcription_agent import TranscriptionAgent


@pytest.mark.asyncio
async def test_transcription_from_text():
    agent = TranscriptionAgent()
    text = " ".join(["palavra"] * 100)
    segments = await agent.run_from_text(text)

    assert len(segments) > 0
    for seg in segments:
        assert "start" in seg
        assert "end" in seg
        assert "text" in seg
        assert "word_count" in seg
        assert seg["word_count"] > 0


@pytest.mark.asyncio
async def test_transcription_empty_text():
    agent = TranscriptionAgent()
    with pytest.raises(ValueError, match="vazio"):
        await agent.run_from_text("")


@pytest.mark.asyncio
async def test_transcription_file_not_found():
    agent = TranscriptionAgent()
    with pytest.raises(FileNotFoundError):
        await agent.run("/nonexistent/file.mp3")
