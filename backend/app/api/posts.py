import json
import uuid
import os
from datetime import timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.models.media import Media
from app.models.publishing_job import PublishingJob
from app.services.ai_service import AIService
from app.services.image_generator import generate_social_card
from app.config import settings
from app.schemas.ai import AIPostGenerateRequest
from app.schemas.post import (
    PostCreate,
    PostUpdate,
    PlatformPostUpdate,
    PostOut,
    PlatformPostOut,
    BulkScheduleRequest,
    BulkScheduleResponse,
    BulkTopicItem,
    PostGenerateImageRequest
)

router = APIRouter(prefix="/posts", tags=["Posts"])

def _build_post_out(post: Post) -> PostOut:
    p_posts_out = []
    for pp in post.platform_posts:
        tags = []
        mentions = []
        media = []
        try:
            tags = json.loads(pp.hashtags_json or "[]")
            mentions = json.loads(pp.mentions_json or "[]")
            media = json.loads(pp.media_ids_json or "[]")
        except Exception:
            pass

        p_posts_out.append(
            PlatformPostOut(
                id=pp.id,
                post_id=pp.post_id,
                social_account_id=pp.social_account_id,
                platform=pp.platform,
                caption=pp.caption,
                description=pp.description or "",
                hashtags=tags,
                mentions=mentions,
                media_ids=media,
                scheduled_at=pp.scheduled_at,
                published_at=pp.published_at,
                platform_post_id=pp.platform_post_id,
                status=pp.status,
                error_message=pp.error_message,
                attempt_count=pp.attempt_count,
                idempotency_key=pp.idempotency_key,
                created_at=pp.created_at,
                updated_at=pp.updated_at
            )
        )

    content = {}
    try:
        content = json.loads(post.content_json or "{}")
    except Exception:
        content = {}

    return PostOut(
        id=post.id,
        user_id=post.user_id,
        campaign_id=post.campaign_id,
        title=post.title,
        topic=post.topic,
        website_url=post.website_url or "",
        target_audience=post.target_audience or "",
        marketing_goal=post.marketing_goal or "",
        status=post.status,
        content_json=content,
        created_at=post.created_at,
        updated_at=post.updated_at,
        platform_posts=p_posts_out
    )

@router.post("", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def create_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    post = Post(
        user_id=current_user.id,
        campaign_id=payload.campaign_id,
        title=payload.title,
        topic=payload.topic,
        website_url=payload.website_url or "",
        target_audience=payload.target_audience or "",
        marketing_goal=payload.marketing_goal or "",
        content_json=json.dumps(payload.content_json),
        status="draft"
    )
    db.add(post)
    await db.flush()

    for p_in in payload.platform_posts:
        pp = PlatformPost(
            post_id=post.id,
            social_account_id=p_in.social_account_id,
            platform=p_in.platform.lower(),
            caption=p_in.caption,
            description=p_in.description or "",
            hashtags_json=json.dumps(p_in.hashtags),
            mentions_json=json.dumps(p_in.mentions),
            media_ids_json=json.dumps(p_in.media_ids),
            scheduled_at=p_in.scheduled_at,
            status="scheduled" if p_in.scheduled_at else "draft",
            idempotency_key=f"pp_{post.id}_{p_in.platform}_{uuid.uuid4().hex[:8]}"
        )
        db.add(pp)

    await db.commit()
    
    # Reload with relations
    res = await db.execute(
        select(Post).where(Post.id == post.id).options(selectinload(Post.platform_posts))
    )
    saved_post = res.scalar_one()
    return _build_post_out(saved_post)

@router.get("", response_model=List[PostOut])
async def list_posts(
    status_filter: Optional[str] = Query(None, alias="status"),
    campaign_id: Optional[int] = None,
    platform: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Post).where(Post.user_id == current_user.id).options(selectinload(Post.platform_posts)).order_by(desc(Post.created_at))

    if status_filter:
        query = query.where(Post.status == status_filter)
    if campaign_id:
        query = query.where(Post.campaign_id == campaign_id)

    res = await db.execute(query)
    posts = list(res.scalars().all())

    if platform:
        # Filter posts having this platform
        p_filtered = []
        for p in posts:
            if any(pp.platform == platform.lower() for pp in p.platform_posts):
                p_filtered.append(p)
        posts = p_filtered

    return [_build_post_out(p) for p in posts]

@router.get("/{post_id}", response_model=PostOut)
async def get_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Post).where(
            and_(Post.id == post_id, Post.user_id == current_user.id)
        ).options(selectinload(Post.platform_posts))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    return _build_post_out(post)

