"""
[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/styles
Resposta 200: { data: [StyleProfileOut] }

[ENDPOINT DOCUMENTADO]
Método: GET
Rota: /api/styles/:id
Resposta 200: { data: StyleProfileOut }
Resposta 404: { error: { code: "NOT_FOUND", message: "..." } }

[ENDPOINT DOCUMENTADO]
Método: POST
Rota: /api/styles/generate
Body: { video_ids: [uuid], name: str }
Resposta 202: { data: { task_id: str } }
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models import StyleProfile, StyleVideo
from app.schemas.common import DataResponse
from app.schemas.style import StyleGenerateInput, StyleProfileOut, StyleUpdateInput
from app.tasks.style_tasks import generate_style_profile, regenerate_style_profile

router = APIRouter()


def _profile_to_out(profile: StyleProfile) -> StyleProfileOut:
    data = StyleProfileOut.model_validate(profile)
    data.video_ids = [v.id for v in profile.videos]
    return data


@router.get("", response_model=DataResponse)
async def list_styles(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(StyleProfile).order_by(StyleProfile.created_at.desc())
    )
    profiles = result.scalars().all()
    return DataResponse(data=[_profile_to_out(p) for p in profiles])


@router.get("/{style_id}", response_model=DataResponse)
async def get_style(style_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    profile = await db.get(StyleProfile, style_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Perfil de estilo não encontrado"},
        )
    return DataResponse(data=_profile_to_out(profile))


@router.patch("/{style_id}", response_model=DataResponse)
async def update_style(
    style_id: uuid.UUID,
    body: StyleUpdateInput,
    db: AsyncSession = Depends(get_db),
):
    profile = await db.get(StyleProfile, style_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Perfil de estilo não encontrado"},
        )

    if body.name is not None:
        profile.name = body.name

    if body.remove_video_ids:
        await db.execute(
            delete(StyleVideo).where(
                StyleVideo.style_profile_id == style_id,
                StyleVideo.video_id.in_(body.remove_video_ids),
            )
        )

    if body.add_video_ids:
        existing = await db.execute(
            select(StyleVideo.video_id).where(
                StyleVideo.style_profile_id == style_id
            )
        )
        existing_ids = {row[0] for row in existing.all()}
        for vid in body.add_video_ids:
            if vid not in existing_ids:
                db.add(StyleVideo(style_profile_id=style_id, video_id=vid))

    await db.commit()
    await db.refresh(profile)

    # Se vídeos mudaram, regenerar o perfil de estilo com os novos dados
    videos_changed = bool(body.add_video_ids or body.remove_video_ids)
    task_id = None
    if videos_changed:
        task = regenerate_style_profile.delay(str(style_id))
        task_id = task.id

    out = _profile_to_out(profile)
    response = {"profile": out.model_dump(mode="json")}
    if task_id:
        response["regeneration_task_id"] = task_id
    return DataResponse(data=response)


@router.delete("/{style_id}", status_code=200, response_model=DataResponse)
async def delete_style(style_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    profile = await db.get(StyleProfile, style_id)
    if not profile:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Perfil de estilo não encontrado"},
        )

    await db.delete(profile)
    await db.commit()
    return DataResponse(data={"deleted": True, "style_id": str(style_id)})


@router.post("/generate", status_code=202, response_model=DataResponse)
async def generate_style(body: StyleGenerateInput):
    task = generate_style_profile.delay(
        [str(vid) for vid in body.video_ids],
        body.name,
    )
    return DataResponse(data={"task_id": task.id})
