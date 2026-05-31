"""
Testes de integração — Endpoints /api/styles

Cobre:
- GET /: 200 lista vazia, 200 com dados
- GET /:id: 200 encontrado, 404 não encontrado
- POST /generate: 202 com payload válido, 422 com validação
"""
import uuid

import pytest
from httpx import AsyncClient

from tests.factories.factories import StyleProfileFactory


# ============================================================
# GET /api/styles
# ============================================================


@pytest.mark.asyncio
async def test_list_styles_empty(client: AsyncClient):
    response = await client.get("/api/styles")
    assert response.status_code == 200
    assert response.json()["data"] == []


@pytest.mark.asyncio
async def test_list_styles_with_data(client: AsyncClient, db_session):
    profile = StyleProfileFactory.create(name="Gaming Style")
    db_session.add(profile)
    await db_session.flush()

    response = await client.get("/api/styles")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["name"] == "Gaming Style"


# ============================================================
# GET /api/styles/:id
# ============================================================


@pytest.mark.asyncio
async def test_get_style_found(client: AsyncClient, db_session):
    profile = StyleProfileFactory.create(name="Found Style")
    db_session.add(profile)
    await db_session.flush()

    response = await client.get(f"/api/styles/{profile.id}")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "Found Style"


@pytest.mark.asyncio
async def test_get_style_not_found(client: AsyncClient):
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/styles/{fake_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_style_response_fields(client: AsyncClient, db_session):
    profile = StyleProfileFactory.create(
        name="Full Style",
        tone="casual",
        pacing="rápido",
        common_hooks=["Hook A"],
        do_rules=["usar perguntas"],
        avoid_rules=["frases longas"],
    )
    db_session.add(profile)
    await db_session.flush()

    data = (await client.get(f"/api/styles/{profile.id}")).json()["data"]
    assert data["tone"] == "casual"
    assert data["pacing"] == "rápido"
    assert isinstance(data["common_hooks"], list)
    assert isinstance(data["do_rules"], list)
    assert isinstance(data["avoid_rules"], list)
    assert "created_at" in data


@pytest.mark.asyncio
async def test_get_style_arrays_never_null(client: AsyncClient, db_session):
    """Arrays no StyleProfile nunca devem ser null — contrato com frontend."""
    profile = StyleProfileFactory.create(
        common_hooks=["hook"],
        common_ctas=["cta"],
        narrative_patterns=["pattern"],
        do_rules=["rule"],
        avoid_rules=["avoid"],
    )
    db_session.add(profile)
    await db_session.flush()

    data = (await client.get(f"/api/styles/{profile.id}")).json()["data"]
    for field in ["common_hooks", "common_ctas", "narrative_patterns", "do_rules", "avoid_rules"]:
        assert data[field] is not None, f"{field} não deve ser null"
        assert isinstance(data[field], list), f"{field} deve ser lista"


# ============================================================
# POST /api/styles/generate
# ============================================================


@pytest.mark.asyncio
async def test_generate_style_202(client: AsyncClient, mock_celery, db_session):
    response = await client.post(
        "/api/styles/generate",
        json={
            "video_ids": [str(uuid.uuid4())],
            "name": "Estilo Novo",
        },
    )
    assert response.status_code == 202
    assert "task_id" in response.json()["data"]


@pytest.mark.asyncio
async def test_generate_style_422_empty_video_ids(client: AsyncClient):
    response = await client.post(
        "/api/styles/generate",
        json={"video_ids": [], "name": "Vazio"},
    )
    assert response.status_code == 422, "video_ids vazio deve retornar 422"


@pytest.mark.asyncio
async def test_generate_style_422_missing_name(client: AsyncClient):
    response = await client.post(
        "/api/styles/generate",
        json={"video_ids": [str(uuid.uuid4())]},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_generate_style_422_empty_body(client: AsyncClient):
    response = await client.post("/api/styles/generate", json={})
    assert response.status_code == 422