@router.put("/{post_id}", response_model=PostOut)
async def update_post(
    post_id: int,
    payload: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Post).where(
            and_(Post.id == post_id, Post.user_id == current_user.id)
        ).options(selectinload(Post.platform_posts))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    if payload.title is not None:
        post.title = payload.title
    if payload.topic is not None:
        post.topic = payload.topic
    if payload.website_url is not None:
        post.website_url = payload.website_url
    if payload.target_audience is not None:
        post.target_audience = payload.target_audience
    if payload.marketing_goal is not None:
        post.marketing_goal = payload.marketing_goal
    if payload.campaign_id is not None:
        post.campaign_id = payload.campaign_id
    if payload.status is not None:
        post.status = payload.status
    if payload.content_json is not None:
        post.content_json = json.dumps(payload.content_json)

    # If media_ids are provided globally for the post, propagate to all platform posts
    if payload.media_ids is not None:
        for pp in post.platform_posts:
            pp.media_ids_json = json.dumps(payload.media_ids)

    # If specific platform post updates are supplied
    if payload.platform_posts:
        for p_up in payload.platform_posts:
            for pp in post.platform_posts:
                if (p_up.id and pp.id == p_up.id) or (p_up.platform and pp.platform.lower() == p_up.platform.lower()):
                    if p_up.caption is not None:
                        pp.caption = p_up.caption
                    if p_up.description is not None:
                        pp.description = p_up.description
                    if p_up.hashtags is not None:
                        pp.hashtags_json = json.dumps(p_up.hashtags)
                    if p_up.mentions is not None:
                        pp.mentions_json = json.dumps(p_up.mentions)
                    if p_up.media_ids is not None:
                        pp.media_ids_json = json.dumps(p_up.media_ids)
                    if p_up.scheduled_at is not None:
                        pp.scheduled_at = p_up.scheduled_at
                    if p_up.status is not None:
                        pp.status = p_up.status

    await db.commit()
    res = await db.execute(
        select(Post).where(Post.id == post_id).options(selectinload(Post.platform_posts))
    )
    saved_post = res.scalar_one()
    return _build_post_out(saved_post)


