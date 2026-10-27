import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.models.social_account import SocialAccount
from app.models.media import Media
from app.models.publishing_job import PublishingJob
from app.models.audit_log import AuditLog
from app.adapters import get_adapter

logger = logging.getLogger(__name__)


class PublisherService:
    @classmethod
    async def publish_platform_post(
        cls,
        db: AsyncSession,
        platform_post: PlatformPost,
        is_retry: bool = False
    ) -> Dict[str, Any]:
        """Publish a single platform post with duplicate prevention and audit logging."""
        # 1. Duplicate check: if already published, avoid duplicate request
        if platform_post.status == "published" and platform_post.platform_post_id:
            logger.warning(f"PlatformPost {platform_post.id} is already published ({platform_post.platform_post_id}). Skipping to prevent duplicate.")
            return {
                "success": True,
                "platform_post_id": platform_post.platform_post_id,
                "status": "published",
                "message": "Already published previously; duplicate prevented."
            }

        # 2. Increment attempt count
        platform_post.attempt_count += 1
        platform_post.status = "processing"
        await db.commit()

        # 3. Load connected account
        account = None
        if platform_post.social_account_id:
            acc_res = await db.execute(select(SocialAccount).where(SocialAccount.id == platform_post.social_account_id))
            account = acc_res.scalar_one_or_none()

        # 4. Load attached media items
        media_items: List[Media] = []
        try:
            m_ids = json.loads(platform_post.media_ids_json or "[]")
            if m_ids:
                m_res = await db.execute(select(Media).where(Media.id.in_(m_ids)))
                media_items = list(m_res.scalars().all())
        except Exception as e:
            logger.error(f"Error parsing media ids for post {platform_post.id}: {e}")

        # 5. Acquire platform adapter
        adapter = get_adapter(platform_post.platform)

        # 6. Attempt publication
        result = await adapter.publish(account=account, post=platform_post, media=media_items)

        # 7. Update status and save results
        if result.get("success"):
            platform_post.status = "published"
            platform_post.platform_post_id = result.get("platform_post_id")
            platform_post.published_at = datetime.now(timezone.utc)
            platform_post.error_message = None
        else:
            platform_post.status = "failed"
            platform_post.error_message = result.get("error_message") or "Unknown publishing error"

        # 8. Record audit log
        audit = AuditLog(
            user_id=platform_post.post.user_id if platform_post.post else account.user_id if account else 1,
            action="publish_retry" if is_retry else "publish_attempt",
            resource_type="platform_post",
            resource_id=str(platform_post.id),
            metadata_json=json.dumps({
                "platform": platform_post.platform,
                "status": platform_post.status,
                "attempt": platform_post.attempt_count,
                "platform_post_id": platform_post.platform_post_id,
                "is_simulated": result.get("is_simulated", True),
                "error": platform_post.error_message
            })
        )
        db.add(audit)

        # 9. Check and update parent Post status
        await cls._update_parent_post_status(db, platform_post.post_id)

        await db.commit()
        await db.refresh(platform_post)

        return {
            "success": result.get("success", False),
            "platform_post_id": platform_post.platform_post_id,
            "status": platform_post.status,
            "error_message": platform_post.error_message,
            "is_simulated": result.get("is_simulated", True)
        }

    @classmethod
    async def publish_entire_post(
        cls,
        db: AsyncSession,
        post: Post,
        target_platform_post_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """
        Publish post across platforms independently.
        One platform's failure must not cancel other platforms.
        """
        post.status = "publishing"
        await db.commit()

        # Load platform posts
        pp_res = await db.execute(
            select(PlatformPost).where(PlatformPost.post_id == post.id)
        )
        all_pp = list(pp_res.scalars().all())

        if target_platform_post_ids:
            target_posts = [p for p in all_pp if p.id in target_platform_post_ids]
        else:
            target_posts = all_pp

        results = {}
        for pp in target_posts:
            # Publish independently
            res = await cls.publish_platform_post(db, pp)
            results[pp.platform] = res

        await cls._update_parent_post_status(db, post.id)
        await db.commit()
        await db.refresh(post)

        return {
            "post_id": post.id,
            "overall_status": post.status,
            "platform_results": results
        }

    @staticmethod
    async def _update_parent_post_status(db: AsyncSession, post_id: int):
        post_res = await db.execute(select(Post).where(Post.id == post_id))
        post = post_res.scalar_one_or_none()
        if not post:
            return

        pp_res = await db.execute(select(PlatformPost).where(PlatformPost.post_id == post_id))
        pps = list(pp_res.scalars().all())
        if not pps:
            return

        statuses = [p.status for p in pps]
        if all(s == "published" for s in statuses):
            post.status = "published"
        elif any(s == "published" for s in statuses):
            post.status = "partially_published"
        elif all(s == "failed" for s in statuses):
            post.status = "failed"
        elif any(s == "scheduled" for s in statuses):
            post.status = "scheduled"
        else:
            post.status = "draft"
