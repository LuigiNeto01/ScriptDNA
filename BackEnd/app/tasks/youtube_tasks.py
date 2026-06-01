import asyncio
import re
import uuid
from datetime import datetime, timezone

import httpx
from sqlalchemy import select

from app.core.celery_app import celery_app
from app.core.config import settings
from app.db.session import make_session_factory
from app.models.user import User
from app.models.youtube import ShortMetrics, ShortMetricsHistory, YouTubeShort


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


async def _refresh_token_if_needed(user: User, db) -> str:
    """Refresh YouTube access token if expired."""
    if user.youtube_token_expires_at and user.youtube_token_expires_at > datetime.now(timezone.utc):
        return user.youtube_access_token

    if not user.youtube_refresh_token:
        raise Exception("No refresh token available")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "refresh_token": user.youtube_refresh_token,
                "grant_type": "refresh_token",
            },
        )

    if response.status_code != 200:
        raise Exception(f"Token refresh failed: {response.text}")

    data = response.json()
    user.youtube_access_token = data["access_token"]
    from datetime import timedelta
    user.youtube_token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=data.get("expires_in", 3600))
    await db.commit()

    return user.youtube_access_token


def _parse_duration(duration_str: str) -> int:
    """Parse ISO 8601 duration (PT1M30S) to seconds."""
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration_str or "")
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def _is_short(video_details: dict) -> bool:
    """Determine if a YouTube video is a Short."""
    content_details = video_details.get("contentDetails", {})
    snippet = video_details.get("snippet", {})

    duration = _parse_duration(content_details.get("duration", ""))
    title = snippet.get("title", "").lower()
    description = snippet.get("description", "").lower()
    tags = [t.lower() for t in snippet.get("tags", [])]

    if duration <= 60:
        return True
    if "#shorts" in title or "#shorts" in description:
        return True
    if "shorts" in tags:
        return True
    return False


async def _fetch_analytics_metrics(access_token: str, video_id: str, published_at: datetime | None) -> dict:
    if not published_at:
        return {}

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://youtubeanalytics.googleapis.com/v2/reports",
                params={
                    "ids": "channel==MINE",
                    "startDate": published_at.strftime("%Y-%m-%d"),
                    "endDate": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "metrics": (
                        "views,likes,comments,shares,subscribersGained,"
                        "averageViewDuration,averageViewPercentage"
                    ),
                    "dimensions": "video",
                    "filters": f"video=={video_id}",
                },
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if response.status_code != 200:
            return {}

        rows = response.json().get("rows", [])
        if not rows:
            return {}

        row = rows[0]
        return {
            "views": row[1] if len(row) > 1 else None,
            "likes": row[2] if len(row) > 2 else None,
            "comments": row[3] if len(row) > 3 else None,
            "shares": row[4] if len(row) > 4 else None,
            "subscribers_gained": row[5] if len(row) > 5 else None,
            "average_view_duration_seconds": row[6] if len(row) > 6 else None,
            "average_view_percentage": row[7] if len(row) > 7 else None,
        }
    except Exception:
        return {}


def _int_metric(value, default: int = 0) -> int:
    if value is None:
        return default
    return int(value)


def _build_short_metrics(short: YouTubeShort, stats: dict, analytics_data: dict) -> ShortMetrics:
    data_api_views = _int_metric(stats.get("viewCount"))
    analytics_views = analytics_data.get("views")
    views = max(data_api_views, _int_metric(analytics_views)) if analytics_views is not None else data_api_views

    likes = _int_metric(analytics_data.get("likes"), _int_metric(stats.get("likeCount")))
    comments_count = _int_metric(analytics_data.get("comments"), _int_metric(stats.get("commentCount")))
    shares = _int_metric(analytics_data.get("shares"))
    subscribers_gained = _int_metric(analytics_data.get("subscribers_gained"))
    engagement_rate = (likes + comments_count + shares) / views * 100 if views > 0 else 0

    return ShortMetrics(
        youtube_short_id=short.id,
        views=views,
        likes=likes,
        comments=comments_count,
        shares=shares,
        subscribers_gained=subscribers_gained,
        average_view_duration_seconds=analytics_data.get("average_view_duration_seconds"),
        average_view_percentage=analytics_data.get("average_view_percentage"),
        engagement_rate=engagement_rate,
        source="youtube_analytics" if analytics_data else "youtube_api",
        published_at=short.published_at,
    )


