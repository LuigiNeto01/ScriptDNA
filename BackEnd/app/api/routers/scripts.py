import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_current_user
from app.db.session import get_db
from app.models.script import Script, ScriptStatus, ScriptVersion
from app.models.user import User
from app.models.youtube import YouTubeShort
from app.schemas.common import DataResponse
from app.schemas.script import (
    ScriptCreateInput,
    ScriptLinkVideoInput,
    ScriptStatusInput,
    ScriptUpdateInput,
    VersionCreateInput,
)
from app.services.short_script_link_service import link_short_to_script, unlink_short_from_script

router = APIRouter()


@router.post("", response_model=DataResponse, status_code=status.HTTP_201_CREATED)
async def create_script(
    body: ScriptCreateInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    script = Script(
        user_id=user.id,
        title=body.title,
        theme=body.theme,
        objective=body.objective,
        niche=body.niche,
        speaking_style=body.speaking_style,
        estimated_duration_seconds=body.estimated_duration_seconds,
    )
    db.add(script)
    await db.flush()

    # Create version 1
    version = ScriptVersion(
        script_id=script.id,
        version_number=1,
        hook=body.hook,
        narrative_structure=body.narrative_structure,
        cta=body.cta,
        lines=body.lines,
        analysis=body.analysis,
        generation_params=body.generation_params,
        created_by="user",
    )
    db.add(version)
    await db.flush()

    script.current_version_id = version.id
    await db.flush()

    return DataResponse(data={"script_id": str(script.id), "version_id": str(version.id)})


@router.get("", response_model=DataResponse)
async def list_scripts(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: ScriptStatus | None = Query(None, alias="status"),
    niche: str | None = None,
    theme: str | None = None,
    q: str | None = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    query = select(Script).where(Script.user_id == user.id)

    if status_filter:
        query = query.where(Script.status == status_filter)
    if niche:
        query = query.where(Script.niche == niche)
    if theme:
        query = query.where(Script.theme.ilike(f"%{theme}%"))
    if q:
        query = query.where(
            Script.title.ilike(f"%{q}%")
            | Script.theme.ilike(f"%{q}%")
            | Script.niche.ilike(f"%{q}%")
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Fetch
    query = query.order_by(Script.updated_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    scripts = result.scalars().all()

    return DataResponse(
        data=[_script_to_dict(s) for s in scripts],
    )


@router.get("/{script_id}", response_model=DataResponse)
async def get_script(
    script_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    script = await _get_user_script(script_id, user.id, db)
    # Load current version
    version = None
    if script.current_version_id:
        result = await db.execute(
            select(ScriptVersion).where(ScriptVersion.id == script.current_version_id)
        )
        version = result.scalar_one_or_none()

    data = _script_to_dict(script)
    if version:
        data["current_version"] = _version_to_dict(version)
    return DataResponse(data=data)


@router.patch("/{script_id}", response_model=DataResponse)
async def update_script(
    script_id: uuid.UUID,
    body: ScriptUpdateInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    script = await _get_user_script(script_id, user.id, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(script, field, value)

    if "youtube_video_id" in body.model_dump(exclude_unset=True):
        await _sync_script_short_link(script, body.youtube_video_id, user.id, db)

    await db.flush()
    return DataResponse(data=_script_to_dict(script))


@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_script(
    script_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    script = await _get_user_script(script_id, user.id, db)
    await db.delete(script)
    await db.flush()


@router.patch("/{script_id}/status", response_model=DataResponse)
async def update_script_status(
    script_id: uuid.UUID,
    body: ScriptStatusInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    script = await _get_user_script(script_id, user.id, db)
    script.status = body.status
    await db.flush()
    return DataResponse(data=_script_to_dict(script))


@router.post("/{script_id}/link-video", response_model=DataResponse)
async def link_video(
    script_id: uuid.UUID,
    body: ScriptLinkVideoInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    script = await _get_user_script(script_id, user.id, db)

    script.youtube_video_id = body.youtube_video_id
    await _sync_script_short_link(script, body.youtube_video_id, user.id, db)
    if script.status == ScriptStatus.APPROVED:
        script.status = ScriptStatus.PUBLISHED
    await db.flush()
    return DataResponse(data=_script_to_dict(script))


# ─── Versions ────────────────────────────────────────────────────────────

@router.post("/{script_id}/versions", response_model=DataResponse, status_code=status.HTTP_201_CREATED)
async def create_version(
    script_id: uuid.UUID,
    body: VersionCreateInput,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    script = await _get_user_script(script_id, user.id, db)

    # Get next version number
    result = await db.execute(
        select(func.max(ScriptVersion.version_number))
        .where(ScriptVersion.script_id == script.id)
    )
    max_version = result.scalar() or 0

    version = ScriptVersion(
        script_id=script.id,
        version_number=max_version + 1,
        hook=body.hook,
        narrative_structure=body.narrative_structure,
        cta=body.cta,
        lines=body.lines,
        analysis=body.analysis,
        generation_params=body.generation_params,
        change_summary=body.change_summary,
        created_by=body.created_by,
    )
    db.add(version)
    await db.flush()

    script.current_version_id = version.id
    await db.flush()

    return DataResponse(data=_version_to_dict(version))


@router.get("/{script_id}/versions", response_model=DataResponse)
async def list_versions(
    script_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_script(script_id, user.id, db)

    result = await db.execute(
        select(ScriptVersion)
        .where(ScriptVersion.script_id == script_id)
        .order_by(ScriptVersion.version_number.desc())
    )
    versions = result.scalars().all()
    return DataResponse(data=[_version_to_dict(v) for v in versions])


@router.get("/{script_id}/versions/{version_number}", response_model=DataResponse)
async def get_version(
    script_id: uuid.UUID,
    version_number: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_script(script_id, user.id, db)

    result = await db.execute(
        select(ScriptVersion)
        .where(ScriptVersion.script_id == script_id)
        .where(ScriptVersion.version_number == version_number)
    )
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return DataResponse(data=_version_to_dict(version))


@router.get("/{script_id}/compare", response_model=DataResponse)
async def compare_versions(
    script_id: uuid.UUID,
    v1: int = Query(...),
    v2: int = Query(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_user_script(script_id, user.id, db)

    result = await db.execute(
        select(ScriptVersion)
        .where(ScriptVersion.script_id == script_id)
        .where(ScriptVersion.version_number.in_([v1, v2]))
    )
    versions = {v.version_number: v for v in result.scalars().all()}

    if v1 not in versions or v2 not in versions:
        raise HTTPException(status_code=404, detail="One or both versions not found")

    return DataResponse(data={
        "version_1": _version_to_dict(versions[v1]),
        "version_2": _version_to_dict(versions[v2]),
    })


# ─── Helpers ──────────────────────────────���────────────────────��─────────

async def _get_user_script(script_id: uuid.UUID, user_id: uuid.UUID, db: AsyncSession) -> Script:
    result = await db.execute(
        select(Script).where(Script.id == script_id, Script.user_id == user_id)
    )
    script = result.scalar_one_or_none()
    if not script:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


async def _sync_script_short_link(
    script: Script,
    youtube_video_id: str | None,
    user_id: uuid.UUID,
    db: AsyncSession,
) -> None:
    if not youtube_video_id:
        old_link_result = await db.execute(
            select(YouTubeShort).where(
                YouTubeShort.user_id == user_id,
                YouTubeShort.script_id == script.id,
            )
        )
        for old_short in old_link_result.scalars().all():
            await unlink_short_from_script(short=old_short, user_id=user_id, db=db)
        return

    short_result = await db.execute(
        select(YouTubeShort).where(
            YouTubeShort.user_id == user_id,
            YouTubeShort.youtube_video_id == youtube_video_id,
        )
    )
    short = short_result.scalar_one_or_none()
    if not short:
        raise HTTPException(status_code=404, detail="YouTube Short not found")

    await link_short_to_script(short=short, script=script, user_id=user_id, db=db)


def _script_to_dict(script: Script) -> dict:
    return {
        "id": str(script.id),
        "user_id": str(script.user_id),
        "current_version_id": str(script.current_version_id) if script.current_version_id else None,
        "title": script.title,
        "theme": script.theme,
        "objective": script.objective,
        "niche": script.niche,
        "speaking_style": script.speaking_style,
        "estimated_duration_seconds": script.estimated_duration_seconds,
        "status": script.status.value,
        "youtube_video_id": script.youtube_video_id,
        "created_at": script.created_at.isoformat() if script.created_at else None,
        "updated_at": script.updated_at.isoformat() if script.updated_at else None,
    }


def _version_to_dict(version: ScriptVersion) -> dict:
    return {
        "id": str(version.id),
        "script_id": str(version.script_id),
        "version_number": version.version_number,
        "hook": version.hook,
        "narrative_structure": version.narrative_structure,
        "cta": version.cta,
        "lines": version.lines,
        "analysis": version.analysis,
        "generation_params": version.generation_params,
        "change_summary": version.change_summary,
        "created_by": version.created_by,
        "created_at": version.created_at.isoformat() if version.created_at else None,
    }
