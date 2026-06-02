import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.script import Script, ScriptStatus
from app.models.youtube import YouTubeShort


async def link_short_to_script(
    *,
    short: YouTubeShort,
    script: Script,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    if short.user_id != user_id or script.user_id != user_id:
        raise HTTPException(status_code=404, detail="Short or script not found")

    previous_script_link = await db.execute(
        select(YouTubeShort).where(
            YouTubeShort.user_id == user_id,
            YouTubeShort.script_id == script.id,
            YouTubeShort.id != short.id,
        )
    )
    for linked_short in previous_script_link.scalars().all():
        linked_short.script_id = None

    if short.script_id and short.script_id != script.id:
        old_script = await db.get(Script, short.script_id)
        if old_script and old_script.user_id == user_id and old_script.youtube_video_id == short.youtube_video_id:
            old_script.youtube_video_id = None

    previous_short_for_script = await db.execute(
        select(YouTubeShort).where(
            YouTubeShort.user_id == user_id,
            YouTubeShort.youtube_video_id == script.youtube_video_id,
        )
    )
    old_short = previous_short_for_script.scalar_one_or_none()
    if old_short and old_short.id != short.id and old_short.script_id == script.id:
        old_short.script_id = None

    if script.youtube_video_id and script.youtube_video_id != short.youtube_video_id:
        old_script_short_result = await db.execute(
            select(YouTubeShort).where(
                YouTubeShort.user_id == user_id,
                YouTubeShort.youtube_video_id == script.youtube_video_id,
                YouTubeShort.script_id == script.id,
            )
        )
        old_script_short = old_script_short_result.scalar_one_or_none()
        if old_script_short:
            old_script_short.script_id = None

    short.script_id = script.id
    script.youtube_video_id = short.youtube_video_id
    if script.status == ScriptStatus.APPROVED:
        script.status = ScriptStatus.PUBLISHED


async def unlink_short_from_script(
    *,
    short: YouTubeShort,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    if short.user_id != user_id:
        raise HTTPException(status_code=404, detail="Short not found")

    if not short.script_id:
        return

    script = await db.get(Script, short.script_id)
    if script and script.user_id == user_id and script.youtube_video_id == short.youtube_video_id:
        script.youtube_video_id = None

    short.script_id = None
