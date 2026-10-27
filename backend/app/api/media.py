import os
import uuid
import io
from typing import List
from PIL import Image
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.media import Media
from app.schemas.media import MediaOut, MediaUpdate, FlyerGenerateRequest
from app.services.image_engine import (
    image_engine,
    TEMPLATE_FAMILIES,
    COLOR_PALETTES,
    ASPECT_RATIOS
)
from app.config import settings

router = APIRouter(prefix="/media", tags=["Media"])

ALLOWED_IMAGE_MIMES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_MIMES = {"video/mp4", "video/quicktime"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

def _ensure_storage_dir():
    os.makedirs(settings.MEDIA_STORAGE_PATH, exist_ok=True)

@router.post("/upload", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def upload_media(
    file: UploadFile = File(...),
    alt_text: str = Form(""),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    _ensure_storage_dir()
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (25MB).")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".png"
    unique_key = f"{uuid.uuid4().hex}{ext}"
    target_path = os.path.join(settings.MEDIA_STORAGE_PATH, unique_key)

    with open(target_path, "wb") as f:
        f.write(content)

    width = None
    height = None
    mime = file.content_type or "image/png"
    if mime.startswith("image/"):
        try:
            with Image.open(io.BytesIO(content)) as pil_img:
                width, height = pil_img.size
        except Exception:
            pass

    media = Media(
        user_id=current_user.id,
        storage_key=unique_key,
        original_filename=file.filename or unique_key,
        mime_type=mime,
        size_bytes=len(content),
        width=width,
        height=height,
        alt_text=alt_text or ""
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)

    return MediaOut(
        id=media.id,
        user_id=media.user_id,
        storage_key=media.storage_key,
        original_filename=media.original_filename,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width,
        height=media.height,
        duration_seconds=media.duration_seconds,
        alt_text=media.alt_text,
        created_at=media.created_at,
        url=f"/storage/media/{media.storage_key}"
    )

@router.get("/templates")
async def get_flyer_templates():
    """Returns the 20 available design families, color themes, and supported aspect ratios."""
    return {
        "templates": TEMPLATE_FAMILIES,
        "palettes": COLOR_PALETTES,
        "aspect_ratios": [
            {"id": "1:1", "name": "Instagram / Square (1:1)", "dimensions": "1080 × 1080"},
            {"id": "4:5", "name": "Instagram Portrait (4:5)", "dimensions": "1080 × 1350"},
            {"id": "16:9", "name": "X / LinkedIn Landscape (16:9)", "dimensions": "1200 × 675"},
            {"id": "9:16", "name": "Instagram / TikTok Story (9:16)", "dimensions": "1080 × 1920"},
        ]
    }

@router.get("/ai-status")
async def get_media_ai_status():
    """Returns connectivity, active models, and latency metrics for Free AI Pollinations.ai."""
    from app.services.image_engine.pollinations_service import PollinationsService
    return PollinationsService.check_health()

@router.post("/generate-flyer", response_model=MediaOut, status_code=status.HTTP_201_CREATED)
async def generate_flyer_endpoint(
    payload: FlyerGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    _ensure_storage_dir()
    try:
        gen_res = image_engine.generate_image(
            title=payload.topic,
            description=payload.description,
            benefits=payload.details,
            cta=payload.cta_text,
            company=payload.company or "InfiniteTech AI",
            website=payload.website or "www.infinitetechai.com",
            phone=payload.phone or "+91-9884777171",
            template_id=payload.template_id,
            aspect_ratio=payload.aspect_ratio or "1:1",
            palette_id=payload.palette_id,
            output_dir=settings.MEDIA_STORAGE_PATH,
            engine_provider=payload.engine_provider or "procedural",
            ai_prompt=payload.ai_prompt,
            ai_style=payload.ai_style or "3d_tech"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flyer: {str(e)}")

    target_path = gen_res["file_path"]
    unique_filename = gen_res["filename"]
    size_bytes = os.path.getsize(target_path) if os.path.exists(target_path) else 1024
    clean_title = payload.topic[:28].strip().replace(" ", "_").replace(":", "")

    media = Media(
        user_id=current_user.id,
        storage_key=unique_filename,
        original_filename=f"Flyer_{clean_title}.png",
        mime_type="image/png",
        size_bytes=size_bytes,
        width=gen_res.get("width", 1080),
        height=gen_res.get("height", 1080),
        alt_text=f"AI Marketing flyer ({gen_res.get('template_name')}) for {payload.topic}"
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)

    return MediaOut(
        id=media.id,
        user_id=media.user_id,
        storage_key=media.storage_key,
        original_filename=media.original_filename,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width,
        height=media.height,
        duration_seconds=media.duration_seconds,
        alt_text=media.alt_text,
        created_at=media.created_at,
        url=f"/storage/media/{media.storage_key}"
    )

@router.get("", response_model=List[MediaOut])
async def list_media(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Media).where(Media.user_id == current_user.id).order_by(desc(Media.created_at))
    )
    items = list(res.scalars().all())
    results = []
    for m in items:
        results.append(
            MediaOut(
                id=m.id,
                user_id=m.user_id,
                storage_key=m.storage_key,
                original_filename=m.original_filename,
                mime_type=m.mime_type,
                size_bytes=m.size_bytes,
                width=m.width,
                height=m.height,
                duration_seconds=m.duration_seconds,
                alt_text=m.alt_text,
                created_at=m.created_at,
                url=f"/storage/media/{m.storage_key}"
            )
        )
    return results

@router.get("/{media_id}", response_model=MediaOut)
async def get_single_media(
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Media).where(and_(Media.id == media_id, Media.user_id == current_user.id))
    )
    media = res.scalar_one_or_none()
    if not media:
        # Fallback without user_id restriction if referenced by user's posts
        res = await db.execute(select(Media).where(Media.id == media_id))
        media = res.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found.")
    return MediaOut(
        id=media.id,
        user_id=media.user_id,
        storage_key=media.storage_key,
        original_filename=media.original_filename,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width,
        height=media.height,
        duration_seconds=media.duration_seconds,
        alt_text=media.alt_text,
        created_at=media.created_at,
        url=f"/storage/media/{media.storage_key}"
    )

@router.put("/{media_id}", response_model=MediaOut)
async def update_media(
    media_id: int,
    payload: MediaUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Media).where(and_(Media.id == media_id, Media.user_id == current_user.id))
    )
    media = res.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found.")

    if payload.alt_text is not None:
        media.alt_text = payload.alt_text

    await db.commit()
    await db.refresh(media)
    return MediaOut(
        id=media.id,
        user_id=media.user_id,
        storage_key=media.storage_key,
        original_filename=media.original_filename,
        mime_type=media.mime_type,
        size_bytes=media.size_bytes,
        width=media.width,
        height=media.height,
        duration_seconds=media.duration_seconds,
        alt_text=media.alt_text,
        created_at=media.created_at,
        url=f"/storage/media/{media.storage_key}"
    )

@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media(
    media_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Media).where(and_(Media.id == media_id, Media.user_id == current_user.id))
    )
    media = res.scalar_one_or_none()
    if not media:
        raise HTTPException(status_code=404, detail="Media not found.")

    # Remove file from disk safely
    file_path = os.path.join(settings.MEDIA_STORAGE_PATH, media.storage_key)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    await db.delete(media)
    await db.commit()
    return None
