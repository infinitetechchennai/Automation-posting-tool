import os
import sys
import json
import asyncio

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

backend_dir = os.path.abspath(r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\backend")
sys.path.insert(0, backend_dir)

from app.core.database import AsyncSessionLocal
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.models.media import Media
from app.services.image_engine.composer import MarketingImageComposer
from app.config import settings
from sqlalchemy import select

async def update_all_posts_with_unique_content():
    async with AsyncSessionLocal() as session:
        # Fetch all posts
        res_posts = await session.execute(select(Post))
        posts = res_posts.scalars().all()
        print(f"Processing {len(posts)} posts for unique title-related flyers...")

        for p in posts:
            title = p.title or p.topic or "Autonomous AI Operations"
            desc = ""
            benefits = []
            cta = "Book a Demo"
            
            try:
                pkg = json.loads(p.content_json)
                desc = pkg.get("description") or pkg.get("overview") or pkg.get("hook") or ""
                benefits = pkg.get("key_benefits") or pkg.get("key_points") or []
                cta = pkg.get("call_to_action") or "Book a Demo"
            except Exception:
                desc = p.topic or ""

            # Check platform posts for this post
            res_pp = await session.execute(select(PlatformPost).where(PlatformPost.post_id == p.id))
            pp_list = res_pp.scalars().all()

            media_ids = set()
            for pp in pp_list:
                try:
                    m_ids = json.loads(pp.media_ids_json or "[]")
                    for mid in m_ids:
                        media_ids.add(mid)
                except Exception:
                    pass

            # Pick a diverse template family for each post
            t_id = (p.id % 20) + 1
            composer = MarketingImageComposer(template_id=t_id, aspect_ratio="1:1")

            post_data = {
                "title": title,
                "topic": p.topic,
                "description": desc,
                "benefits": benefits,
                "cta": cta,
                "company": "InfiniteTech AI",
                "website": p.website_url or "www.infinitetechai.com",
                "phone": "+91-9884777171"
            }

            for mid in media_ids:
                media_item = await session.get(Media, mid)
                if media_item:
                    target_path = os.path.join(settings.MEDIA_STORAGE_PATH, media_item.storage_key)
                    try:
                        composer.render(post_data, target_path)
                        print(f"  [OK] Post #{p.id} ('{title[:35]}...') -> Media #{mid} ({media_item.storage_key}) [Style #{t_id:02d}]")
                    except Exception as e:
                        print(f"  [FAILED] Post #{p.id}: {e}")

            # Also check if there's a flyer file named flyer_post_{p.id}_*.png
            import glob
            matching_files = glob.glob(os.path.join(settings.MEDIA_STORAGE_PATH, f"flyer_post_{p.id}_*.png"))
            for mf in matching_files:
                try:
                    composer.render(post_data, mf)
                    print(f"  [OK] Re-rendered static file {os.path.basename(mf)} for Post #{p.id}")
                except Exception as e:
                    print(f"  [FAILED] static file {mf}: {e}")

if __name__ == "__main__":
    asyncio.run(update_all_posts_with_unique_content())
