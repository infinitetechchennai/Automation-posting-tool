import os
import glob
import sys

backend_dir = os.path.abspath(r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\backend")
sys.path.insert(0, backend_dir)

from app.services.image_engine.composer import MarketingImageComposer

storage_dir = r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\storage\media"
files = glob.glob(os.path.join(storage_dir, "flyer_post_*.png"))

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

print(f"Re-rendering {len(files)} flyer_post_ files...")
for idx, f in enumerate(files):
    t_id = (idx % 20) + 1
    composer = MarketingImageComposer(template_id=t_id, aspect_ratio="1:1")
    try:
        composer.render(post_data, f)
    except Exception as e:
        print(f"Failed {f}: {e}")

print("Done re-rendering flyer_post files!")
