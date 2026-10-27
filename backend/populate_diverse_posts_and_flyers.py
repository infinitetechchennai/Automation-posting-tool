import os
import sys
import json
import uuid
import asyncio

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

backend_dir = os.path.abspath(r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\backend")
sys.path.insert(0, backend_dir)

from app.core.database import AsyncSessionLocal
from app.models.post import Post
from app.models.platform_post import PlatformPost
from app.models.media import Media
from app.models.user import User
from app.services.image_engine.composer import MarketingImageComposer
from app.config import settings
from sqlalchemy import select

DIVERSE_TOPICS = [
    {
        "title": "Eliminate 15+ Hours of Repetitive Manual Tasks Every Week",
        "topic": "Repetitive Tasks & Time Saved",
        "description": "Automate busywork, document routing, and daily admin tasks so your team can focus on high-value strategy.",
        "cta": "Reclaim Your Hours",
        "key_benefits": [
            "15+ Hours Saved: Every single workweek",
            "Zero Human Lag: Instant automated workflows",
            "Continuous Scale: Runs 24/7 without fatigue",
            "Strategic Focus: Eliminate manual busywork"
        ],
        "li_caption": "Are manual, repetitive administrative tasks draining your team's energy?\n\nLeaders spend up to 15 hours every week on routine operations that can be automated on autopilot. TaskFlow AI eliminates busywork, ensuring your high-performers focus on strategy.\n\n⚡ Reclaim 15+ hours weekly with InfiniteTech AI.\n🌐 www.infinitetechai.com",
        "tw_caption": "Stop losing 15+ hours every week to manual tasks. 🚀 TaskFlow AI automates admin busywork on 100% autopilot. Reclaim your time: www.infinitetechai.com #AIAutomation #Productivity",
        "ig_caption": "Reclaim 15+ hours every week! ✨ Automate repetitive admin tasks, route files seamlessly, and work less while achieving more with InfiniteTech AI. 👉 Link in bio.",
        "fb_caption": "Tired of spending your workdays buried in repetitive manual tasks? Let InfiniteTech AI handle the busywork on autopilot so you can focus on growing your business. Visit www.infinitetechai.com"
    },
    {
        "title": "Smart Automated Invoicing: Send, Track & Reconcile Bills via WhatsApp",
        "topic": "Invoicing & Billing Automation",
        "description": "Create, send, and track tax-compliant invoices automatically with instant WhatsApp reminders and bank reconciliation.",
        "cta": "Automate Invoicing",
        "key_benefits": [
            "Smart Invoices: Zero data entry errors",
            "Instant WhatsApp: Delivered in 3 seconds",
            "Auto-Reconcile: Direct real-time bank sync",
            "Tax Compliant: 100% audit-ready records"
        ],
        "li_caption": "Cash flow is the lifeblood of business, yet chasing unpaid invoices takes hours.\n\nWith InvoiceAI, create, dispatch via WhatsApp, and reconcile payments with 0% error rate. Stop manual billing friction.\n\n📄 Modernize invoicing at www.infinitetechai.com",
        "tw_caption": "Send tax-compliant invoices in 3 seconds and get paid faster via WhatsApp. 💳 Auto-reconcile with your bank instantly: www.infinitetechai.com #Fintech #SmartBilling",
        "ig_caption": "Zero-error automated invoices sent straight to WhatsApp! 📲 Cut payment delays by 70% with InfiniteTech AI. Link in bio.",
        "fb_caption": "Stop wasting time creating invoices manually. InvoiceAI dispatches bills and reconciles payments on autopilot. Learn more at www.infinitetechai.com"
    },
    {
        "title": "Intelligent Calendar Scheduling: Zero Conflicts & 24/7 Booking",
        "topic": "Meeting & Calendar Automation",
        "description": "Let clients book appointments 24/7 across multiple time zones with zero calendar clashes and automated SMS reminders.",
        "cta": "Schedule Without Clashes",
        "key_benefits": [
            "24/7 Booking: Self-service client slots",
            "Smart Reminders: Cut no-shows by 85%",
            "Multi-Timezone: Flawless global coordination",
            "Zero Conflicts: Automated calendar lock"
        ],
        "li_caption": "Eliminate the endless back-and-forth 'What time works for you?' email chains.\n\nCalendarAI coordinates executive meetings across global timezones with zero clashes, cutting no-show rates by 85%.\n\n🗓️ Book effortlessly at www.infinitetechai.com",
        "tw_caption": "Zero calendar clashes. Ever again. 🗓️ Let clients book 24/7 across all timezones with automated reminder sync: www.infinitetechai.com #ProductivityHacks",
        "ig_caption": "No more calendar chaos! ⏰ 24/7 client booking with automated reminders that cut no-shows by 85%. Experience seamless scheduling: www.infinitetechai.com",
        "fb_caption": "Simplify your appointment booking! CalendarAI coordinates schedules 24/7 across time zones with zero double-booking. See it in action at www.infinitetechai.com"
    },
    {
        "title": "Automated Data Entry & Extraction: Raw Documents to CRM Records",
        "topic": "OCR & Data Processing",
        "description": "Extract structured data from scanned PDFs, receipts, and spreadsheets with 99.9% accuracy directly into your database.",
        "cta": "Extract Data on Autopilot",
        "key_benefits": [
            "Scans to CRM: Raw files to records",
            "99.9% Accuracy: Zero human typo errors",
            "Bulk Ingestion: 1,000 pages per minute",
            "Instant Sync: Connects to SQL & Sheets"
        ],
        "li_caption": "Manual document entry is slow, expensive, and error-prone.\n\nDocuExtract AI ingests thousands of complex PDFs, receipts, and forms in seconds, structuring records directly into your CRM with 99.9% accuracy.\n\n🗄️ Explore document OCR at www.infinitetechai.com",
        "tw_caption": "Convert stacks of PDF invoices and forms into clean database records in seconds. ⚡ 99.9% accuracy with DocuExtract AI: www.infinitetechai.com #AI #DataExtraction",
        "ig_caption": "From messy PDFs to structured database rows in seconds! 📄 99.9% accuracy with zero manual typing. Learn more at www.infinitetechai.com",
        "fb_caption": "Eliminate manual data entry today! DocuExtract AI ingests 1,000 pages per minute and syncs directly into your software. Visit www.infinitetechai.com"
    },
    {
        "title": "Turn Cold Leads Into Closed Deals: 60-Second AI Follow-ups",
        "topic": "Sales Pipeline & Lead Growth",
        "description": "Engage new inbound prospects in under 60 seconds, score deal velocity, and sync notes directly into your CRM.",
        "cta": "Accelerate Sales Growth",
        "key_benefits": [
            "60s Follow-ups: Engage leads instantly",
            "+340% Lift: Maximize pipeline velocity",
            "CRM Automation: Auto-log calls & notes",
            "Predictive Score: Prioritize top deals"
        ],
        "li_caption": "Speed to lead determines conversion rates. Contacting a prospect in under 60 seconds increases deal closures by 340%.\n\nGrowthPulse AI qualifies inbound prospects instantly and keeps your pipeline moving 24/7.\n\n📈 Boost conversions at www.infinitetechai.com",
        "tw_caption": "60-second follow-ups = +340% sales conversion. 🚀 Never let another warm lead go cold. Automate your sales pipeline with InfiniteTech AI: www.infinitetechai.com",
        "ig_caption": "Engage inbound leads in under 60 seconds! 🔥 GrowthPulse AI boosts conversion rates by +340% with zero delays. Tap link in bio.",
        "fb_caption": "Speed up your sales cycle! Engage warm leads in under 60 seconds with automated intelligence. Learn how InfiniteTech AI scales revenue: www.infinitetechai.com"
    },
    {
        "title": "Put Your Social Media on Autopilot: 30 Days of Content in Minutes",
        "topic": "Social Media Automation",
        "description": "Create, design, and schedule 30 days of high-converting branded posts across LinkedIn, Twitter, and Instagram.",
        "cta": "Automate Social Media",
        "key_benefits": [
            "Auto Copywriting: Tailored captions & tags",
            "Branded Visuals: 20 distinct design styles",
            "Auto Scheduling: 30 days planned ahead",
            "Multi-Platform: X, LinkedIn, FB & IG"
        ],
        "li_caption": "Consistency builds authority on social media, but creating daily content takes hours.\n\nSocialPilot AI drafts compelling copy, generates tailored branded graphics across 20 design layouts, and queues 30 days of posts in minutes.\n\n🚀 Scale your brand at www.infinitetechai.com",
        "tw_caption": "30 days of branded social media content created and scheduled in 5 minutes flat. 🎨 Multi-channel publishing on autopilot: www.infinitetechai.com #SocialMediaMarketing",
        "ig_caption": "Plan 30 days of social media in 5 minutes! ✨ Stunning branded visuals + smart copy for LinkedIn, X, and Instagram. Link in bio.",
        "fb_caption": "Never run out of social media posts again. SocialPilot AI designs graphics and schedules posts across all your accounts automatically. www.infinitetechai.com"
    },
    {
        "title": "Scale to 50,000 Customer Calls Every Morning with AI Voice Agents",
        "topic": "Customer Calling & Voice AI",
        "description": "Automate inbound reception, outbound lead qualification, and payment reminders with natural human-sounding voice agents.",
        "cta": "Book a Voice Demo",
        "key_benefits": [
            "50,000 Calls: Never miss a customer",
            "Fast Follow-ups: Instant CRM sync",
            "High Conversion: Boost 10x business growth",
            "Multilingual: Connect in any language"
        ],
        "li_caption": "What if your business could handle 50,000 customer calls every morning without hiring a 100-person call center?\n\nSkyPro AI calling agents speak naturally, qualify prospects, handle scheduling, and log CRM notes in real time.\n\n📞 Experience voice AI at www.infinitetechai.com",
        "tw_caption": "50,000 calls handled simultaneously with natural, fluent AI voice agents. 📞 Boost conversion and cut wait times: www.infinitetechai.com #VoiceAI #SkyPro",
        "ig_caption": "50,000 customer calls handled simultaneously! 🎙️ SkyPro AI calling agents speak fluently in multiple languages. Book a demo via link in bio.",
        "fb_caption": "Never miss another customer phone call. SkyPro AI voice agents handle inbound inquiries and outbound calls with human-like conversation. www.infinitetechai.com"
    },
    {
        "title": "24/7 Tier-1 Customer Support Desk: Sub-Second Incident Resolution",
        "topic": "Customer Support & Helpdesk",
        "description": "Resolve customer tickets in seconds with 24/7 autonomous support agents and smart human escalation.",
        "cta": "Automate Customer Support",
        "key_benefits": [
            "Instant Answers: Sub-second live answers",
            "24/7 Coverage: Zero customer wait time",
            "Auto Escalation: Smart human routing",
            "98% Resolution: Tier-1 resolved instantly"
        ],
        "li_caption": "Customer satisfaction is won or lost in response time.\n\nSupportDesk AI answers Tier-1 inquiries across chat, email, and tickets in under 4 seconds with a 98% first-contact resolution rate.\n\n💬 Elevate CSAT at www.infinitetechai.com",
        "tw_caption": "Sub-second customer support resolutions 24/7. ⚡ Cut ticket backlogs by 90% and boost CSAT with SupportDesk AI: www.infinitetechai.com #CustomerSuccess",
        "ig_caption": "Instant 24/7 customer support! 💬 Resolve tickets in under 4 seconds and delight your customers with InfiniteTech AI. Link in bio.",
        "fb_caption": "Give your customers immediate help 24/7. SupportDesk AI resolves tickets instantly while seamlessly routing complex issues to your team. www.infinitetechai.com"
    },
    {
        "title": "Real-Time Executive Intelligence: Automated KPI Dashboards & Reports",
        "topic": "Business Intelligence & Analytics",
        "description": "Automate weekly KPI reporting, revenue forecasts, and cross-department analytics into real-time visual dashboards.",
        "cta": "Explore Analytics AI",
        "key_benefits": [
            "Real-Time KPIs: Live cross-tool metrics",
            "Auto Reporting: Zero manual slides needed",
            "Predictive BI: Forecast quarterly revenue",
            "100% Accurate: Unified source of truth"
        ],
        "li_caption": "Executive leadership shouldn't spend Fridays building slide decks.\n\nAnalyticsAI consolidates data across finance, marketing, and operations into real-time dashboards with predictive revenue forecasts.\n\n📊 Discover executive intelligence at www.infinitetechai.com",
        "tw_caption": "No more building weekly KPI decks by hand. 📊 AnalyticsAI unifies your data into real-time executive dashboards on autopilot: www.infinitetechai.com #BusinessIntelligence",
        "ig_caption": "Real-time executive KPI dashboards with zero manual spreadsheet work! 📈 Make faster, data-backed decisions with InfiniteTech AI. Link in bio.",
        "fb_caption": "Gain clear visibility into your company's performance. AnalyticsAI consolidates your metrics into executive dashboards automatically. Visit www.infinitetechai.com"
    },
    {
        "title": "Automated Inventory & Supply Chain Reordering on Autopilot",
        "topic": "Supply Chain & Logistics AI",
        "description": "Predict demand spikes, prevent stockouts, and trigger vendor purchase orders automatically with AI logistics.",
        "cta": "Streamline Supply Chain",
        "key_benefits": [
            "Zero Stockouts: Predictive inventory alerts",
            "Auto Reorders: POs triggered at min stock",
            "Vendor Sync: Live logistics tracking",
            "Cost Optimized: Cut excess holding by 30%"
        ],
        "li_caption": "Supply chain hiccups and stockouts destroy customer trust.\n\nInventoryAI monitors velocity in real time, forecasts seasonal demand spikes, and generates supplier purchase orders autonomously.\n\n📦 Optimize logistics at www.infinitetechai.com",
        "tw_caption": "Eliminate stockouts and overstock costs. 📦 InventoryAI predicts demand and automates supplier purchase orders: www.infinitetechai.com #SupplyChain #Logistics",
        "ig_caption": "Say goodbye to stockouts! 🚚 InventoryAI predicts demand spikes and automates restocking on autopilot. Link in bio.",
        "fb_caption": "Keep your shelves stocked and your costs under control with automated supply chain reordering. Discover InventoryAI at www.infinitetechai.com"
    }
]

async def populate_diverse_posts():
    async with AsyncSessionLocal() as session:
        # Get demo user
        res_u = await session.execute(select(User).limit(1))
        user = res_u.scalar_one_or_none()
        user_id = user.id if user else 1

        # Fetch existing posts
        res_posts = await session.execute(select(Post).order_by(Post.id.asc()))
        posts = res_posts.scalars().all()
        print(f"Total posts found in database: {len(posts)}")

        os.makedirs(settings.MEDIA_STORAGE_PATH, exist_ok=True)

        for idx, post in enumerate(posts):
            data = DIVERSE_TOPICS[idx % len(DIVERSE_TOPICS)]
            t_id = (idx % 20) + 1  # Distribute across all 20 template families!

            post.title = data["title"]
            post.topic = data["topic"]
            post.status = "scheduled"

            content_pkg = {
                "title": data["title"],
                "topic": data["topic"],
                "hook": data["title"],
                "overview": data["description"],
                "description": data["description"],
                "key_benefits": data["key_benefits"],
                "call_to_action": data["cta"],
                "template_id": t_id,
                "platform_posts": {
                    "linkedin": {"caption": data["li_caption"]},
                    "twitter": {"caption": data["tw_caption"]},
                    "instagram": {"caption": data["ig_caption"]},
                    "facebook": {"caption": data["fb_caption"]}
                }
            }
            post.content_json = json.dumps(content_pkg)
            await session.flush()

            # Render a unique flyer image for this specific post using template t_id
            img_filename = f"flyer_post_{post.id}_tpl{t_id:02d}_{uuid.uuid4().hex[:6]}.png"
            img_path = os.path.join(settings.MEDIA_STORAGE_PATH, img_filename)

            composer = MarketingImageComposer(template_id=t_id, aspect_ratio="1:1")
            post_render_data = {
                "title": data["title"],
                "topic": data["topic"],
                "description": data["description"],
                "benefits": data["key_benefits"],
                "cta": data["cta"],
                "company": "InfiniteTech AI",
                "website": post.website_url or "www.infinitetechai.com",
                "phone": "+91-9884777171"
            }

            try:
                composer.render(post_render_data, img_path)
                size_bytes = os.path.getsize(img_path) if os.path.exists(img_path) else 1024

                # Create unique Media item
                media_item = Media(
                    user_id=user_id,
                    storage_key=img_filename,
                    original_filename=f"Flyer_{data['title'][:25].strip().replace(' ', '_')}.png",
                    mime_type="image/png",
                    size_bytes=size_bytes,
                    width=1080,
                    height=1080,
                    alt_text=f"AI Marketing Flyer (Style #{t_id:02d}) for {data['title']}"
                )
                session.add(media_item)
                await session.flush()

                # Update platform posts for this post
                res_pp = await session.execute(select(PlatformPost).where(PlatformPost.post_id == post.id))
                pp_list = res_pp.scalars().all()
                for pp in pp_list:
                    pp.media_ids_json = json.dumps([media_item.id])
                    p_name = pp.platform.lower()
                    if p_name == "linkedin":
                        pp.caption = data["li_caption"]
                    elif p_name in ["twitter", "x"]:
                        pp.caption = data["tw_caption"]
                    elif p_name == "instagram":
                        pp.caption = data["ig_caption"]
                    elif p_name == "facebook":
                        pp.caption = data["fb_caption"]

                print(f"[OK] Post #{post.id}: '{data['title'][:35]}...' -> Media #{media_item.id} [Style #{t_id:02d} ({composer.template_info['name']})]")
            except Exception as e:
                print(f"[ERROR] Rendering Post #{post.id}: {e}")

        await session.commit()
        print("\nAll posts successfully upgraded with 100% unique topics, custom copy, and non-repeating flyer graphics!")

if __name__ == "__main__":
    asyncio.run(populate_diverse_posts())
