import sqlite3

conn = sqlite3.connect('socialpilot.db')
cur = conn.cursor()
cur.execute("SELECT id FROM media WHERE user_id=2")
user2_media = [r[0] for r in cur.fetchall()]
print("User 2 media IDs:", user2_media)
media_id = user2_media[0] if user2_media else 2

cur.execute("UPDATE platform_posts SET media_ids_json=?", (f"[{media_id}]",))
conn.commit()
print("Updated all platform_posts to media_ids_json:", f"[{media_id}]")
conn.close()
