import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.brand_settings import BrandSettings
from app.schemas.brand_settings import BrandSettingsOut, BrandSettingsUpdate

router = APIRouter(prefix="/brand-settings", tags=["Brand Settings"])

def _to_schema(b: BrandSettings) -> BrandSettingsOut:
    colors = []
    try:
        colors = json.loads(b.brand_colors or "[]")
    except Exception:
        colors = []

    return BrandSettingsOut(
        id=b.id,
        user_id=b.user_id,
        company_name=b.company_name or "",
        website=b.website or "",
        company_description=b.company_description or "",
        logo_url=b.logo_url or "",
        brand_colors=colors,
        industry=b.industry or "Technology",
        target_audience=b.target_audience or "",
        writing_tone=b.writing_tone or "Professional",
        preferred_language=b.preferred_language or "English",
        default_cta=b.default_cta or "",
        default_hashtags=b.default_hashtags or "",
        prohibited_phrases=b.prohibited_phrases or "",
        brand_guidelines=b.brand_guidelines or "",
        created_at=b.created_at,
        updated_at=b.updated_at
    )

@router.get("", response_model=BrandSettingsOut)
async def get_brand_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(BrandSettings).where(BrandSettings.user_id == current_user.id)
    )
    brand = res.scalar_one_or_none()
    if not brand:
        brand = BrandSettings(
            user_id=current_user.id,
            company_name=f"{current_user.name}'s Brand",
            industry="Technology",
            writing_tone="Professional",
            brand_colors="[\"#4f46e5\", \"#06b6d4\"]"
        )
        db.add(brand)
        await db.commit()
        await db.refresh(brand)

    return _to_schema(brand)

@router.put("", response_model=BrandSettingsOut)
async def update_brand_settings(
    payload: BrandSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(BrandSettings).where(BrandSettings.user_id == current_user.id)
    )
    brand = res.scalar_one_or_none()
    if not brand:
        brand = BrandSettings(user_id=current_user.id)
        db.add(brand)

    brand.company_name = payload.company_name
    brand.website = payload.website
    brand.company_description = payload.company_description
    brand.logo_url = payload.logo_url
    brand.brand_colors = json.dumps(payload.brand_colors)
    brand.industry = payload.industry
    brand.target_audience = payload.target_audience
    brand.writing_tone = payload.writing_tone
    brand.preferred_language = payload.preferred_language
    brand.default_cta = payload.default_cta
    brand.default_hashtags = payload.default_hashtags
    brand.prohibited_phrases = payload.prohibited_phrases
    brand.brand_guidelines = payload.brand_guidelines

    await db.commit()
    await db.refresh(brand)
    return _to_schema(brand)
