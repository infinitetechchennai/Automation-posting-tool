from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.models.social_account import SocialAccount
from app.schemas.analytics import DashboardStats, RecentActivityItem
from app.config import settings

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Total posts created by user
    total_res = await db.execute(select(func.count(Post.id)).where(Post.user_id == current_user.id))
    total_posts = total_res.scalar_one() or 0

    # Query platform posts counts
    pp_query = select(PlatformPost.status, func.count(PlatformPost.id)).join(Post).where(Post.user_id == current_user.id).group_by(PlatformPost.status)
    pp_res = await db.execute(pp_query)
    status_counts = dict(pp_res.all())

    published_count = status_counts.get("published", 0)
    scheduled_count = status_counts.get("scheduled", 0) + status_counts.get("pending", 0) + status_counts.get("queued", 0)
    failed_count = status_counts.get("failed", 0)
    draft_count = status_counts.get("draft", 0)

    # Connected social accounts
    acc_res = await db.execute(
        select(func.count(SocialAccount.id)).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.connection_status == "connected"
        )
    )
    connected_accounts = acc_res.scalar_one() or 0

    return DashboardStats(
        total_posts=total_posts,
        published_posts=published_count,
        scheduled_posts=scheduled_count,
        draft_posts=draft_count,
        failed_posts=failed_count,
        connected_accounts=connected_accounts,
        app_mode=settings.APP_MODE
    )

@router.get("/activity", response_model=List[RecentActivityItem])
async def get_recent_activity(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = (
        select(PlatformPost)
        .join(Post)
        .where(Post.user_id == current_user.id)
        .options(selectinload(PlatformPost.post), selectinload(PlatformPost.social_account))
        .order_by(desc(PlatformPost.updated_at))
        .limit(limit)
    )
    res = await db.execute(query)
    items = list(res.scalars().all())

    activity = []
    for pp in items:
        activity.append(
            RecentActivityItem(
                id=pp.id,
                post_id=pp.post_id,
                title=pp.post.title if pp.post else "Post",
                platform=pp.platform,
                account_name=pp.social_account.account_name if pp.social_account else f"{pp.platform.capitalize()} Channel",
                scheduled_at=pp.scheduled_at,
                published_at=pp.published_at,
                status=pp.status,
                error_message=pp.error_message
            )
        )
    return activity
