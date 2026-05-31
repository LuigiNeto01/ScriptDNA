import asyncio
import io
import json
import tempfile
import uuid
from collections.abc import AsyncGenerator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import VideoStatus

TEST_DATABASE_URL = "postgresql+asyncpg://scriptdna:scriptdna@localhost:5432/scriptdna_test"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(
    test_engine, class_=AsyncSession, expire_on_commit=False
)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with test_session_factory() as session:
        async with session.begin():
            yield session
            await session.rollback()

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ============================================================
# OpenAI Mock Fixtures
# ============================================================


def _make_chat_response(content: str | dict) -> MagicMock:
    """Build a mock OpenAI ChatCompletion response."""
    if isinstance(content, dict):
        content = json.dumps(content, ensure_ascii=False)
    message = MagicMock()
    message.content = content
    choice = MagicMock()
    choice.message = message
    response = MagicMock()
    response.choices = [choice]
    return response


def _make_embedding_response(dims: int = 1536) -> MagicMock:
    """Build a mock OpenAI embedding response."""
    embedding_obj = MagicMock()
    embedding_obj.embedding = [0.01] * dims
    response = MagicMock()
    response.data = [embedding_obj]
    return response


def _make_whisper_response(segments: list[dict] | None = None) -> MagicMock:
    """Build a mock OpenAI Whisper transcription response."""
    if segments is None:
        segments = [
            {"start": 0.0, "end": 3.0, "text": "Isso vai mudar tudo"},
            {"start": 3.0, "end": 7.0, "text": "Vocês não vão acreditar no que aconteceu"},
            {"start": 7.0, "end": 12.0, "text": "Mas antes disso preciso contar uma coisa"},
        ]

    mock_segments = []
    for seg in segments:
        s = MagicMock()
        s.start = seg["start"]
        s.end = seg["end"]
        s.text = seg["text"]
        mock_segments.append(s)

    response = MagicMock()
    response.segments = mock_segments
    response.duration = segments[-1]["end"] if segments else 0
    return response


@pytest.fixture
def mock_openai():
    """Mock all OpenAI client methods with sensible defaults."""
    with patch("app.core.openai_client.openai_client") as mock_client:
        # Chat completions
        mock_client.chat.completions.create = AsyncMock(
            return_value=_make_chat_response({
                "beats": [
                    {
                        "segment_index": 0,
                        "beat_type": "hook",
                        "techniques": [
                            {"name": "curiosity_gap", "confidence": 0.9, "evidence": "pergunta implícita"}
                        ],
                        "curiosity_question": "O que mudou?",
                        "attention_goal": "Capturar atenção",
                        "retention_function": "manter curiosidade",
                        "emotion": "curiosidade",
                        "intensity_score": 0.85,
                    }
                ]
            })
        )

        # Embeddings
        mock_client.embeddings.create = AsyncMock(
            return_value=_make_embedding_response()
        )

        # Whisper
        mock_client.audio.transcriptions.create = AsyncMock(
            return_value=_make_whisper_response()
        )

        yield mock_client


@pytest.fixture
def mock_openai_analysis(mock_openai):
    """Mock specifically configured for AnalysisAgent happy path."""
    return mock_openai


@pytest.fixture
def mock_openai_malformed(mock_openai):
    """Mock that returns malformed/unparseable JSON from chat completions."""
    mock_openai.chat.completions.create = AsyncMock(
        return_value=_make_chat_response("this is not valid json {{{")
    )
    return mock_openai


@pytest.fixture
def mock_openai_missing_fields(mock_openai):
    """Mock that returns JSON missing required fields."""
    mock_openai.chat.completions.create = AsyncMock(
        return_value=_make_chat_response({"unexpected_key": "no beats here"})
    )
    return mock_openai


@pytest.fixture
def mock_openai_empty_beats(mock_openai):
    """Mock that returns empty beats array."""
    mock_openai.chat.completions.create = AsyncMock(
        return_value=_make_chat_response({"beats": []})
    )
    return mock_openai


@pytest.fixture
def mock_openai_script(mock_openai):
    """Mock configured for ScriptGeneratorAgent."""
    mock_openai.chat.completions.create = AsyncMock(
        return_value=_make_chat_response({
            "lines": [
                {
                    "start": "0.0",
                    "end": "3.0",
                    "line": "Você não vai acreditar no que o Minecraft acabou de lançar",
                    "function": "hook",
                    "retention_note": "curiosity gap forte",
                },
                {
                    "start": "3.0",
                    "end": "8.0",
                    "line": "A nova atualização mudou completamente o jogo",
                    "function": "setup",
                    "retention_note": "contextualização rápida",
                },
            ],
            "analysis": {
                "hook_strength": 0.85,
                "curiosity_gaps": ["O que mudou no jogo?", "Qual a novidade?", "Vale a pena atualizar?"],
                "weak_points": ["payoff poderia ser mais forte"],
            },
        })
    )
    return mock_openai


@pytest.fixture
def mock_openai_improve(mock_openai):
    """Mock configured for RetentionCriticAgent."""
    mock_openai.chat.completions.create = AsyncMock(
        return_value=_make_chat_response({
            "improved_lines": [
                {
                    "start": "0.0",
                    "end": "3.0",
                    "line": "Hook melhorado com curiosity gap",
                    "function": "hook",
                    "retention_note": "mais impactante",
                }
            ],
            "problems_found": ["hook original era genérico"],
            "analysis": {
                "hook_strength": 0.92,
                "curiosity_gaps": ["O que muda?", "Por que isso importa?", "Como aplicar?", "Qual o resultado?"],
                "weak_points": [],
            },
        })
    )
    return mock_openai


