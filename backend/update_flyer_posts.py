import sqlite3
import json

conn = sqlite3.connect('socialpilot.db')
cur = conn.cursor()

# Get flyer media id
cur.execute("SELECT id FROM media WHERE storage_key LIKE '%infinitetech%' OR original_filename LIKE '%InfiniteTech%'")
row = cur.fetchone()
media_id = row[0] if row else 1

cur.execute("SELECT id, topic FROM posts")
posts = cur.fetchall()

fb_text = """🚀 FROM CHAOS TO CONTROL. WORK LESS. ACHIEVE MORE.

Are you spending half your workday buried under admin tasks?

🔴 BEFORE InfiniteTech AI:
❌ Manual Invoicing & Chasing Payments
❌ Endless Data Entry & Spreadsheets
❌ Scheduling Conflicts & Missed Calls
❌ Forgotten Follow-ups & Lost Deals
❌ Zero Time to Grow Your Business

🟢 AFTER InfiniteTech AI:
✅ Auto Invoicing on Autopilot
✅ Smart Intelligent Scheduling
✅ Automated Data Extraction & Entry
✅ Instant AI Follow-ups 24/7
✅ More Time. More Life.

💡 AUTOMATE & ELEVATE YOUR BUSINESS:
📄 Smart Invoicing: Create, send & track invoices automatically.
🗓️ Intelligent Scheduling: No more clashes, perfectly planned.
🗄️ Data Entry on Autopilot: Extract, enter, organize, done.
💬 Instant Follow-ups: AI that follows up so you don't have to.
📈 Insights That Drive Growth: Real-time reports for smarter decisions.

⚡ SAVE UP TO 70% OF YOUR ADMIN TIME.
Let InfiniteTech AI take care of the rest!

🌐 Website: www.infinitetechai.com
📞 Reach US: +91-9884777171
✉️ Email: sales@infinitetechai.com

#InfiniteTechAI #Automation #Productivity #WorkLessAchieveMore #AIforBusiness"""

ig_text = """From CHAOS to CONTROL ✨ Work Less. Achieve More.

Still trapped doing admin work manually?

❌ BEFORE:
• Manual Invoicing
• Endless Data Entry
• Scheduling Conflicts
• Missed Follow-ups
• No Time to Grow

✅ AFTER:
• Auto Invoicing
• Smart Scheduling
• Automated Data Entry
• Instant Follow-ups
• More Time. More Life.

🎯 Save up to 70% of your admin time with InfiniteTech AI.
Let InfiniteTech AI take care of the rest!

📞 +91-9884777171 | sales@infinitetechai.com
👉 Link in bio: www.infinitetechai.com

#InfiniteTechAI #BusinessAutomation #SmartInvoicing #ProductivityHacks #SaveTime"""

li_text = """FROM CHAOS TO CONTROL: Why modern leaders are automating administrative overhead.

Every hour business leaders spend on manual invoicing, scheduling clashes, and data entry is an hour not spent driving revenue.

At InfiniteTech AI, our mission is clear: Automate the repetitive so you focus on what matters.

5 Core Pillars to Elevate Your Business:
1. Smart Invoicing: Create, send, and track invoices automatically.
2. Intelligent Scheduling: Zero calendar conflicts, perfectly synced meetings.
3. Data Entry on Autopilot: Extract, organize, and structure business records instantly.
4. Instant Follow-ups: AI that engages leads and clients without manual delays.
5. Actionable Insights: Real-time executive dashboards for smarter decisions.

The Result: Save up to 70% of your admin time and eliminate operational friction.

Connect with us:
🌐 www.infinitetechai.com
📞 +91-9884777171 | ✉️ sales@infinitetechai.com

#InfiniteTechAI #OperationalExcellence #BusinessAutomation #Productivity"""

tw_text = """FROM CHAOS TO CONTROL 🚀

Stop wasting hours on manual invoicing, data entry & missed follow-ups.

⚡ InfiniteTech AI automates the repetitive
⚡ Save up to 70% admin time

👉 www.infinitetechai.com | +91-9884777171 #AI #Automation"""

caption_map = {
    'facebook': fb_text,
    'instagram': ig_text,
    'linkedin': li_text,
    'twitter': tw_text
}

flyer_titles = [
    'FROM CHAOS TO CONTROL: Work Less, Achieve More | InfiniteTech AI',
    'SAVE UP TO 70% ADMIN TIME: Smart Invoicing & Autopilot Billing | InfiniteTech AI',
    'INTELLIGENT SCHEDULING: Zero Calendar Clashes, Perfectly Planned | InfiniteTech AI',
    'DATA ENTRY ON AUTOPILOT: Extract, Enter, Organize & Done | InfiniteTech AI',
    'INSTANT FOLLOW-UPS & GROWTH INSIGHTS: Scale Your Operations | InfiniteTech AI'
]

for idx, (p_id, topic) in enumerate(posts):
    title = flyer_titles[idx % len(flyer_titles)]
    cur.execute("UPDATE posts SET title=? WHERE id=?", (title, p_id))
    cur.execute("SELECT id, platform FROM platform_posts WHERE post_id=?", (p_id,))
    p_posts = cur.fetchall()
    for pp_id, platform in p_posts:
        cap = caption_map.get(platform.lower(), fb_text)
        cur.execute("UPDATE platform_posts SET caption=?, media_ids_json=? WHERE id=?", (cap, json.dumps([media_id]), pp_id))

conn.commit()
print(f"Successfully updated {len(posts)} posts with exact flyer details and attached media ID {media_id}.")
conn.close()
