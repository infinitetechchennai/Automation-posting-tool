import logging
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select, and_
from app.core.database import AsyncSessionLocal
from app.models.platform_post import PlatformPost
from app.models.publishing_job import PublishingJob
from app.services.publisher_service import PublisherService

logger = logging.getLogger(__name__)

async_scheduler = AsyncIOScheduler()

async def check_due_scheduled_posts():
    """Scan database for posts scheduled to be published now."""
    now_utc = datetime.now(timezone.utc)
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(PlatformPost).where(
                    and_(
                        PlatformPost.status.in_(["scheduled", "pending", "queued"]),
                        PlatformPost.scheduled_at <= now_utc
                    )
                )
            )
            due_posts = list(result.scalars().all())
            if due_posts:
                logger.info(f"Scheduler found {len(due_posts)} due posts to publish.")
                for pp in due_posts:
                    try:
                        await PublisherService.publish_platform_post(db, pp)
                    except Exception as e:
                        logger.error(f"Error publishing due post {pp.id}: {e}")
    except Exception as e:
        logger.error(f"Scheduler job check error: {e}")

def start_scheduler():
    """Start in-process scheduler if not already running."""
    if not async_scheduler.running:
        async_scheduler.add_job(
            check_due_scheduled_posts,
            "interval",
            seconds=10,
            id="due_posts_checker",
            replace_existing=True
        )
        async_scheduler.start()
        logger.info("In-process background scheduler started (10s interval).")

def stop_scheduler():
    if async_scheduler.running:
        async_scheduler.shutdown()
        logger.info("In-process scheduler stopped.")
