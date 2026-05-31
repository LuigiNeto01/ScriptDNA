"""
Testes de integração — Endpoint /api/search

Cobre:
- GET /: 200 com query válida (resultado vazio sem embeddings)
- GET /: 422 com query curta
- GET /: 422 com query ausente
- Validação de parâmetros limit e niche
"""
import pytest
from httpx import AsyncClient


# ============================================================
# GET /api/search — Validação
# ============================================================


@pytest.mark.asyncio
async def test_search_422_query_too_short(client: AsyncClient):
    response = await client.get("/api/search?query=ab")
    assert response.status_code == 422, "query < 3 chars deve retornar 422"


@pytest.mark.asyncio
async def test_search_422_missing_query(client: AsyncClient):
    response = await client.get("/api/search")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_search_422_limit_zero(client: AsyncClient):
    response = await client.get("/api/search?query=teste&limit=0")
    assert response.status_code == 422, "limit < 1 deve retornar 422"


@pytest.mark.asyncio
async def test_search_422_limit_too_high(client: AsyncClient):
    response = await client.get("/api/search?query=teste&limit=100")
    assert response.status_code == 422, "limit > 50 deve retornar 422"


# ============================================================
# GET /api/search — Happy path (sem embeddings = resultado vazio)
# ============================================================


@pytest.mark.asyncio
async def test_search_200_empty_results(client: AsyncClient, mock_openai):
    response = await client.get("/api/search?query=minecraft atualização")
    assert response.status_code == 200
    assert response.json()["data"] == []


@pytest.mark.asyncio
async def test_search_200_with_niche_filter(client: AsyncClient, mock_openai):
    response = await client.get("/api/search?query=teste de busca&niche=gaming")
    assert response.status_code == 200
    assert isinstance(response.json()["data"], list)


@pytest.mark.asyncio
async def test_search_200_with_limit(client: AsyncClient, mock_openai):
    response = await client.get("/api/search?query=teste de busca&limit=5")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) <= 5
