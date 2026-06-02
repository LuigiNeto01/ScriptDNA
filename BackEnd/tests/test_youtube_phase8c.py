import uuid
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient

from app.models import (
    PerformanceAnalysis,
    Script,
    ScriptStatus,
    ShortMetrics,
    YouTubeShort,
    YouTubeShortBeat,
    YouTubeShortComment,
    YouTubeShortSegment,
)


USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def make_script(
    *,
    script_id: uuid.UUID | None = None,
    title: str = "Script de teste",
    status: ScriptStatus = ScriptStatus.DRAFT,
    youtube_video_id: str | None = None,
) -> Script:
    return Script(
        id=script_id or uuid.uuid4(),
        user_id=USER_ID,
        title=title,
        theme="Minecraft",
        niche="gaming",
        status=status,
        youtube_video_id=youtube_video_id,
    )


def make_short(
    *,
    short_id: uuid.UUID | None = None,
    youtube_video_id: str,
    title: str,
    transcript: str | None = None,
    script_id: uuid.UUID | None = None,
    published_at: datetime | None = None,
) -> YouTubeShort:
    return YouTubeShort(
        id=short_id or uuid.uuid4(),
        user_id=USER_ID,
        youtube_video_id=youtube_video_id,
        title=title,
        transcript=transcript,
        script_id=script_id,
        published_at=published_at or datetime.now(timezone.utc),
    )


@pytest.mark.asyncio
async def test_list_shorts_returns_aggregated_flags_and_latest_metrics(client: AsyncClient, db_session):
    script = make_script(title="Script vinculado", status=ScriptStatus.PUBLISHED)
    short = make_short(
        youtube_video_id="yt-001",
        title="Short com analise",
        transcript="texto",
        script_id=script.id,
    )
    db_session.add_all([script, short])
    await db_session.flush()

    db_session.add_all([
        ShortMetrics(
            youtube_short_id=short.id,
            views=1200,
            likes=80,
            comments=12,
            shares=5,
            average_view_percentage=68.5,
            engagement_rate=8.1,
            collected_at=datetime(2026, 6, 1, 12, 0, tzinfo=timezone.utc),
        ),
        ShortMetrics(
            youtube_short_id=short.id,
            views=1800,
            likes=120,
            comments=18,
            shares=9,
            average_view_percentage=74.2,
            engagement_rate=9.5,
            collected_at=datetime(2026, 6, 1, 13, 0, tzinfo=timezone.utc),
        ),
        YouTubeShortSegment(
            short_id=short.id,
            start_time=0,
            end_time=5,
            text="Hook",
            word_count=1,
            position_percent=0,
        ),
        YouTubeShortBeat(short_id=short.id, beat_type="hook"),
        PerformanceAnalysis(youtube_short_id=short.id, overall_score=8.5, timeline_analysis={"timeline_score": 0.8}),
        YouTubeShortComment(
            user_id=USER_ID,
            short_id=short.id,
            youtube_comment_id="comment-001",
            text="Muito bom",
            analyzed_at=datetime(2026, 6, 1, 14, 0, tzinfo=timezone.utc),
        ),
    ])
    await db_session.flush()

    response = await client.get("/api/youtube/shorts")
    assert response.status_code == 200

    item = response.json()["data"]["items"][0]
    assert item["title"] == "Short com analise"
    assert item["latest_metrics"]["views"] == 1800
    assert item["analysis_status"]["has_transcript"] is True
    assert item["analysis_status"]["has_segments"] is True
    assert item["analysis_status"]["has_beats"] is True
    assert item["analysis_status"]["has_performance_analysis"] is True
    assert item["analysis_status"]["has_timeline_analysis"] is True
    assert item["analysis_status"]["has_comments"] is True
    assert item["analysis_status"]["has_comment_analysis"] is True
    assert item["script_link"]["script_id"] == str(script.id)
    assert item["script_link"]["script_status"] == "published"


