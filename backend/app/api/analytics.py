from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.models.social_account import SocialAccount
from app.schemas.analytics import AnalyticsOverview, PlatformAnalytics
from app.config import settings

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=AnalyticsOverview)
async def get_analytics_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Query platform post counts grouped by platform and status
    q = (
        select(PlatformPost.platform, PlatformPost.status, func.count(PlatformPost.id))
        .join(Post)
        .where(Post.user_id == current_user.id)
        .group_by(PlatformPost.platform, PlatformPost.status)
    )
    res = await db.execute(q)
    rows = res.all()

    platform_breakdown: Dict[str, int] = {"facebook": 0, "instagram": 0, "linkedin": 0, "twitter": 0}
    total_published = 0
    total_scheduled = 0
    total_failed = 0

    for platform, status_val, count in rows:
        p_key = "twitter" if platform in ("twitter", "x") else platform
        if status_val == "published":
            platform_breakdown[p_key] = platform_breakdown.get(p_key, 0) + count
            total_published += count
        elif status_val in ("scheduled", "pending", "queued"):
            total_scheduled += count
        elif status_val == "failed":
            total_failed += count

    # Check connected accounts
    acc_res = await db.execute(
        select(SocialAccount).where(
            SocialAccount.user_id == current_user.id,
            SocialAccount.connection_status == "connected"
        )
    )
    connected_platforms = {a.platform for a in acc_res.scalars().all()}

    is_real = settings.APP_MODE == "real"
    notice = (
        "Operating in REAL MODE with official platform metrics."
        if is_real else
        "DEVELOPMENT MODE: Publishing is currently simulated. Platform engagement analytics are marked as development simulations."
    )

    platforms_list: List[PlatformAnalytics] = []
    for p in ["facebook", "instagram", "linkedin", "twitter"]:
        has_conn = p in connected_platforms or ("x" in connected_platforms and p == "twitter")
        pub_count = platform_breakdown.get(p, 0)

        # In mock mode, we show real count of published posts in DB, but follower counts and engagements are marked as simulated or None
        followers = 1250 if (has_conn and not is_real) else None
        engagements = (pub_count * 42) if (pub_count > 0 and not is_real) else None
        reach = (pub_count * 310) if (pub_count > 0 and not is_real) else None

        disclaimer = "Simulated development metric." if not is_real else "Live API telemetry."

        platforms_list.append(
            PlatformAnalytics(
                platform=p,
                connected=has_conn,
                is_real_data=is_real,
                followers_count=followers,
                posts_published_count=pub_count,
                total_engagements=engagements,
                estimated_reach=reach,
                disclaimer=disclaimer
            )
        )

    return AnalyticsOverview(
        app_mode=settings.APP_MODE,
        is_real_data=is_real,
        data_source_notice=notice,
        total_published=total_published,
        total_scheduled=total_scheduled,
        total_failed=total_failed,
        platform_breakdown=platform_breakdown,
        platforms=platforms_list
    )

@router.get("/platforms", response_model=List[PlatformAnalytics])
async def get_platform_analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    overview = await get_analytics_overview(current_user=current_user, db=db)
    return overview.platforms
