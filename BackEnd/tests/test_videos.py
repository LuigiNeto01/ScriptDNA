"""
Testes de integração — Endpoints /api/videos

Cobre:
- POST /text: 202 com payload válido, 422 com payload inválido
- POST /upload: 202 com arquivo válido, 400 com arquivo grande
- GET /: 200 lista vazia, com filtros, com paginação
- GET /:id: 200 encontrado, 404 não encontrado
- GET /:id/beats: 200 vazio, 200 com dados
- GET /:id/segments: 200 vazio, 200 com dados
"""
import uuid

import pytest
from httpx import AsyncClient

from app.models import BeatType, SegmentTechnique, Technique, VideoStatus
from tests.factories.factories import (
    ScriptBeatFactory,
    TranscriptSegmentFactory,
    VideoFactory,
)


# ============================================================
# POST /api/videos/text
# ============================================================


@pytest.mark.asyncio
async def test_create_video_from_text_202(client: AsyncClient, mock_celery):
    response = await client.post(
        "/api/videos/text",
        json={
            "title": "Meu primeiro vídeo",
            "text": "Este é um roteiro de teste para análise de retenção de audiência.",
            "creator_name": "Creator Teste",
            "niche": "tech",
        },
    )
    assert response.status_code == 202, f"Esperava 202, obteve {response.status_code}: {response.text}"
    data = response.json()
    assert "video_id" in data["data"]
    assert data["data"]["status"] == "pending"


@pytest.mark.asyncio
async def test_create_video_text_triggers_celery(client: AsyncClient, mock_celery):
    await client.post(
        "/api/videos/text",
        json={
            "title": "Teste celery",
            "text": "Texto com mais de dez caracteres para validação.",
        },
    )
    mock_celery["text"].delay.assert_called_once()


