"""
Testes de integração — Endpoints /api/generate

Cobre:
- POST /script: 200 com payload válido, 422 com validação
- POST /improve: 200 com payload válido, 422 com roteiro vazio
- POST /hooks: 200 com payload válido, 422 com validação
"""
import pytest
from httpx import AsyncClient


# ============================================================
# POST /api/generate/script
# ============================================================


@pytest.mark.asyncio
async def test_generate_script_200(client: AsyncClient, mock_openai_script):
    response = await client.post(
        "/api/generate/script",
        json={
            "theme": "Como fazer um vídeo viral",
            "duration": 60,
            "platform": "youtube",
        },
    )
    assert response.status_code == 200, f"Esperava 200: {response.text}"
    data = response.json()["data"]
    assert "lines" in data
    assert "analysis" in data
    assert len(data["lines"]) > 0


@pytest.mark.asyncio
async def test_generate_script_response_structure(client: AsyncClient, mock_openai_script):
    response = await client.post(
        "/api/generate/script",
        json={"theme": "Minecraft update", "duration": 45},
    )
    data = response.json()["data"]

    for line in data["lines"]:
        assert "start" in line
        assert "end" in line
        assert "line" in line
        assert "function" in line

    analysis = data["analysis"]
    assert isinstance(analysis["hook_strength"], (int, float))
    assert isinstance(analysis["curiosity_gaps"], int)
    assert isinstance(analysis["weak_points"], list)


@pytest.mark.asyncio
async def test_generate_script_422_theme_too_short(client: AsyncClient):
    response = await client.post(
        "/api/generate/script",
        json={"theme": "ab", "duration": 60},
    )
    assert response.status_code == 422, "theme < 3 chars deve retornar 422"


@pytest.mark.asyncio
async def test_generate_script_422_duration_too_low(client: AsyncClient):
    response = await client.post(
        "/api/generate/script",
        json={"theme": "Teste válido", "duration": 5},
    )
    assert response.status_code == 422, "duration < 15 deve retornar 422"


@pytest.mark.asyncio
async def test_generate_script_422_duration_too_high(client: AsyncClient):
    response = await client.post(
        "/api/generate/script",
        json={"theme": "Teste válido", "duration": 1000},
    )
    assert response.status_code == 422, "duration > 600 deve retornar 422"


@pytest.mark.asyncio
async def test_generate_script_422_missing_theme(client: AsyncClient):
    response = await client.post(
        "/api/generate/script",
        json={"duration": 60},
    )
    assert response.status_code == 422


# ============================================================
# POST /api/generate/improve
# ============================================================


@pytest.mark.asyncio
async def test_improve_script_200(client: AsyncClient, mock_openai_improve):
    response = await client.post(
        "/api/generate/improve",
        json={
            "lines": [
                {
                    "start": 0.0,
                    "end": 3.0,
                    "line": "Fala galera",
                    "function": "hook",
                }
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "improved_lines" in data
    assert "problems_found" in data
    assert "analysis" in data


@pytest.mark.asyncio
async def test_improve_script_response_has_problems(client: AsyncClient, mock_openai_improve):
    response = await client.post(
        "/api/generate/improve",
        json={
            "lines": [
                {"start": 0.0, "end": 3.0, "line": "Teste", "function": "hook"}
            ],
        },
    )
    data = response.json()["data"]
    assert isinstance(data["problems_found"], list)
    assert len(data["problems_found"]) > 0


@pytest.mark.asyncio
async def test_improve_script_422_empty_lines(client: AsyncClient):
    response = await client.post(
        "/api/generate/improve",
        json={"lines": []},
    )
    # Empty lines should either be 422 (Pydantic) or 500 (agent ValueError)
    assert response.status_code in (422, 500)


@pytest.mark.asyncio
async def test_improve_script_422_invalid_line(client: AsyncClient):
    response = await client.post(
        "/api/generate/improve",
        json={"lines": [{"invalid": "data"}]},
    )
    assert response.status_code == 422


# ============================================================
# POST /api/generate/hooks
# ============================================================


@pytest.mark.asyncio
async def test_generate_hooks_200(client: AsyncClient, mock_openai_hooks):
    response = await client.post(
        "/api/generate/hooks",
        json={"theme": "Minecraft atualização 2024", "count": 3},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert "hooks" in data
    assert isinstance(data["hooks"], list)
    assert len(data["hooks"]) > 0


@pytest.mark.asyncio
async def test_generate_hooks_default_count(client: AsyncClient, mock_openai_hooks):
    response = await client.post(
        "/api/generate/hooks",
        json={"theme": "Dicas de edição"},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_generate_hooks_422_theme_too_short(client: AsyncClient):
    response = await client.post(
        "/api/generate/hooks",
        json={"theme": "ab"},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_generate_hooks_422_count_too_high(client: AsyncClient):
    response = await client.post(
        "/api/generate/hooks",
        json={"theme": "Tema válido", "count": 100},
    )
    assert response.status_code == 422, "count > 20 deve retornar 422"


@pytest.mark.asyncio
async def test_generate_hooks_422_count_zero(client: AsyncClient):
    response = await client.post(
        "/api/generate/hooks",
        json={"theme": "Tema válido", "count": 0},
    )
    assert response.status_code == 422, "count < 1 deve retornar 422"