@pytest.mark.asyncio
async def test_list_shorts_filters_and_sorts_by_aggregated_fields(client: AsyncClient, db_session):
    analyzed = make_short(youtube_video_id="yt-a", title="Analisado", transcript="ok")
    no_transcript = make_short(youtube_video_id="yt-b", title="Sem transcricao")
    linked_script = make_script(title="Roteiro B")
    linked = make_short(youtube_video_id="yt-c", title="Com roteiro", script_id=linked_script.id, transcript="ok")
    db_session.add_all([analyzed, no_transcript, linked_script, linked])
    await db_session.flush()

    db_session.add_all([
        PerformanceAnalysis(youtube_short_id=analyzed.id, overall_score=7.0),
        ShortMetrics(youtube_short_id=analyzed.id, views=300, average_view_percentage=40, engagement_rate=2.1),
        ShortMetrics(youtube_short_id=no_transcript.id, views=800, average_view_percentage=90, engagement_rate=10.2),
        ShortMetrics(youtube_short_id=linked.id, views=500, average_view_percentage=60, engagement_rate=5.0),
    ])
    await db_session.flush()

    analyzed_response = await client.get("/api/youtube/shorts?has_analysis=true")
    assert [item["title"] for item in analyzed_response.json()["data"]["items"]] == ["Analisado"]

    transcript_response = await client.get("/api/youtube/shorts?has_transcript=false")
    assert [item["title"] for item in transcript_response.json()["data"]["items"]] == ["Sem transcricao"]

    linked_response = await client.get("/api/youtube/shorts?has_script=true")
    assert [item["title"] for item in linked_response.json()["data"]["items"]] == ["Com roteiro"]

    sorted_response = await client.get("/api/youtube/shorts?sort=retention")
    assert [item["title"] for item in sorted_response.json()["data"]["items"]][:3] == [
        "Sem transcricao",
        "Com roteiro",
        "Analisado",
    ]


@pytest.mark.asyncio
async def test_get_short_returns_script_link_and_analysis_status(client: AsyncClient, db_session):
    script = make_script(title="Roteiro do detalhe", status=ScriptStatus.APPROVED)
    short = make_short(
        youtube_video_id="yt-detail",
        title="Short detalhe",
        transcript="texto completo",
        script_id=script.id,
    )
    db_session.add_all([script, short])
    await db_session.flush()

    db_session.add(ShortMetrics(youtube_short_id=short.id, views=1500, average_view_percentage=66, engagement_rate=7.4))
    await db_session.flush()

    response = await client.get(f"/api/youtube/shorts/{short.id}")
    assert response.status_code == 200

    data = response.json()["data"]
    assert data["latest_metrics"]["views"] == 1500
    assert data["analysis_status"]["has_transcript"] is True
    assert data["script_link"]["script_title"] == "Roteiro do detalhe"
    assert data["script_link"]["script_status"] == "approved"


@pytest.mark.asyncio
async def test_link_short_to_script_replaces_existing_links_and_publishes_script(client: AsyncClient, db_session):
    target_script = make_script(title="Script alvo", status=ScriptStatus.APPROVED, youtube_video_id="yt-old")
    old_short = make_short(youtube_video_id="yt-old", title="Short antigo", script_id=target_script.id)
    new_short = make_short(youtube_video_id="yt-new", title="Short novo")
    db_session.add_all([target_script, old_short, new_short])
    await db_session.flush()

    response = await client.post(
        f"/api/youtube/shorts/{new_short.id}/link-script",
        json={"script_id": str(target_script.id)},
    )
    assert response.status_code == 200

    await db_session.refresh(target_script)
    await db_session.refresh(old_short)
    await db_session.refresh(new_short)

    assert new_short.script_id == target_script.id
    assert old_short.script_id is None
    assert target_script.youtube_video_id == "yt-new"
    assert target_script.status == ScriptStatus.PUBLISHED


@pytest.mark.asyncio
async def test_unlink_short_script_clears_script_video_id(client: AsyncClient, db_session):
    script = make_script(title="Script para remover", youtube_video_id="yt-unlink")
    short = make_short(youtube_video_id="yt-unlink", title="Short vinculado", script_id=script.id)
    db_session.add_all([script, short])
    await db_session.flush()

    response = await client.delete(f"/api/youtube/shorts/{short.id}/link-script")
    assert response.status_code == 200

    await db_session.refresh(script)
    await db_session.refresh(short)

    assert short.script_id is None
    assert script.youtube_video_id is None


@pytest.mark.asyncio
async def test_list_scripts_supports_text_query(client: AsyncClient, db_session):
    db_session.add_all([
        make_script(title="Gancho de Minecraft", youtube_video_id=None),
        make_script(title="Outro roteiro", youtube_video_id=None),
    ])
    await db_session.flush()

    response = await client.get("/api/scripts?q=Mine")
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) == 1
    assert data[0]["title"] == "Gancho de Minecraft"