@pytest.fixture
def mock_openai_hooks(mock_openai):
    """Mock configured for hooks generation."""
    mock_openai.chat.completions.create = AsyncMock(
        return_value=_make_chat_response({
            "hooks": [
                "Você sabia que 90% das pessoas erram isso?",
                "Isso mudou minha vida e ninguém fala sobre",
                "O segredo que os experts não contam",
            ]
        })
    )
    return mock_openai


@pytest.fixture
def mock_openai_style_profiler(mock_openai):
    """Mock configured for StyleProfilerAgent."""
    mock_openai.chat.completions.create = AsyncMock(
        return_value=_make_chat_response({
            "description": "Estilo energético e direto",
            "tone": "casual-energético",
            "pacing": "rápido",
            "avg_sentence_length": 10.5,
            "common_hooks": ["Você sabia que...", "Ninguém fala sobre..."],
            "common_ctas": ["Se inscreva!", "Comenta aqui"],
            "narrative_patterns": ["hook-conflict-payoff"],
            "do_rules": ["usar perguntas retóricas", "manter frases curtas"],
            "avoid_rules": ["frases longas", "introduções genéricas"],
        })
    )
    return mock_openai


@pytest.fixture
def mock_openai_api_error(mock_openai):
    """Mock that raises OpenAI API errors (429/500)."""
    from openai import APIError

    mock_openai.chat.completions.create = AsyncMock(
        side_effect=APIError(
            message="Rate limit exceeded",
            request=MagicMock(),
            body={"error": {"message": "Rate limit exceeded", "type": "rate_limit_error"}},
        )
    )
    return mock_openai


# ============================================================
# Celery Mock
# ============================================================


@pytest.fixture
def mock_celery():
    """Mock Celery task dispatch to prevent actual task execution."""
    with (
        patch("app.api.routers.videos.process_video_upload") as mock_upload,
        patch("app.api.routers.videos.process_video_text") as mock_text,
        patch("app.api.routers.videos.process_video_url") as mock_url,
        patch("app.api.routers.styles.generate_style_profile") as mock_style,
    ):
        mock_upload.delay = MagicMock(return_value=MagicMock(id="task-upload-123"))
        mock_text.delay = MagicMock(return_value=MagicMock(id="task-text-123"))
        mock_url.delay = MagicMock(return_value=MagicMock(id="task-url-123"))
        mock_style.delay = MagicMock(return_value=MagicMock(id="task-style-123"))
        yield {
            "upload": mock_upload,
            "text": mock_text,
            "url": mock_url,
            "style": mock_style,
        }


# ============================================================
# File Fixtures
# ============================================================


@pytest.fixture
def tmp_mp3_file():
    """A minimal fake MP3 file for upload tests."""
    content = b"\xff\xfb\x90\x00" + b"\x00" * 1024  # fake MP3 header + padding
    return ("test_audio.mp3", io.BytesIO(content), "audio/mpeg")


@pytest.fixture
def tmp_large_file():
    """A file that exceeds the 25MB upload limit."""
    content = b"\x00" * (26 * 1024 * 1024)  # 26MB
    return ("large_file.mp3", io.BytesIO(content), "audio/mpeg")


@pytest.fixture
def tmp_txt_file():
    """A text file for upload tests."""
    content = b"Este e um roteiro de teste para upload como arquivo de texto."
    return ("script.txt", io.BytesIO(content), "text/plain")


# ============================================================
# Helper factories as fixtures
# ============================================================


@pytest.fixture
def video_factory():
    """Factory function for creating Video instances in tests."""
    from tests.factories.factories import VideoFactory
    return VideoFactory


@pytest.fixture
def segment_factory():
    """Factory function for creating TranscriptSegment instances."""
    from tests.factories.factories import TranscriptSegmentFactory
    return TranscriptSegmentFactory


@pytest.fixture
def beat_factory():
    """Factory function for creating ScriptBeat instances."""
    from tests.factories.factories import ScriptBeatFactory
    return ScriptBeatFactory


@pytest.fixture
def style_factory():
    """Factory function for creating StyleProfile instances."""
    from tests.factories.factories import StyleProfileFactory
    return StyleProfileFactory


# ============================================================
# Sample data for agent tests
# ============================================================


@pytest.fixture
def sample_segments():
    """Standard segment list for agent input."""
    return [
        {"start": 0.0, "end": 2.5, "text": "Isso vai mudar o Minecraft para sempre", "word_count": 7},
        {"start": 2.5, "end": 6.0, "text": "A nova atualização trouxe um mob que ninguém esperava", "word_count": 9},
        {"start": 6.0, "end": 10.0, "text": "E o mais louco é que ele aparece só de noite", "word_count": 10},
    ]


@pytest.fixture
def sample_script_lines():
    """Standard script lines for improve/critic tests."""
    return [
        {"start": "0.0", "end": "3.0", "line": "Fala galera, tudo bem?", "function": "hook", "retention_note": None},
        {"start": "3.0", "end": "8.0", "line": "Hoje vou mostrar uma coisa", "function": "setup", "retention_note": None},
        {"start": "8.0", "end": "15.0", "line": "Isso mudou minha vida", "function": "payoff", "retention_note": None},
    ]
