import os
import sqlite3
import json
from app.services.image_generator import generate_social_card

def rerender_all():
    conn = sqlite3.connect('socialpilot.db')
    c = conn.cursor()

    # Query all posts from 270 onwards
    posts = c.execute("SELECT id, title, topic FROM posts WHERE id >= 275 ORDER BY id ASC").fetchall()
    print(f"Found {len(posts)} posts to update.")

    for i, (pid, title, topic) in enumerate(posts):
        # Find media attached
        pp = c.execute("SELECT media_ids_json FROM platform_posts WHERE post_id = ? LIMIT 1", (pid,)).fetchone()
        if not pp or not pp[0]:
            continue
        try:
            m_ids = json.loads(pp[0])
            if not m_ids:
                continue
            mid = m_ids[0]
        except Exception:
            continue

        media_row = c.execute("SELECT storage_key FROM media WHERE id = ?", (mid,)).fetchone()
        if not media_row:
            continue
        storage_key = media_row[0]

        # Determine target file path
        target_path = os.path.join("storage", "media", storage_key)
        # Also copy to root storage if different
        root_path = os.path.abspath(os.path.join("..", "storage", "media", storage_key))

        # Heading and details
        clean_topic = topic or title
        heading = clean_topic
        if ":" in clean_topic:
            heading = clean_topic.split(":", 1)[0].strip()

        print(f"Rerendering Post #{pid}: {heading} (Theme {i % 5}) -> {storage_key}")

        generate_social_card(
            topic=clean_topic,
            details=[
                "Eliminate 15+ hours of repetitive manual tasks every week",
                "Full 24/7 autonomous autopilot with instant real-time sync"
            ],
            cta_text="Book a Demo >",
            output_path=target_path,
            palette_idx=i
        )

        if os.path.exists(os.path.dirname(root_path)):
            import shutil
            shutil.copy2(target_path, root_path)

    print("All posts rerendered successfully!")

if __name__ == "__main__":
    rerender_all()