@celery_app.task(name="app.tasks.youtube_tasks.sync_channel_shorts", bind=True, max_retries=3)
def sync_channel_shorts(self, user_id: str):
    """Sync all Shorts from user's YouTube channel."""
    return _run_async(_sync_channel_shorts(self, user_id))


async def _sync_channel_shorts(task, user_id: str):
    session_factory = make_session_factory()
    async with session_factory() as db:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user or not user.youtube_channel_id:
            return {"error": "User or channel not found"}

        access_token = await _refresh_token_if_needed(user, db)
        channel_id = user.youtube_channel_id

        task.update_state(state="PROGRESS", meta={"current_step": "Fetching videos", "progress": 10})

        # Fetch all videos from channel
        all_video_ids = []
        next_page_token = None

        async with httpx.AsyncClient() as client:
            while True:
                params = {
                    "part": "id",
                    "channelId": channel_id,
                    "type": "video",
                    "maxResults": 50,
                    "order": "date",
                    "key": settings.GOOGLE_CLIENT_ID,  # fallback to API key
                }
                if next_page_token:
                    params["pageToken"] = next_page_token

                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    params=params,
                    headers={"Authorization": f"Bearer {access_token}"},
                )

                if response.status_code != 200:
                    break

                data = response.json()
                video_ids = [item["id"]["videoId"] for item in data.get("items", []) if item["id"].get("videoId")]
                all_video_ids.extend(video_ids)

                next_page_token = data.get("nextPageToken")
                if not next_page_token or len(all_video_ids) >= 200:
                    break

        task.update_state(state="PROGRESS", meta={"current_step": "Filtering Shorts", "progress": 40})

        # Fetch details in batches of 50
        shorts_saved = 0
        for i in range(0, len(all_video_ids), 50):
            batch = all_video_ids[i:i + 50]

            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params={
                        "part": "snippet,contentDetails,statistics",
                        "id": ",".join(batch),
                    },
                    headers={"Authorization": f"Bearer {access_token}"},
                )

            if response.status_code != 200:
                continue

            videos_data = response.json().get("items", [])

            for video in videos_data:
                if not _is_short(video):
                    continue

                yt_video_id = video["id"]

                existing = await db.execute(
                    select(YouTubeShort).where(YouTubeShort.youtube_video_id == yt_video_id)
                )
                short = existing.scalar_one_or_none()

                snippet = video.get("snippet", {})
                stats = video.get("statistics", {})
                content_details = video.get("contentDetails", {})

                published_at = None
                if snippet.get("publishedAt"):
                    published_at = datetime.fromisoformat(snippet["publishedAt"].replace("Z", "+00:00"))

                if short:
                    short.title = snippet.get("title")
                    short.description = snippet.get("description")
                    short.published_at = published_at
                    short.thumbnail_url = snippet.get("thumbnails", {}).get("high", {}).get("url")
                    short.duration_seconds = _parse_duration(content_details.get("duration", ""))
                    short.tags = snippet.get("tags")
                else:
                    short = YouTubeShort(
                        user_id=uuid.UUID(user_id),
                        youtube_video_id=yt_video_id,
                        title=snippet.get("title"),
                        description=snippet.get("description"),
                        published_at=published_at,
                        thumbnail_url=snippet.get("thumbnails", {}).get("high", {}).get("url"),
                        duration_seconds=_parse_duration(content_details.get("duration", "")),
                        tags=snippet.get("tags"),
                    )
                    db.add(short)
                    shorts_saved += 1

                await db.flush()

                analytics_data = await _fetch_analytics_metrics(access_token, yt_video_id, published_at)
                metrics = _build_short_metrics(short, stats, analytics_data)
                if metrics.views > 0:
                    db.add(metrics)

        await db.commit()
        task.update_state(state="PROGRESS", meta={"current_step": "Complete", "progress": 100})
        return {"shorts_synced": shorts_saved, "metrics_updated": len(all_video_ids), "total_videos_checked": len(all_video_ids)}


@celery_app.task(name="app.tasks.youtube_tasks.fetch_short_metrics", bind=True, max_retries=3)
def fetch_short_metrics(self, user_id: str, short_id: str):
    """Fetch updated metrics for a specific Short."""
    return _run_async(_fetch_short_metrics(self, user_id, short_id))


