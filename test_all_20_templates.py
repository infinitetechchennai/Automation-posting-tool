import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

backend_dir = os.path.abspath(r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\backend")
sys.path.insert(0, backend_dir)

from app.services.image_engine.composer import MarketingImageComposer
from app.services.image_engine.constants import TEMPLATE_FAMILIES

out_dir = r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\storage\media\test_templates"
os.makedirs(out_dir, exist_ok=True)

test_post = {
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

print(f"Testing all {len(TEMPLATE_FAMILIES)} template families...")
for t in TEMPLATE_FAMILIES:
    t_id = t["id"]
    t_name = t["name"]
    composer = MarketingImageComposer(template_id=t_id, aspect_ratio="1:1")
    out_file = os.path.join(out_dir, f"template_{t_id}.png")
    try:
        composer.render(test_post, out_file)
        size_kb = os.path.getsize(out_file) / 1024
        print(f"  [OK] Style #{t_id:02d}: {t_name} -> {size_kb:.1f} KB")
    except Exception as e:
        print(f"  [FAILED] Style #{t_id:02d}: {t_name} -> {e}")
        raise e

print("\nAll 20 templates rendered successfully!")