@router.put("/platform-posts/{pp_id}", response_model=PlatformPostOut)
async def update_platform_post(
    pp_id: int,
    payload: PlatformPostUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(PlatformPost).join(Post).where(
            and_(PlatformPost.id == pp_id, Post.user_id == current_user.id)
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
    if payload.status is not None:
        pp.status = payload.status

    await db.commit()
    await db.refresh(pp)

    tags = []
    mentions = []
    media = []
    try:
        tags = json.loads(pp.hashtags_json or "[]")
        mentions = json.loads(pp.mentions_json or "[]")
        media = json.loads(pp.media_ids_json or "[]")
    except Exception:
        pass

    return PlatformPostOut(
        id=pp.id,
        post_id=pp.post_id,
        social_account_id=pp.social_account_id,
        platform=pp.platform,
        caption=pp.caption,
        description=pp.description or "",
        hashtags=tags,
        mentions=mentions,
        media_ids=media,
        scheduled_at=pp.scheduled_at,
        published_at=pp.published_at,
        platform_post_id=pp.platform_post_id,
        status=pp.status,
        error_message=pp.error_message,
        attempt_count=pp.attempt_count,
        idempotency_key=pp.idempotency_key,
        created_at=pp.created_at,
        updated_at=pp.updated_at
    )

@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(Post).where(and_(Post.id == post_id, Post.user_id == current_user.id))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    await db.delete(post)
    await db.commit()
    return None


@router.post("/bulk-schedule", response_model=BulkScheduleResponse, status_code=status.HTTP_201_CREATED)
async def bulk_schedule_posts(
    payload: BulkScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not payload.topics and not payload.items:
        raise HTTPException(status_code=400, detail="At least one topic or item must be provided.")

    created_posts = []

    work_items: List[BulkTopicItem] = []
    if payload.items:
        work_items = payload.items
    else:
        for t in payload.topics:
            t_clean = t.strip()
            if t_clean:
                work_items.append(BulkTopicItem(topic=t_clean))

    for i, item in enumerate(work_items):
        topic_clean = item.topic.strip()
        if not topic_clean:
            continue

        custom_heading = item.heading.strip() if item.heading else None
        custom_details = item.details if item.details else None
        custom_cta = item.call_to_action.strip() if item.call_to_action else payload.call_to_action

        post_scheduled_at = payload.start_date + timedelta(hours=i * payload.interval_hours)

        extra_inst = "Focus on saving 70% admin time, eliminating manual data entry, and smart scheduling."
        if custom_heading:
            extra_inst += f" Lead with this core headline hook: '{custom_heading}'."
        if custom_details:
            extra_inst += f" Highlight these key benefits: {'; '.join(custom_details)}."

        # 1. Generate full AI package for this topic
        ai_req = AIPostGenerateRequest(
            topic=topic_clean,
            company_name=payload.company_name or "InfiniteTech AI",
            company_description=payload.company_description or "AI automation for invoicing, data entry, scheduling, and follow-ups",
            product_service="AI Business Operations Suite",
            website_url=payload.website_url or "https://www.infinitetechai.com",
            target_audience="Business Owners & Operations",
            marketing_objective="Drive Inquiries & Leads",
            industry="Business Automation",
            tone=payload.tone or "Professional",
            language="English",
            content_type="Promotional & Educational",
            keywords=["Automation", "AI", "Efficiency", "Invoicing", "Scheduling"],
            call_to_action=custom_cta or "Visit www.infinitetechai.com to save 70% admin time!",
            additional_instructions=extra_inst,
            platforms=payload.platforms
        )
        ai_pkg = await AIService.generate_complete_package(ai_req)
        ai_package = ai_pkg.model_dump()

        post_title = custom_heading or ai_package.get("title") or topic_clean

        # 2. Create Post object
        post = Post(
            user_id=current_user.id,
            campaign_id=payload.campaign_id,
            title=post_title,
            topic=topic_clean,
            website_url=payload.website_url or "",
            target_audience="Business Owners & Teams",
            marketing_goal=payload.marketing_goal or "",
            content_json=json.dumps(ai_package),
            status="scheduled"
        )
        db.add(post)
        await db.flush()

        # Determine media for this post
        post_media_id = payload.media_id
        if payload.generate_ai_images:
            try:
                os.makedirs(settings.MEDIA_STORAGE_PATH, exist_ok=True)
                img_filename = f"flyer_topic_{i+1}_{uuid.uuid4().hex[:8]}.jpg"
                img_path = os.path.join(settings.MEDIA_STORAGE_PATH, img_filename)

                details_list = custom_details
                if not details_list and isinstance(ai_package.get("key_benefits"), list) and ai_package["key_benefits"]:
                    details_list = [str(b) for b in ai_package["key_benefits"][:2]]

                generate_social_card(
                    topic=custom_heading or topic_clean,
                    description=ai_package.get("description"),
                    details=details_list,
                    cta_text=custom_cta or ai_package.get("call_to_action") or "Book a Demo >",
                    company=payload.company_name or "InfiniteTech AI",
                    website=payload.website_url or "www.infinitetechai.com",
                    output_path=img_path,
                    palette_idx=i
                )

                media_record = Media(
                    user_id=current_user.id,
                    storage_key=img_filename,
                    original_filename=f"{topic_clean[:28].strip().replace(' ', '_')}.jpg",
                    mime_type="image/jpeg",
                    size_bytes=os.path.getsize(img_path) if os.path.exists(img_path) else 1024,
                    width=1080,
                    height=1080,
                    alt_text=f"AI Social Marketing Flyer (Style #{i%5 + 1}) for {topic_clean}"
                )
                db.add(media_record)
                await db.flush()
                post_media_id = media_record.id
            except Exception as e:
                print(f"Error generating social card: {e}")

        media_ids = [post_media_id] if post_media_id else []

        # 3. Create PlatformPost for each selected platform
        platform_posts_map = ai_package.get("platform_posts", {})
        for p_name in payload.platforms:
            p_data = platform_posts_map.get(p_name, {})
            caption = p_data.get("caption", f"{post_title} - {payload.call_to_action}")
            desc = p_data.get("description", "")
            hashtags = p_data.get("hashtags", ["#AIAutomation", "#BusinessGrowth"])
            mentions = p_data.get("mentions", [])

            pp = PlatformPost(
                post_id=post.id,
                platform=p_name.lower(),
                caption=caption,
                description=desc,
                hashtags_json=json.dumps(hashtags),
                mentions_json=json.dumps(mentions),
                media_ids_json=json.dumps(media_ids),
                scheduled_at=post_scheduled_at,
                status="scheduled",
                idempotency_key=f"pp_{post.id}_{p_name}_{uuid.uuid4().hex[:8]}"
            )
            db.add(pp)
            await db.flush()

            # Create persistent PublishingJob
            job = PublishingJob(
                platform_post_id=pp.id,
                scheduled_at=post_scheduled_at,
                status="pending",
                idempotency_key=f"job_{pp.id}_{post_scheduled_at.timestamp()}_{uuid.uuid4().hex[:6]}"
            )
            db.add(job)

        await db.commit()

        # Reload with relations
        res = await db.execute(
            select(Post).where(Post.id == post.id).options(selectinload(Post.platform_posts))
        )
        saved_post = res.scalar_one()
        created_posts.append(_build_post_out(saved_post))

    return BulkScheduleResponse(
        success=True,
        total_created=len(created_posts),
        message=f"Successfully generated and queued {len(created_posts)} posts for automated publishing!",
        posts=created_posts
    )


@router.post("/{post_id}/generate-image", response_model=PostOut)
async def generate_post_image_endpoint(
    post_id: int,
    payload: Optional[PostGenerateImageRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Regenerates or updates the marketing flyer image for a specific post with a chosen template or auto-rotation."""
    res = await db.execute(
        select(Post).where(and_(Post.id == post_id, Post.user_id == current_user.id)).options(selectinload(Post.platform_posts))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    headline = (payload.custom_headline if payload and payload.custom_headline else None) or post.title or post.topic
    cta_text = (payload.custom_cta if payload and payload.custom_cta else None) or "Book a Demo"
    template_id = payload.template_id if payload else None
    aspect_ratio = payload.aspect_ratio if payload and payload.aspect_ratio else "1:1"
    palette_id = payload.palette_id if payload else None
    details = payload.details if payload and payload.details else None
    engine_provider = payload.engine_provider if payload and payload.engine_provider else "procedural"
    ai_prompt = payload.ai_prompt if payload else None
    ai_style = payload.ai_style if payload and payload.ai_style else "3d_tech"

    # Parse content_json for description and benefits if not supplied
    post_desc = None
    try:
        pkg = json.loads(post.content_json or "{}")
        if "description" in pkg:
            post_desc = str(pkg["description"])
        if not details and "key_benefits" in pkg and isinstance(pkg["key_benefits"], list):
            details = [str(x) for x in pkg["key_benefits"][:4]]
    except Exception:
        pass

    try:
        os.makedirs(settings.MEDIA_STORAGE_PATH, exist_ok=True)
        img_filename = f"flyer_post_{post.id}_{uuid.uuid4().hex[:8]}.jpg"
        img_path = os.path.join(settings.MEDIA_STORAGE_PATH, img_filename)

        chosen_tpl = template_id if template_id else ((post.id % 20) + 1)
        generate_social_card(
            topic=headline,
            description=post_desc,
            details=details if details else None,
            cta_text=cta_text,
            company="InfiniteTech AI",
            website=post.website_url or "www.infinitetechai.com",
            output_path=img_path,
            palette_idx=chosen_tpl - 1,
            engine_provider=engine_provider,
            ai_prompt=ai_prompt,
            ai_style=ai_style
        )

        size_bytes = os.path.getsize(img_path) if os.path.exists(img_path) else 1024
        media_record = Media(
            user_id=current_user.id,
            storage_key=img_filename,
            original_filename=f"Flyer_{headline[:25].strip().replace(' ', '_')}.jpg",
            mime_type="image/jpeg",
            size_bytes=size_bytes,
            width=1080,
            height=1080,
            alt_text=f"AI Social Marketing Flyer for {headline}"
        )
        db.add(media_record)
        await db.flush()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")

    # Update all platform posts to attach this new media ID
    for pp in post.platform_posts:
        pp.media_ids_json = json.dumps([media_record.id])

    await db.commit()

    # Return refreshed post
    refresh_res = await db.execute(
        select(Post).where(Post.id == post.id).options(selectinload(Post.platform_posts))
    )
    return _build_post_out(refresh_res.scalar_one())


@router.post("/{post_id}/approve", response_model=PostOut)
async def approve_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Manually approves a post for scheduled auto-posting."""
    res = await db.execute(
        select(Post).where(and_(Post.id == post_id, Post.user_id == current_user.id)).options(selectinload(Post.platform_posts))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    post.status = "approved"
    for pp in post.platform_posts:
        if pp.status in ("draft", "needs_attention", "needs_review"):
            pp.status = "approved"

    await db.commit()
    return _build_post_out(post)


@router.post("/{post_id}/duplicate", response_model=PostOut, status_code=status.HTTP_201_CREATED)
async def duplicate_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Duplicates an existing post to allow quick re-publishing or variation testing."""
    res = await db.execute(
        select(Post).where(and_(Post.id == post_id, Post.user_id == current_user.id)).options(selectinload(Post.platform_posts))
    )
    post = res.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    cloned_post = Post(
        user_id=current_user.id,
        campaign_id=post.campaign_id,
        title=f"{post.title} (Copy)",
        topic=post.topic,
        website_url=post.website_url,
        target_audience=post.target_audience,
        marketing_goal=post.marketing_goal,
        content_json=post.content_json,
        status="draft"
    )
    db.add(cloned_post)
    await db.flush()

    for pp in post.platform_posts:
        cloned_pp = PlatformPost(
            post_id=cloned_post.id,
            social_account_id=pp.social_account_id,
            platform=pp.platform,
            caption=pp.caption,
            description=pp.description,
            hashtags_json=pp.hashtags_json,
            mentions_json=pp.mentions_json,
            media_ids_json=pp.media_ids_json,
            status="draft",
            idempotency_key=f"pp_clone_{cloned_post.id}_{pp.platform}_{uuid.uuid4().hex[:8]}"
        )
        db.add(cloned_pp)

    await db.commit()

    ref_res = await db.execute(
        select(Post).where(Post.id == cloned_post.id).options(selectinload(Post.platform_posts))
    )
    return _build_post_out(ref_res.scalar_one())

