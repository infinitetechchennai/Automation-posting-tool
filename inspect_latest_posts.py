import sqlite3

conn = sqlite3.connect(r'C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\backend\socialpilot.db')
c = conn.cursor()
c.execute('SELECT id, title, topic FROM posts ORDER BY id DESC LIMIT 5')
posts = c.fetchall()
for p in posts:
    pid, title, topic = p
    c.execute('''
        SELECT m.id, m.storage_key, m.alt_text FROM platform_posts pp
        JOIN json_each(pp.media_ids_json) j ON 1=1
        JOIN media m ON m.id = j.value
        WHERE pp.post_id = ? LIMIT 1
    ''', (pid,))
    media = c.fetchone()
    print(f'Post #{pid}: "{title[:40]}" -> Media: {media}')
