import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.campaign import Campaign
from app.models.post import Post
from app.schemas.campaign import CampaignCreate, CampaignUpdate, CampaignOut
from app.schemas.ai import AIPostGenerateRequest
from app.services.ai_service import AIService

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])

@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CampaignCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    campaign = Campaign(
        user_id=current_user.id,
        name=payload.name,
        objective=payload.objective,
        target_audience=payload.target_audience or "",
        start_date=payload.start_date,
        end_date=payload.end_date,
        settings_json=json.dumps(payload.settings_json)
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)

    return CampaignOut(
        id=campaign.id,
        user_id=campaign.user_id,
        name=campaign.name,
        objective=campaign.objective,
        target_audience=campaign.target_audience,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        settings_json=payload.settings_json,
        created_at=campaign.created_at,
        updated_at=campaign.updated_at,
        posts_count=0
    )

@router.get("", response_model=List[CampaignOut])
async def list_campaigns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Campaign).where(Campaign.user_id == current_user.id).order_by(desc(Campaign.created_at)).options(selectinload(Campaign.posts))
    )
    items = list(res.scalars().all())
    results = []
    for c in items:
        settings = {}
        try:
            settings = json.loads(c.settings_json or "{}")
        except Exception:
            pass

        results.append(
            CampaignOut(
                id=c.id,
                user_id=c.user_id,
                name=c.name,
                objective=c.objective,
                target_audience=c.target_audience,
                start_date=c.start_date,
                end_date=c.end_date,
                settings_json=settings,
                created_at=c.created_at,
                updated_at=c.updated_at,
                posts_count=len(c.posts)
            )
        )
    return results

@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Campaign).where(
            and_(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        ).options(selectinload(Campaign.posts))
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    settings = {}
    try:
        settings = json.loads(c.settings_json or "{}")
    except Exception:
        pass

    return CampaignOut(
        id=c.id,
        user_id=c.user_id,
        name=c.name,
        objective=c.objective,
        target_audience=c.target_audience,
        start_date=c.start_date,
        end_date=c.end_date,
        settings_json=settings,
        created_at=c.created_at,
        updated_at=c.updated_at,
        posts_count=len(c.posts)
    )

@router.put("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: int,
    payload: CampaignUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Campaign).where(
            and_(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        ).options(selectinload(Campaign.posts))
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    if payload.name is not None:
        c.name = payload.name
    if payload.objective is not None:
        c.objective = payload.objective
    if payload.target_audience is not None:
        c.target_audience = payload.target_audience
    if payload.start_date is not None:
        c.start_date = payload.start_date
    if payload.end_date is not None:
        c.end_date = payload.end_date
    if payload.settings_json is not None:
        c.settings_json = json.dumps(payload.settings_json)

    await db.commit()
    await db.refresh(c)

    settings = {}
    try:
        settings = json.loads(c.settings_json or "{}")
    except Exception:
        pass

    return CampaignOut(
        id=c.id,
        user_id=c.user_id,
        name=c.name,
        objective=c.objective,
        target_audience=c.target_audience,
        start_date=c.start_date,
        end_date=c.end_date,
        settings_json=settings,
        created_at=c.created_at,
        updated_at=c.updated_at,
        posts_count=len(c.posts)
    )

@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(
    campaign_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Campaign).where(and_(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    await db.delete(c)
    await db.commit()
    return None

@router.post("/{campaign_id}/generate-batch")
async def generate_campaign_post_batch(
    campaign_id: int,
    count: int = 3,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate multiple proposed posts for a campaign requiring approval before scheduling."""
    res = await db.execute(
        select(Campaign).where(and_(Campaign.id == campaign_id, Campaign.user_id == current_user.id))
    )
    c = res.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Campaign not found.")

    proposed_posts = []
    themes = [
        f"Key Announcement: Scaling with {c.name}",
        f"Deep Dive: How {c.name} solves core pain points",
        f"Case Study & Proof: Real outcomes using {c.name}"
    ]

    for i in range(min(count, 3)):
        req = AIPostGenerateRequest(
            topic=themes[i],
            company_name=c.name,
            target_audience=c.target_audience or "Customers",
            marketing_objective=c.objective,
            platforms=["facebook", "instagram", "linkedin", "twitter"]
        )
        pack = await AIService.generate_complete_package(req)
        proposed_posts.append({
            "proposal_index": i + 1,
            "theme": themes[i],
            "campaign_id": c.id,
            "content_package": pack.model_dump()
        })

    return {
        "campaign_id": c.id,
        "campaign_name": c.name,
        "proposed_count": len(proposed_posts),
        "proposed_posts": proposed_posts,
        "notice": "All proposed posts are presented for user review. Approval is required to save or schedule."
    }