@pytest.mark.asyncio
async def test_create_video_text_422_missing_title(client: AsyncClient, mock_celery):
    response = await client.post(
        "/api/videos/text",
        json={"text": "Texto sem título para testar validação Pydantic."},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_video_text_422_text_too_short(client: AsyncClient, mock_celery):
    response = await client.post(
        "/api/videos/text",
        json={"title": "Título", "text": "curto"},
    )
    assert response.status_code == 422, "Texto com menos de 10 chars deve retornar 422"


@pytest.mark.asyncio
async def test_create_video_text_422_empty_body(client: AsyncClient, mock_celery):
    response = await client.post("/api/videos/text", json={})
    assert response.status_code == 422


# ============================================================
# POST /api/videos/upload
# ============================================================


@pytest.mark.asyncio
async def test_upload_video_202(client: AsyncClient, mock_celery, tmp_mp3_file):
    name, content, mime = tmp_mp3_file
    response = await client.post(
        "/api/videos/upload",
        files={"file": (name, content, mime)},
        data={"title": "Upload test", "niche": "gaming"},
    )
    assert response.status_code == 202
    assert "video_id" in response.json()["data"]


@pytest.mark.asyncio
async def test_upload_video_422_missing_title(client: AsyncClient, mock_celery, tmp_mp3_file):
    name, content, mime = tmp_mp3_file
    response = await client.post(
        "/api/videos/upload",
        files={"file": (name, content, mime)},
        data={"niche": "gaming"},
    )
    assert response.status_code == 422


# ============================================================
# POST /api/videos/url
# ============================================================


@pytest.mark.asyncio
async def test_create_video_from_url_202(client: AsyncClient, mock_celery):
    response = await client.post(
        "/api/videos/url",
        json={
            "url": "https://example.com/video",
            "creator_name": "Creator Teste",
            "niche": "tech",
        },
    )

    assert response.status_code == 202
    data = response.json()["data"]
    assert "video_id" in data
    assert data["task_id"] == "task-url-123"
    assert data["status"] == "pending"
    mock_celery["url"].delay.assert_called_once()


@pytest.mark.asyncio
async def test_create_video_from_url_422_invalid_url(client: AsyncClient, mock_celery):
    response = await client.post(
        "/api/videos/url",
        json={"url": "not-a-url"},
    )

    assert response.status_code == 422


# ============================================================
# GET /api/videos
# ============================================================


@pytest.mark.asyncio
async def test_list_videos_empty(client: AsyncClient):
    response = await client.get("/api/videos")
    assert response.status_code == 200
    assert response.json()["data"] == []


@pytest.mark.asyncio
async def test_list_videos_returns_created(client: AsyncClient, db_session):
    video = VideoFactory.create(title="Listed Video", niche="gaming")
    db_session.add(video)
    await db_session.flush()

    response = await client.get("/api/videos")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Listed Video"


@pytest.mark.asyncio
async def test_list_videos_filter_by_niche(client: AsyncClient, db_session):
    v1 = VideoFactory.create(title="V1", niche="gaming")
    v2 = VideoFactory.create(title="V2", niche="tech")
    db_session.add_all([v1, v2])
    await db_session.flush()

    response = await client.get("/api/videos?niche=gaming")
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["niche"] == "gaming"


@pytest.mark.asyncio
async def test_list_videos_filter_by_status(client: AsyncClient, db_session):
    v1 = VideoFactory.create(status=VideoStatus.DONE)
    v2 = VideoFactory.create(status=VideoStatus.PENDING)
    db_session.add_all([v1, v2])
    await db_session.flush()

    response = await client.get("/api/videos?status=pending")
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["status"] == "pending"


@pytest.mark.asyncio
async def test_list_videos_pagination(client: AsyncClient, db_session):
    for i in range(5):
        db_session.add(VideoFactory.create(title=f"V{i}"))
    await db_session.flush()

    response = await client.get("/api/videos?limit=2&offset=0")
    assert len(response.json()["data"]) == 2

    response = await client.get("/api/videos?limit=2&offset=4")
    assert len(response.json()["data"]) == 1


@pytest.mark.asyncio
async def test_list_videos_invalid_limit(client: AsyncClient):
    response = await client.get("/api/videos?limit=0")
    assert response.status_code == 422


# ============================================================
# GET /api/videos/:id
# ============================================================


@pytest.mark.asyncio
async def test_get_video_found(client: AsyncClient, db_session):
    video = VideoFactory.create(title="Found Video")
    db_session.add(video)
    await db_session.flush()

    response = await client.get(f"/api/videos/{video.id}")
    assert response.status_code == 200
    assert response.json()["data"]["title"] == "Found Video"


@pytest.mark.asyncio
async def test_get_video_not_found(client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/videos/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_video_invalid_uuid(client: AsyncClient):
    response = await client.get("/api/videos/not-a-uuid")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_video_response_fields(client: AsyncClient, db_session):
    video = VideoFactory.create(
        title="Full Video", source_type="text",
        creator_name="Creator", niche="gaming",
    )
    db_session.add(video)
    await db_session.flush()

    data = (await client.get(f"/api/videos/{video.id}")).json()["data"]
    assert data["source_type"] == "text"
    assert data["creator_name"] == "Creator"
    assert data["niche"] == "gaming"
    assert "created_at" in data
    assert "status" in data


# ============================================================
# GET /api/videos/:id/beats
# ============================================================


@pytest.mark.asyncio
async def test_get_beats_empty(client: AsyncClient, db_session):
    video = VideoFactory.create()
    db_session.add(video)
    await db_session.flush()

    response = await client.get(f"/api/videos/{video.id}/beats")
    assert response.status_code == 200
    assert response.json()["data"] == []


@pytest.mark.asyncio
async def test_get_beats_with_data(client: AsyncClient, db_session):
    video = VideoFactory.create()
    db_session.add(video)
    await db_session.flush()

    beat = ScriptBeatFactory.create(video_id=video.id, beat_type=BeatType.HOOK)
    db_session.add(beat)
    await db_session.flush()

    response = await client.get(f"/api/videos/{video.id}/beats")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["beat_type"] == "hook"


@pytest.mark.asyncio
async def test_get_beats_404_video_not_found(client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/videos/{fake_id}/beats")
    assert response.status_code == 404


# ============================================================
# GET /api/videos/:id/segments
# ============================================================


@pytest.mark.asyncio
async def test_get_segments_empty(client: AsyncClient, db_session):
    video = VideoFactory.create()
    db_session.add(video)
    await db_session.flush()

    response = await client.get(f"/api/videos/{video.id}/segments")
    assert response.status_code == 200
    assert response.json()["data"] == []


@pytest.mark.asyncio
async def test_get_segments_with_data(client: AsyncClient, db_session):
    video = VideoFactory.create()
    db_session.add(video)
    await db_session.flush()

    seg = TranscriptSegmentFactory.create(
        video_id=video.id, start_time=0.0, end_time=5.0,
        text="Segmento de teste",
    )
    db_session.add(seg)
    await db_session.flush()

    response = await client.get(f"/api/videos/{video.id}/segments")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["text"] == "Segmento de teste"
    assert data[0]["start_time"] == 0.0
    assert data[0]["end_time"] == 5.0
    assert isinstance(data[0]["techniques"], list)


@pytest.mark.asyncio
async def test_get_segments_404_video_not_found(client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/videos/{fake_id}/segments")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_segments_techniques_is_always_list(client: AsyncClient, db_session):
    """Técnicas deve ser lista, nunca null — contrato com frontend."""
    video = VideoFactory.create()
    db_session.add(video)
    seg = TranscriptSegmentFactory.create(video_id=video.id)
    db_session.add(seg)
    await db_session.flush()

    response = await client.get(f"/api/videos/{video.id}/segments")
    for s in response.json()["data"]:
        assert isinstance(s["techniques"], list), (
            "techniques deve ser [] quando vazio, nunca null"
        )


@pytest.mark.asyncio
async def test_get_segments_with_technique_object(client: AsyncClient, db_session):
    video = VideoFactory.create()
    db_session.add(video)
    seg = TranscriptSegmentFactory.create(video_id=video.id)
    technique = Technique(name="curiosity_gap", description="Abre uma lacuna")
    db_session.add_all([seg, technique])
    await db_session.flush()

    db_session.add(
        SegmentTechnique(
            segment_id=seg.id,
            technique_id=technique.id,
            confidence=0.9,
            evidence="pergunta implicita",
        )
    )
    await db_session.flush()

    response = await client.get(f"/api/videos/{video.id}/segments")

    assert response.status_code == 200
    tech = response.json()["data"][0]["techniques"][0]
    assert tech["technique_id"] == str(technique.id)
    assert tech["technique"]["name"] == "curiosity_gap"
