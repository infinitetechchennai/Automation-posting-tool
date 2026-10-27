from celery import Celery
from app.config import settings

celery_app = Celery(
    "socialpilot_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    broker_connection_retry_on_startup=True
)

@celery_app.task(name="publish_scheduled_post_task")
def publish_scheduled_post_task(platform_post_id: int):
    """Celery background worker entry point."""
    import asyncio
    from app.core.database import AsyncSessionLocal
    from app.models.platform_post import PlatformPost
    from app.services.publisher_service import PublisherService
    from sqlalchemy import select

    async def _run():
        async with AsyncSessionLocal() as db:
            res = await db.execute(select(PlatformPost).where(PlatformPost.id == platform_post_id))
            pp = res.scalar_one_or_none()
            if pp:
                await PublisherService.publish_platform_post(db, pp)

    asyncio.run(_run())
