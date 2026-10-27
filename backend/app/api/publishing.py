import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.models.publishing_job import PublishingJob
from app.schemas.post import PublishNowRequest, SchedulePostRequest, PlatformPostUpdate, PlatformPostOut
from app.services.publisher_service import PublisherService

router = APIRouter(tags=["Publishing & Scheduling"])

@router.post("/posts/{post_id}/publish")
async def publish_post_now(
    post_id: int,
    payload: Optional[PublishNowRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Post).where(and_(Post.id == post_id, Post.user_id == current_user.id))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    target_ids = payload.platform_post_ids if payload else None
    result = await PublisherService.publish_entire_post(db, post, target_platform_post_ids=target_ids)
    return result

@router.post("/posts/{post_id}/schedule")
async def schedule_post(
    post_id: int,
    payload: SchedulePostRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Post).where(and_(Post.id == post_id, Post.user_id == current_user.id)).options(selectinload(Post.platform_posts))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    scheduled_utc = payload.scheduled_at
    if scheduled_utc.tzinfo is None:
        scheduled_utc = scheduled_utc.replace(tzinfo=timezone.utc)
    else:
        scheduled_utc = scheduled_utc.astimezone(timezone.utc)

    # Validate schedule time is in future
    if scheduled_utc <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Scheduled time must be in the future.")

    target_pps = post.platform_posts
    if payload.platform_post_ids:
        target_pps = [p for p in target_pps if p.id in payload.platform_post_ids]

    for pp in target_pps:
        pp.scheduled_at = scheduled_utc
        pp.status = "scheduled"

        # Persist a publishing job record for idempotency and audit
        job = PublishingJob(
            platform_post_id=pp.id,
            scheduled_at=scheduled_utc,
            status="pending",
            idempotency_key=f"job_{pp.id}_{scheduled_utc.timestamp()}_{uuid.uuid4().hex[:6]}"
        )
        db.add(job)

    post.status = "scheduled"
    await db.commit()
    await db.refresh(post)

    return {
        "status": "scheduled",
        "post_id": post.id,
        "scheduled_at_utc": scheduled_utc.isoformat(),
        "timezone": payload.timezone_name,
        "scheduled_platforms": [p.platform for p in target_pps]
    }

@router.post("/platform-posts/{platform_post_id}/retry")
async def retry_platform_post(
    platform_post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(PlatformPost).join(Post).where(
            and_(PlatformPost.id == platform_post_id, Post.user_id == current_user.id)
        ).options(selectinload(PlatformPost.post))
    )
    pp = res.scalar_one_or_none()
    if not pp:
        raise HTTPException(status_code=404, detail="Platform post not found.")

    result = await PublisherService.publish_platform_post(db, pp, is_retry=True)
    return result

@router.post("/platform-posts/{platform_post_id}/cancel")
async def cancel_platform_post(
    platform_post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(PlatformPost).join(Post).where(
            and_(PlatformPost.id == platform_post_id, Post.user_id == current_user.id)
        ).options(selectinload(PlatformPost.post))
    )
    pp = res.scalar_one_or_none()
    if not pp:
        raise HTTPException(status_code=404, detail="Platform post not found.")

    pp.status = "cancelled"
    await db.commit()
    return {"message": "Scheduled post cancelled successfully.", "platform_post_id": pp.id}

@router.get("/platform-posts/{platform_post_id}/status")
async def get_platform_post_status(
    platform_post_id: int,
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
        raise HTTPException(status_code=404, detail="Platform post not found.")

    return {
        "id": pp.id,
        "platform": pp.platform,
        "status": pp.status,
        "platform_post_id": pp.platform_post_id,
        "error_message": pp.error_message,
        "attempt_count": pp.attempt_count,
        "scheduled_at": pp.scheduled_at,
        "published_at": pp.published_at
    }

@router.put("/platform-posts/{platform_post_id}")
async def update_platform_post(
    platform_post_id: int,
    payload: PlatformPostUpdate,
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
        raise HTTPException(status_code=404, detail="Platform post not found.")

    if payload.caption is not None:
        pp.caption = payload.caption
    if payload.description is not None:
        pp.description = payload.description
    if payload.hashtags is not None:
        pp.hashtags_json = json.dumps(payload.hashtags)
    if payload.mentions is not None:
        pp.mentions_json = json.dumps(payload.mentions)
    if payload.media_ids is not None:
        pp.media_ids_json = json.dumps(payload.media_ids)
    if payload.scheduled_at is not None:
        pp.scheduled_at = payload.scheduled_at
    if payload.social_account_id is not None:
        pp.social_account_id = payload.social_account_id
    if payload.status is not None:
        pp.status = payload.status

    await db.commit()
    await db.refresh(pp)
    return {"message": "Platform post updated successfully.", "id": pp.id}
