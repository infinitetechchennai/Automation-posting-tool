import sqlite3
import json
import os
import uuid
from PIL import Image

MEDIA_STORAGE_PATH = os.path.abspath("storage/media")
os.makedirs(MEDIA_STORAGE_PATH, exist_ok=True)

# Import generate_social_card
import sys
sys.path.append(os.path.abspath("backend"))
from app.services.image_generator import generate_social_card

conn = sqlite3.connect("backend/socialpilot.db")
c = conn.cursor()

# Get all posts
posts = c.execute("SELECT id, user_id, title, topic, content_json FROM posts").fetchall()
print(f"Found {len(posts)} posts to process.")

for p_id, user_id, title, topic, content_json in posts:
    topic_str = topic or title or "AI Automation for Business Operations"
    print(f"Processing Post {p_id}: {topic_str}")

    # Extract details from content_json if available
    details = None
    try:
        data = json.loads(content_json or "{}")
        if "key_benefits" in data and isinstance(data["key_benefits"], list):
            details = [str(x) for x in data["key_benefits"][:2]]
    except Exception:
        pass

    # Generate composite marketing flyer with topic, details, and CTA button
    img_filename = f"flyer_post_{p_id}_{uuid.uuid4().hex[:6]}.png"
    img_path = os.path.join(MEDIA_STORAGE_PATH, img_filename)

    generate_social_card(
        topic=topic_str,
        details=details,
        cta_text="GET STARTED NOW: WWW.INFINITETECHAI.COM | +91-9884777171 >",
        company="InfiniteTech AI",
        website="www.infinitetechai.com",
        phone="+91-9884777171",
        output_path=img_path
    )

    size_bytes = os.path.getsize(img_path) if os.path.exists(img_path) else 1024
    clean_name = f"Flyer_{topic_str[:25].strip().replace(' ', '_').replace(':', '')}.png"

    # Insert into media table for both user_id and demo user_id=2
    target_user_id = user_id if user_id else 2
    c.execute("""
        INSERT INTO media (user_id, storage_key, original_filename, mime_type, size_bytes, width, height, duration_seconds, alt_text, created_at)
        VALUES (?, ?, ?, 'image/png', ?, 1080, 1080, NULL, ?, datetime('now'))
    """, (target_user_id, img_filename, clean_name, size_bytes, f"Marketing flyer for {topic_str}"))

    media_id = c.lastrowid
    print(f"  Created media id={media_id}: {img_filename}")

    # Update platform_posts for this post
    p_posts = c.execute("SELECT id, media_ids_json FROM platform_posts WHERE post_id = ?", (p_id,)).fetchall()
    for pp_id, cur_media in p_posts:
        new_media_json = json.dumps([media_id])
        c.execute("UPDATE platform_posts SET media_ids_json = ? WHERE id = ?", (new_media_json, pp_id))
        print(f"    Updated platform_post {pp_id} with media_id [{media_id}]")

conn.commit()
conn.close()
print("All posts successfully updated with composite marketing flyers!")
