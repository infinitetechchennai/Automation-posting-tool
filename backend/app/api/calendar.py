import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.schemas.calendar import CalendarItem, RescheduleRequest

router = APIRouter(prefix="/calendar", tags=["Content Calendar"])

@router.get("", response_model=List[CalendarItem])
async def get_calendar_events(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    platform: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    campaign_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(PlatformPost)
        .join(Post)
        .where(Post.user_id == current_user.id)
        .options(selectinload(PlatformPost.post).selectinload(Post.campaign), selectinload(PlatformPost.social_account))
    )

    if platform:
        query = query.where(PlatformPost.platform == platform.lower())
    if status_filter:
        query = query.where(PlatformPost.status == status_filter)
    if campaign_id:
        query = query.where(Post.campaign_id == campaign_id)

    res = await db.execute(query)
    platform_posts = list(res.scalars().all())

    items = []
    for pp in platform_posts:
        # Determine relevant timestamp (either scheduled_at or published_at or created_at)
        target_time = pp.scheduled_at or pp.published_at or pp.created_at
        if start_date and target_time and target_time < start_date:
            continue
        if end_date and target_time and target_time > end_date:
            continue

        media = []
        try:
            media = json.loads(pp.media_ids_json or "[]")
        except Exception:
            pass

        items.append(
            CalendarItem(
                id=pp.id,
                post_id=pp.post_id,
                title=pp.post.title if pp.post else "Post",
                platform=pp.platform,
                caption=pp.caption,
                scheduled_at=pp.scheduled_at,
                published_at=pp.published_at,
                status=pp.status,
                account_name=pp.social_account.account_name if pp.social_account else "Default Account",
                campaign_name=pp.post.campaign.name if (pp.post and pp.post.campaign) else None,
                media_ids=media
            )
        )

    return items

@router.put("/{platform_post_id}/reschedule")
async def reschedule_event(
    platform_post_id: int,
    payload: RescheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(PlatformPost).join(Post).where(
            and_(PlatformPost.id == platform_post_id, Post.user_id == current_user.id)
        )
    )
    pp = res.scalar_one_or_none()
    if not pp:
        raise HTTPException(status_code=404, detail="Scheduled post not found.")

    new_time = payload.scheduled_at
    if new_time.tzinfo is None:
        new_time = new_time.replace(tzinfo=timezone.utc)
    else:
        new_time = new_time.astimezone(timezone.utc)

    if new_time <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="New scheduled time must be in the future.")

    pp.scheduled_at = new_time
    pp.status = "scheduled"
    await db.commit()
    await db.refresh(pp)

    return {
        "status": "rescheduled",
        "platform_post_id": pp.id,
        "new_scheduled_at_utc": new_time.isoformat(),
        "timezone": payload.timezone_name
    }
