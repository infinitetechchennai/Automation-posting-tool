import os
import sys
import asyncio

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

backend_dir = os.path.abspath(r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\backend")
sys.path.insert(0, backend_dir)

from app.core.database import AsyncSessionLocal
from app.models.post import Post
from app.models.media import Media
from app.services.image_engine.composer import MarketingImageComposer
from app.config import settings
from sqlalchemy import select

async def update_all_flyers():
    async with AsyncSessionLocal() as session:
        # Fetch all media
        res_media = await session.execute(select(Media))
        media_items = res_media.scalars().all()
        print(f"Found {len(media_items)} media items.")

        # Re-render each media file with reference caliber design
        for m in media_items:
            file_path = os.path.join(settings.MEDIA_STORAGE_PATH, m.storage_key)
            # Pick a diverse template id based on media id
            t_id = (m.id % 20) + 1
            composer = MarketingImageComposer(template_id=t_id, aspect_ratio="1:1")
            
            post_data = {
                "title": "50,000 Calls Every Morning. AI Can.",
                "description": "Automate customer calls, lead follow-ups, reminders and collections with AI Voice Agents.",
                "benefits": [
                    "More Calls • Never miss a lead",
                    "Fast Follow-ups • Instant CRM sync",
                    "High Conversion • Boost 10x growth",
                    "Multilingual • All languages supported"
                ],
                "cta": "Book a Demo",
                "company": "InfiniteTech AI",
                "website": "www.infinitetechai.com",
                "phone": "+91-9884777171"
            }
            try:
                composer.render(post_data, file_path)
                print(f"  [OK] Re-rendered Media #{m.id} ({m.storage_key}) using Style #{t_id:02d}")
            except Exception as e:
                print(f"  [FAILED] Media #{m.id}: {e}")

        # Also check all posts and ensure their preview flyer looks good
        res_posts = await session.execute(select(Post))
        posts = res_posts.scalars().all()
        print(f"\nFound {len(posts)} posts in database.")
        for p in posts:
            if p.media_url and "/storage/media/" in p.media_url:
                key = p.media_url.replace("/storage/media/", "")
                file_path = os.path.join(settings.MEDIA_STORAGE_PATH, key)
                t_id = (p.id % 20) + 1
                composer = MarketingImageComposer(template_id=t_id, aspect_ratio="1:1")
                post_data = {
                    "title": p.title or "50,000 Calls Every Morning. AI Can.",
                    "description": p.content_text or "Automate customer calls, lead follow-ups, reminders and collections with AI Voice Agents.",
                    "benefits": [
                        "More Calls • Never miss a lead",
                        "Fast Follow-ups • Instant CRM sync",
                        "High Conversion • Boost 10x growth",
                        "Multilingual • All languages supported"
                    ],
                    "cta": "Book a Demo",
                    "company": "InfiniteTech AI",
                    "website": p.website_url or "www.infinitetechai.com",
                    "phone": "+91-9884777171"
                }
                try:
                    composer.render(post_data, file_path)
                    print(f"  [OK] Re-rendered Post #{p.id} flyer ({key}) using Style #{t_id:02d}")
                except Exception as e:
                    print(f"  [FAILED] Post #{p.id}: {e}")

if __name__ == "__main__":
    asyncio.run(update_all_flyers())