async def _fetch_short_metrics(task, user_id: str, short_id: str):
    session_factory = make_session_factory()
    async with session_factory() as db:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            return {"error": "User not found"}

        result = await db.execute(select(YouTubeShort).where(YouTubeShort.id == uuid.UUID(short_id)))
        short = result.scalar_one_or_none()
        if not short:
            return {"error": "Short not found"}

        access_token = await _refresh_token_if_needed(user, db)

        # Fetch basic stats via Data API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/videos",
                params={
                    "part": "statistics",
                    "id": short.youtube_video_id,
                },
                headers={"Authorization": f"Bearer {access_token}"},
            )

        if response.status_code != 200:
            return {"error": "Failed to fetch video stats"}

        items = response.json().get("items", [])
        if not items:
            return {"error": "Video not found on YouTube"}

        stats = items[0].get("statistics", {})

        analytics_data = await _fetch_analytics_metrics(access_token, short.youtube_video_id, short.published_at)
        metrics = _build_short_metrics(short, stats, analytics_data)
        db.add(metrics)

        # History entry
        history = ShortMetricsHistory(
            youtube_short_id=short.id,
            views=metrics.views,
            likes=metrics.likes,
            comments=metrics.comments,
        )
        db.add(history)

        await db.commit()
        return {
            "views": metrics.views,
            "likes": metrics.likes,
            "comments": metrics.comments,
            "shares": metrics.shares,
            "subscribers_gained": metrics.subscribers_gained,
            "average_view_duration_seconds": metrics.average_view_duration_seconds,
        }


@celery_app.task(name="app.tasks.youtube_tasks.fetch_short_transcript", bind=True, max_retries=3)
def fetch_short_transcript(self, user_id: str, short_id: str):
    """Fetch transcript for a Short (captions or Whisper fallback)."""
    return _run_async(_fetch_short_transcript(self, user_id, short_id))


async def _fetch_short_transcript(task, user_id: str, short_id: str):
    session_factory = make_session_factory()
    async with session_factory() as db:
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            return {"error": "User not found"}

        result = await db.execute(select(YouTubeShort).where(YouTubeShort.id == uuid.UUID(short_id)))
        short = result.scalar_one_or_none()
        if not short:
            return {"error": "Short not found"}

        access_token = await _refresh_token_if_needed(user, db)

        # Try YouTube Captions API first
        transcript = None
        source = None

        try:
            async with httpx.AsyncClient() as client:
                # List captions
                response = await client.get(
                    "https://www.googleapis.com/youtube/v3/captions",
                    params={
                        "part": "snippet",
                        "videoId": short.youtube_video_id,
                    },
                    headers={"Authorization": f"Bearer {access_token}"},
                )

                if response.status_code == 200:
                    captions = response.json().get("items", [])
                    # Prefer manual captions, then auto-generated
                    caption_id = None
                    for cap in captions:
                        if cap["snippet"].get("trackKind") == "standard":
                            caption_id = cap["id"]
                            break
                    if not caption_id and captions:
                        caption_id = captions[0]["id"]

                    if caption_id:
                        # Download caption
                        cap_response = await client.get(
                            f"https://www.googleapis.com/youtube/v3/captions/{caption_id}",
                            params={"tfmt": "srt"},
                            headers={"Authorization": f"Bearer {access_token}"},
                        )
                        if cap_response.status_code == 200:
                            # Parse SRT to plain text
                            lines = cap_response.text.split("\n")
                            text_lines = [
                                line for line in lines
                                if line.strip() and not line.strip().isdigit()
                                and "-->" not in line
                            ]
                            transcript = " ".join(text_lines)
                            source = "youtube_captions"
        except Exception:
            pass

        # Fallback: download audio and use Whisper
        if not transcript:
            try:
                import tempfile
                from yt_dlp import YoutubeDL
                from app.agents.transcription_agent import TranscriptionAgent

                url = f"https://www.youtube.com/watch?v={short.youtube_video_id}"
                with tempfile.TemporaryDirectory() as tmp_dir:
                    options = {
                        "format": "bestaudio[ext=m4a]/bestaudio",
                        "outtmpl": f"{tmp_dir}/audio.%(ext)s",
                        "quiet": True,
                    }
                    with YoutubeDL(options) as ydl:
                        ydl.download([url])

                    # Find downloaded file
                    import os
                    files = os.listdir(tmp_dir)
                    if files:
                        file_path = os.path.join(tmp_dir, files[0])
                        agent = TranscriptionAgent()
                        segments = await agent.run(file_path)
                        transcript = " ".join(s["text"] for s in segments)
                        source = "whisper"
            except Exception:
                return {"error": "Could not fetch transcript"}

        if transcript:
            short.transcript = transcript
            short.transcript_source = source
            await db.commit()
            return {"transcript_length": len(transcript), "source": source}

        return {"error": "No transcript available"}
