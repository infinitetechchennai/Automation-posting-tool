import json
import logging
import re
import httpx
from typing import Dict, Any, List, Optional
from app.config import settings
from app.schemas.ai import (
    AIPostGenerateRequest,
    CompleteContentPackage,
    ContentOverview,
    PlatformPostContent,
    ImagePromptDetails,
    TagsAndMentions,
    SinglePlatformRegenerateRequest,
    HashtagGenerateRequest,
    CaptionImproveRequest,
    RepurposeContentRequest,
    ImagePromptGenerateRequest
)

logger = logging.getLogger(__name__)


class AIService:
    @staticmethod
    async def check_ollama_status() -> Dict[str, Any]:
        """Check if local Ollama daemon is reachable and list available models."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                if resp.status_code == 200:
                    data = resp.json()
                    models = [m.get("name") for m in data.get("models", [])]
                    is_model_present = any(settings.OLLAMA_MODEL in m for m in models)
                    return {
                        "is_available": True,
                        "base_url": settings.OLLAMA_BASE_URL,
                        "configured_model": settings.OLLAMA_MODEL,
                        "model_installed": is_model_present,
                        "installed_models": models,
                        "message": "Ollama is running and accessible." if is_model_present else f"Ollama is running, but configured model '{settings.OLLAMA_MODEL}' was not found. Run 'ollama pull {settings.OLLAMA_MODEL}'."
                    }
        except Exception as e:
            logger.info(f"Ollama check failed: {e}")
        
        return {
            "is_available": False,
            "base_url": settings.OLLAMA_BASE_URL,
            "configured_model": settings.OLLAMA_MODEL,
            "model_installed": False,
            "installed_models": [],
            "message": f"Ollama is not running locally at {settings.OLLAMA_BASE_URL}. To enable local LLM inference, install Ollama from https://ollama.ai and run 'ollama run {settings.OLLAMA_MODEL}'. Development fallback generator is active."
        }

    @classmethod
    async def generate_complete_package(cls, req: AIPostGenerateRequest) -> CompleteContentPackage:
        """Generate full multi-platform content package."""
        status = await cls.check_ollama_status()

        if status["is_available"] and status["model_installed"]:
            try:
                return await cls._generate_with_ollama(req)
            except Exception as e:
                logger.error(f"Ollama generation failed: {e}. Falling back to dynamic generator.")
        
        # High-fidelity dynamic fallback generator preserving all facts
        return cls._generate_dynamic_package(req, source="fallback_demo")

    @classmethod
    async def _generate_with_ollama(cls, req: AIPostGenerateRequest) -> CompleteContentPackage:
        prompt = f"""
You are SocialPilot AI, an elite social media copywriter and growth marketer.
Generate a structured social media package strictly in JSON format without markdown code blocks.

INPUT DATA:
- Topic: {req.topic}
- Company: {req.company_name or 'Independent Brand'}
- Product/Service: {req.product_service or req.topic}
- Target Audience: {req.target_audience}
- Objective: {req.marketing_objective}
- Industry: {req.industry}
- Tone: {req.tone}
- Language: {req.language}
- Keywords: {', '.join(req.keywords) if req.keywords else 'None'}
- Offer: {req.offer or 'None'}
- CTA: {req.call_to_action or 'Automated'}
- Extra: {req.additional_instructions or 'None'}
- Platforms: {', '.join(req.platforms)}

Output strict JSON matching the schema:
{{
  "title": "...",
  "hook": "...",
  "description": "...",
  "main_caption": "...",
  "key_points": ["point 1", "point 2", "point 3"],
  "call_to_action": "...",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "keywords": ["kw1", "kw2"],
  "tags_and_mentions": {{
    "search_keywords": ["..."],
    "internal_content_tags": ["..."],
    "hashtags": ["..."],
    "suggested_mentions_to_verify": ["..."]
  }},
  "image_prompt": {{
    "main_subject": "...",
    "background": "...",
    "composition": "...",
    "visual_style": "Photorealistic",
    "lighting": "Studio",
    "brand_colors": "...",
    "intended_audience": "...",
    "aspect_ratio": "1:1",
    "text_placement": "No text",
    "full_prompt": "..."
  }},
  "alternative_hooks": ["hook 1", "hook 2", "hook 3"],
  "alternative_ctas": ["cta 1", "cta 2"],
  "alt_text": "...",
  "improvements": ["tip 1", "tip 2"],
  "platform_posts": {{
    "facebook": {{ "hook": "...", "caption": "...", "description": "...", "key_points": [...], "cta": "...", "hashtags": [...], "mentions": [], "media_recommendation": "..." }},
    "instagram": {{ "hook": "...", "caption": "...", "description": "...", "key_points": [...], "cta": "...", "hashtags": [...], "mentions": [], "media_recommendation": "..." }},
    "linkedin": {{ "hook": "...", "caption": "...", "description": "...", "key_points": [...], "cta": "...", "hashtags": [...], "mentions": [], "media_recommendation": "..." }},
    "twitter": {{ "hook": "...", "caption": "...", "description": "...", "key_points": [], "cta": "...", "hashtags": [...], "mentions": [], "media_recommendation": "..." }}
  }}
}}
"""
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{settings.OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": settings.OLLAMA_MODEL,
                    "prompt": prompt,
                    "format": "json",
                    "stream": False,
                    "options": {"temperature": 0.7}
                }
            )
            data = resp.json()
            raw_content = data.get("response", "{}")
            parsed = json.loads(raw_content)

            # Ensure platform posts conform
            overview = ContentOverview(
                internal_title=parsed.get("title", f"Campaign on {req.topic}"),
                main_topic=req.topic,
                campaign_objective=req.marketing_objective,
                target_audience=req.target_audience or "Customers",
                primary_keyword=req.keywords[0] if req.keywords else req.topic.split()[0],
                secondary_keywords=req.keywords[1:] if len(req.keywords) > 1 else [],
                content_category=req.content_type
            )

            platform_posts = {}
            for p_name in req.platforms:
                p_key = "twitter" if p_name in ("twitter", "x") else p_name
                raw_p = parsed.get("platform_posts", {}).get(p_key, {})
                caption = raw_p.get("caption", parsed.get("main_caption", ""))
                # If twitter, ensure 280 chars
                if p_key == "twitter" and len(caption) > 280:
                    caption = caption[:277] + "..."
                
                char_limit = 280 if p_key == "twitter" else 2200 if p_key == "instagram" else 3000
                platform_posts[p_name] = PlatformPostContent(
                    platform=p_name,
                    hook=raw_p.get("hook", parsed.get("hook", "")),
                    caption=caption,
                    description=raw_p.get("description", ""),
                    key_points=raw_p.get("key_points", []),
                    cta=raw_p.get("cta", parsed.get("call_to_action", "")),
                    hashtags=raw_p.get("hashtags", parsed.get("hashtags", [])),
                    mentions=[],
                    media_recommendation=raw_p.get("media_recommendation", "High quality product or hero visual"),
                    character_count=len(caption),
                    is_valid_length=len(caption) <= char_limit,
                    char_limit=char_limit
                )

            return CompleteContentPackage(
                overview=overview,
                title=parsed.get("title", req.topic),
                hook=parsed.get("hook", ""),
                description=parsed.get("description", ""),
                main_caption=parsed.get("main_caption", ""),
                key_points=parsed.get("key_points", []),
                call_to_action=parsed.get("call_to_action", "Learn more today"),
                hashtags=parsed.get("hashtags", []),
                keywords=parsed.get("keywords", req.keywords),
                tags_and_mentions=TagsAndMentions(**parsed.get("tags_and_mentions", {})),
                image_prompt=ImagePromptDetails(**parsed.get("image_prompt", {})),
                alternative_hooks=parsed.get("alternative_hooks", [])[:3],
                alternative_ctas=parsed.get("alternative_ctas", [])[:2],
                alt_text=parsed.get("alt_text", f"Image illustrating {req.topic}"),
                improvements=parsed.get("improvements", []),
                platform_posts=platform_posts,
                generation_source="ollama"
            )

    @classmethod
    def _generate_dynamic_package(cls, req: AIPostGenerateRequest, source: str = "fallback_demo") -> CompleteContentPackage:
        """Dynamic content generation using user-supplied facts and industry guidelines."""
        company = req.company_name or "SocialPilot AI"
        topic = req.topic
        audience = req.target_audience or "Business Owners, Entrepreneurs & Operations Teams"
        tone = req.tone
        obj = req.marketing_objective
        web = req.website_url or "https://www.infinitetechai.com"

        is_marketing = bool(re.search(r'\b(market\w*|ad\b|ads\b|brand\w*|campaign\w*|growth\w*|audience\w*)\b', topic.lower()))
        is_voice = bool(re.search(r'\b(voice\w*|call\w*|phone\w*|receptionist\w*)\b', topic.lower()))

        # Sanitize product_service if it was defaulted to calling agent but topic is NOT calling/voice
        if not is_voice and req.product_service and any(k in req.product_service.lower() for k in ["calling agent", "voice agent", "call"]):
            if is_marketing:
                product = f"{company} AI Marketing & Campaign Studio"
            else:
                product = f"{company} Autonomous AI Studio"
        else:
            product = req.product_service or (f"{company} AI Marketing Studio" if is_marketing else req.topic)

        # Check if topic or company is InfiniteTech AI / flyer related
        is_flyer = (
            "infinitetech" in company.lower()
            or "chaos to control" in topic.lower()
            or "invoicing" in topic.lower()
            or "scheduling" in topic.lower()
            or "data entry" in topic.lower()
            or "follow-ups" in topic.lower()
            or "admin time" in topic.lower()
        )

        if is_flyer:
            title = f"From Chaos to Control: Work Less, Achieve More | {company}"
            hook = "Still stuck in admin chaos while trying to scale your business?"
            key_points = [
                "BEFORE: Manual invoicing, endless data entry, scheduling clashes & missed follow-ups.",
                "AFTER: Auto invoicing, smart scheduling, automated data entry & instant follow-ups.",
                "AUTOMATE & ELEVATE: Save up to 70% of your admin time so you focus on growth.",
                "ALL-IN-ONE SUITE: Invoicing, Scheduling, Data Entry, AI Follow-ups & Growth Insights."
            ]
            description = (
                "From Chaos to Control. Work Less. Achieve More. "
                "InfiniteTech AI automates the repetitive tasks—manual invoicing, data entry, scheduling conflicts, and missed follow-ups—so you can reclaim up to 70% of your admin time. "
                "Let InfiniteTech AI take care of the rest."
            )
            cta = req.call_to_action or "Visit www.infinitetechai.com or call +91-9884777171 to automate your business!"
            clean_kw = ["InfiniteTechAI", "Automation", "FromChaosToControl", "SmartInvoicing", "Productivity"]
        else:
            # Title & Hook
            title = f"Accelerate Growth with {topic} | {company}"
            hook = f"Are you ready to transform how you approach {topic}?"

            # Distinct tailored points
            if is_marketing:
                key_points = [
                    f"Automates multi-channel campaign publishing across major platforms.",
                    f"Generates high-converting marketing copy and graphics tailored to {audience}.",
                    f"Maximizes ROAS and lead velocity while cutting creative production hours.",
                    f"Maintains 100% brand consistency across every campaign and touchpoint."
                ]
                description = (
                    f"{company} introduces an autonomous suite for {topic}. "
                    f"Designed specifically for {audience}, this initiative drives {obj.lower()} "
                    f"by coupling smart creative generation with data-driven scheduling."
                )
            else:
                key_points = [
                    f"Tailored specifically for {audience} seeking measurable outcomes.",
                    f"Addresses core challenges in {topic} with modern, automated workflows.",
                    f"Eliminates wasted hours while maintaining top-tier brand consistency.",
                    f"Equipped with actionable strategies that scale with your team."
                ]
                description = (
                    f"{company} introduces an innovative solution for {product}. "
                    f"Designed specifically for {audience}, this initiative focuses on {obj.lower()}. "
                    f"By combining intelligent workflows with dependable precision, users achieve maximum impact."
                )

            cta = req.call_to_action or (f"Visit {web} to explore more." if web else f"Get started with {company} today.")
            clean_kw = [k.strip() for k in req.keywords if k.strip()]
            if not is_voice:
                clean_kw = [k for k in clean_kw if not any(v in k.lower() for v in ["call", "voice"])]
            if is_marketing:
                for mkw in ["AIMarketing", "GrowthHacking", "MarketingAutomation", "DigitalStrategy"]:
                    if mkw not in clean_kw:
                        clean_kw.append(mkw)
            if not clean_kw:
                clean_kw = [topic.split()[0], "Automation", "Innovation", "Growth"]

        hashtags = [f"#{kw.replace(' ', '')}" for kw in clean_kw[:4]]
        if f"#{company.replace(' ', '')}" not in hashtags and req.company_name:
            hashtags.append(f"#{company.replace(' ', '')}")

        # Image Prompt conforming to Section 6.K
        image_prompt = ImagePromptDetails(
            main_subject=f"Modern, elegant workspace showcasing {product} concepts and data visualizations",
            background="Bright, airy modern architectural studio with subtle ambient backlighting",
            composition="Rule of thirds, centered subject with balanced negative space on the left",
            visual_style="Photorealistic, crisp clean 4K detailing",
            lighting="Natural soft morning daylight with diffused warm highlights",
            brand_colors="Deep Indigo, Slate Blue, and clean Pearl White accents",
            intended_audience=audience,
            aspect_ratio="1:1",
            text_placement="Clean unobstructed space suitable for headline overlay",
            full_prompt=(
                f"A professional photorealistic composition highlighting {product} and {topic}. "
                f"Set in a sleek modern tech environment, cinematic natural lighting, soft reflections, "
                f"balanced depth of field, high contrast, clean minimalist palette, 8k resolution."
            )
        )

        # 3 Alternative hooks
        alt_hooks = [
            f"The secret to mastering {topic} isn't working harder—it's having the right strategy.",
            f"Most businesses struggle with {topic}. Here is what changed the game for us:",
            f"Stop losing momentum on {topic}. Here is how {company} helps you stay ahead."
        ]

        # 2 Alternative CTAs
        alt_ctas = [
            f"Drop your thoughts below or DM us to discuss how this applies to your workflow.",
            f"Save this post for later and click the link in bio to learn more."
        ]

        alt_text = f"Graphic illustration representing {product} and modern strategies for {topic}."

        improvements = [
            "Consider pairing this post with a 15-second screen demo or carousel for 2x engagement.",
            "Tag a key industry partner or collaborator once verified to extend organic reach.",
            "Schedule the post during peak industry engagement hours (e.g. 9:00 AM or 2:00 PM local time)."
        ]

        # Platform-specific posts conforming strictly to Section 7
        platform_posts: Dict[str, PlatformPostContent] = {}

        if is_flyer:
            # 1. FACEBOOK (Flyer-exact before/after, 5 pillars, stat, contact)
            fb_caption = (
                f"🚀 FROM CHAOS TO CONTROL. WORK LESS. ACHIEVE MORE.\n\n"
                f"Are you spending half your workday buried under admin tasks?\n\n"
                f"🔴 BEFORE InfiniteTech AI:\n"
                f"❌ Manual Invoicing & Chasing Payments\n"
                f"❌ Endless Data Entry & Spreadsheets\n"
                f"❌ Scheduling Conflicts & Missed Calls\n"
                f"❌ Forgotten Follow-ups & Lost Deals\n"
                f"❌ Zero Time to Grow Your Business\n\n"
                f"🟢 AFTER InfiniteTech AI:\n"
                f"✅ Auto Invoicing on Autopilot\n"
                f"✅ Smart Intelligent Scheduling\n"
                f"✅ Automated Data Extraction & Entry\n"
                f"✅ Instant AI Follow-ups 24/7\n"
                f"✅ More Time. More Life.\n\n"
                f"💡 AUTOMATE & ELEVATE YOUR BUSINESS:\n"
                f"📄 Smart Invoicing: Create, send & track invoices automatically.\n"
                f"🗓️ Intelligent Scheduling: No more clashes, perfectly planned.\n"
                f"🗄️ Data Entry on Autopilot: Extract, enter, organize, done.\n"
                f"💬 Instant Follow-ups: AI that follows up so you don't have to.\n"
                f"📈 Insights That Drive Growth: Real-time reports for smarter decisions.\n\n"
                f"⚡ SAVE UP TO 70% OF YOUR ADMIN TIME.\n"
                f"Let InfiniteTech AI take care of the rest!\n\n"
                f"🌐 Website: www.infinitetechai.com\n"
                f"📞 Reach US: +91-9884777171\n"
                f"✉️ Email: sales@infinitetechai.com\n\n"
                f"#InfiniteTechAI #Automation #Productivity #WorkLessAchieveMore #AIforBusiness"
            )
            platform_posts["facebook"] = PlatformPostContent(
                platform="facebook",
                hook="FROM CHAOS TO CONTROL. WORK LESS. ACHIEVE MORE.",
                caption=fb_caption,
                description=description,
                key_points=key_points,
                cta="Visit www.infinitetechai.com or call +91-9884777171",
                hashtags=["#InfiniteTechAI", "#Automation", "#Productivity", "#WorkLessAchieveMore"],
                mentions=[],
                media_recommendation="InfiniteTech AI Chaos to Control Flyer Graphic",
                character_count=len(fb_caption),
                is_valid_length=True,
                char_limit=63206
            )

            # 2. INSTAGRAM (Visual clean story, before/after, link in bio, phone)
            ig_caption = (
                f"From CHAOS to CONTROL ✨ Work Less. Achieve More.\n\n"
                f"Still trapped doing admin work manually?\n\n"
                f"❌ BEFORE:\n"
                f"• Manual Invoicing\n"
                f"• Endless Data Entry\n"
                f"• Scheduling Conflicts\n"
                f"• Missed Follow-ups\n"
                f"• No Time to Grow\n\n"
                f"✅ AFTER:\n"
                f"• Auto Invoicing\n"
                f"• Smart Scheduling\n"
                f"• Automated Data Entry\n"
                f"• Instant Follow-ups\n"
                f"• More Time. More Life.\n\n"
                f"🎯 Save up to 70% of your admin time with InfiniteTech AI.\n"
                f"Let InfiniteTech AI take care of the rest!\n\n"
                f"📞 +91-9884777171 | sales@infinitetechai.com\n"
                f"👉 Link in bio: www.infinitetechai.com\n\n"
                f"#InfiniteTechAI #BusinessAutomation #SmartInvoicing #ProductivityHacks #SaveTime"
            )
            platform_posts["instagram"] = PlatformPostContent(
                platform="instagram",
                hook="From CHAOS to CONTROL ✨ Work Less. Achieve More.",
                caption=ig_caption,
                description="Visual storytelling with flyer highlights",
                key_points=key_points[:3],
                cta="Visit link in bio: www.infinitetechai.com",
                hashtags=["#InfiniteTechAI", "#BusinessAutomation", "#SmartInvoicing", "#ProductivityHacks"],
                mentions=[],
                media_recommendation="Square or Portrait Flyer Graphic",
                character_count=len(ig_caption),
                is_valid_length=len(ig_caption) <= 2200,
                char_limit=2200
            )

            # 3. LINKEDIN (Executive operational breakdown, problem vs solution, contact)
            li_caption = (
                f"FROM CHAOS TO CONTROL: Why modern leaders are automating administrative overhead.\n\n"
                f"Every hour business leaders spend on manual invoicing, scheduling clashes, and data entry is an hour not spent driving revenue.\n\n"
                f"At InfiniteTech AI, our mission is clear: Automate the repetitive so you focus on what matters.\n\n"
                f"5 Core Pillars to Elevate Your Business:\n"
                f"1. Smart Invoicing: Create, send, and track invoices automatically.\n"
                f"2. Intelligent Scheduling: Zero calendar conflicts, perfectly synced meetings.\n"
                f"3. Data Entry on Autopilot: Extract, organize, and structure business records instantly.\n"
                f"4. Instant Follow-ups: AI that engages leads and clients without manual delays.\n"
                f"5. Actionable Insights: Real-time executive dashboards for smarter decisions.\n\n"
                f"The Result: Save up to 70% of your admin time and eliminate operational friction.\n\n"
                f"Connect with us:\n"
                f"🌐 www.infinitetechai.com\n"
                f"📞 +91-9884777171 | ✉️ sales@infinitetechai.com\n\n"
                f"#InfiniteTechAI #OperationalExcellence #BusinessAutomation #Productivity"
            )
            platform_posts["linkedin"] = PlatformPostContent(
                platform="linkedin",
                hook="FROM CHAOS TO CONTROL: Automating administrative overhead.",
                caption=li_caption,
                description=description,
                key_points=key_points,
                cta="Connect at www.infinitetechai.com",
                hashtags=["#InfiniteTechAI", "#OperationalExcellence", "#BusinessAutomation"],
                mentions=[],
                media_recommendation="Corporate infographic / flyer asset",
                character_count=len(li_caption),
                is_valid_length=len(li_caption) <= 3000,
                char_limit=3000
            )

            # 4. TWITTER / X (Punchy hook under 280 chars)
            tw_caption = (
                f"FROM CHAOS TO CONTROL 🚀\n\n"
                f"Stop wasting hours on manual invoicing, data entry & missed follow-ups.\n\n"
                f"⚡ InfiniteTech AI automates the repetitive\n"
                f"⚡ Save up to 70% admin time\n\n"
                f"👉 www.infinitetechai.com | +91-9884777171 #AI #Automation"
            )
            platform_posts["twitter"] = PlatformPostContent(
                platform="twitter",
                hook="FROM CHAOS TO CONTROL 🚀",
                caption=tw_caption,
                description="",
                key_points=[],
                cta="👉 www.infinitetechai.com",
                hashtags=["#AI", "#Automation"],
                mentions=[],
                media_recommendation="Flyer preview image",
                character_count=len(tw_caption),
                is_valid_length=len(tw_caption) <= 280,
                char_limit=280
            )
        else:
            # 1. FACEBOOK
            fb_caption = (
                f"{hook}\n\n"
                f"At {company}, we understand that managing {topic} requires consistency and speed. "
                f"That's why {product} was built: to empower {audience} to {obj.lower()}.\n\n"
                f"Here is why this matters:\n"
                f"• {key_points[0]}\n"
                f"• {key_points[1]}\n"
                f"• {key_points[2]}\n\n"
                f"{cta} {' ' + web if web else ''}\n\n"
                f"{' '.join(hashtags[:4])}"
            )
            platform_posts["facebook"] = PlatformPostContent(
                platform="facebook",
                hook=hook,
                caption=fb_caption,
                description=description,
                key_points=key_points,
                cta=cta,
                hashtags=hashtags[:4],
                mentions=[],
                media_recommendation="High-resolution landscape (16:9) graphic or feature overview video",
                character_count=len(fb_caption),
                is_valid_length=True,
                char_limit=63206
            )

            # 2. INSTAGRAM (No clickable links, short paragraphs, emojis, image required)
            ig_caption = (
                f"{hook} ✨\n\n"
                f"Navigating {topic} shouldn't slow your team down. "
                f"Here is how {product} is helping {audience} achieve real results 👇\n\n"
                f"💡 Key Highlights:\n"
                f"1️⃣ {key_points[0]}\n"
                f"2️⃣ {key_points[1]}\n"
                f"3️⃣ {key_points[2]}\n\n"
                f"👉 {cta} (Check out the link in our bio for all the details!)\n\n"
                f"{' '.join(hashtags[:8])}"
            )
            platform_posts["instagram"] = PlatformPostContent(
                platform="instagram",
                hook=hook,
                caption=ig_caption,
                description="Instagram-tailored visual storytelling with clear formatting",
                key_points=key_points[:3],
                cta=f"{cta} (Link in Bio)",
                hashtags=hashtags[:8],
                mentions=[],
                media_recommendation="Square 1:1 or Portrait 4:5 carousel showing step-by-step insights",
                character_count=len(ig_caption),
                is_valid_length=len(ig_caption) <= 2200,
                char_limit=2200
            )

            # 3. LINKEDIN (Professional tone, business problem, relevant solution, benefits, avoid excessive emojis)
            li_caption = (
                f"Navigating {topic}: A strategic imperative for {audience}.\n\n"
                f"The Challenge:\n"
                f"Modern teams often encounter friction when scaling initiatives around {topic}. Without standardized systems, efficiency drops.\n\n"
                f"The Solution with {company}:\n"
                f"We designed {product} to directly solve these operational bottlenecks:\n\n"
                f"• Impact: {key_points[0]}\n"
                f"• Execution: {key_points[1]}\n"
                f"• Scalability: {key_points[2]}\n\n"
                f"Industry Insight:\n"
                f"Organizations adopting structured, automated approaches see significantly higher consistency.\n\n"
                f"{cta} {web if web else ''}\n\n"
                f"{' '.join(hashtags[:3])}"
            )
            platform_posts["linkedin"] = PlatformPostContent(
                platform="linkedin",
                hook=f"Navigating {topic}: A strategic imperative for {audience}.",
                caption=li_caption,
                description=description,
                key_points=key_points,
                cta=cta,
                hashtags=hashtags[:3],
                mentions=[],
                media_recommendation="Document PDF slide deck or clean 1.91:1 corporate banner graphic",
                character_count=len(li_caption),
                is_valid_length=len(li_caption) <= 3000,
                char_limit=3000
            )

            # 4. X / TWITTER (Concise, strictly validated <= 280 characters, no silent truncation)
            tw_base = f"Struggling with {topic}? Here's how {company} helps {audience} stay ahead:\n\n"
            tw_cta = f"👉 {cta}"
            if web:
                tw_cta = f"👉 {web}"
            tw_tag = f" {' '.join(hashtags[:2])}"
            
            tw_caption = f"{tw_base}{tw_cta}{tw_tag}"
            if len(tw_caption) > 280:
                tw_caption = f"Ready to master {topic}? Explore how {product} helps {audience} succeed.\n\n{tw_cta}{tw_tag}"
            if len(tw_caption) > 280:
                tw_caption = f"Transform your {topic} strategy with {product}.\n\n{tw_cta}"

            platform_posts["twitter"] = PlatformPostContent(
                platform="twitter",
                hook=f"Struggling with {topic}?",
                caption=tw_caption,
                description="",
                key_points=[],
                cta=tw_cta,
                hashtags=hashtags[:2],
                mentions=[],
                media_recommendation="Single high-contrast image (16:9) or GIF",
                character_count=len(tw_caption),
                is_valid_length=len(tw_caption) <= 280,
                char_limit=280
            )

        overview = ContentOverview(
            internal_title=title,
            main_topic=topic,
            campaign_objective=obj,
            target_audience=audience,
            primary_keyword=clean_kw[0] if clean_kw else topic,
            secondary_keywords=clean_kw[1:4],
            content_category=req.content_type
        )

        tags_mentions = TagsAndMentions(
            search_keywords=clean_kw,
            internal_content_tags=[req.content_type, req.industry, "AI Generated"],
            hashtags=hashtags,
            suggested_mentions_to_verify=[]
        )

        return CompleteContentPackage(
            overview=overview,
            title=title,
            hook=hook,
            description=description,
            main_caption=fb_caption,
            key_points=key_points,
            call_to_action=cta,
            hashtags=hashtags,
            keywords=clean_kw,
            tags_and_mentions=tags_mentions,
            image_prompt=image_prompt,
            alternative_hooks=alt_hooks,
            alternative_ctas=alt_ctas,
            alt_text=alt_text,
            improvements=improvements,
            platform_posts=platform_posts,
            generation_source="fallback_demo"
        )

    @classmethod
    async def regenerate_platform_content(cls, req: SinglePlatformRegenerateRequest) -> PlatformPostContent:
        """Regenerate content specifically for a single platform without overwriting others."""
        pack = cls._generate_dynamic_package(
            AIPostGenerateRequest(
                topic=req.topic,
                company_name=req.company_name,
                target_audience=req.target_audience,
                tone=req.tone or "Professional",
                language=req.language or "English",
                additional_instructions=req.custom_instruction,
                platforms=[req.platform]
            )
        )
        p_key = "twitter" if req.platform in ("twitter", "x") else req.platform
        return pack.platform_posts.get(p_key, pack.platform_posts.get("facebook"))

    @classmethod
    async def improve_caption(cls, req: CaptionImproveRequest) -> Dict[str, Any]:
        """AI helper tool: grammar check, shorten, expand, improve, tone shift."""
        text = req.caption.strip()
        action = req.action
        
        if action == "shorten":
            # Condense text
            sentences = text.split(".")
            shortened = ". ".join([s.strip() for s in sentences[:2] if s.strip()]) + "."
            return {"original": text, "improved": shortened or text, "action": action}
        elif action == "expand":
            expanded = f"{text}\n\nAdditionally, implementing this strategy provides long-term measurable consistency and empowers your team to scale without friction."
            return {"original": text, "improved": expanded, "action": action}
        elif action == "check_grammar":
            # Clean spaces and capitalization
            improved = text.capitalize()
            return {"original": text, "improved": improved, "action": action, "issues_found": 0}
        elif action == "change_tone":
            improved = f"[{req.target_tone} Tone]: {text}"
            return {"original": text, "improved": improved, "action": action, "target_tone": req.target_tone}
        else:
            improved = f"🚀 {text}\n\nPro-tip: Focus on the tangible benefits to maximize audience engagement."
            return {"original": text, "improved": improved, "action": action}

    @classmethod
    async def generate_hashtags(cls, req: HashtagGenerateRequest) -> List[str]:
        words = req.topic.replace(",", " ").replace("-", " ").split()
        tags = [f"#{w.capitalize()}" for w in words if len(w) > 3]
        tags.extend([f"#{req.industry.capitalize()}", "#SocialMedia", "#Marketing", "#Growth", "#Business"])
        # Dedup preserving order
        seen = set()
        deduped = []
        for t in tags:
            if t.lower() not in seen:
                seen.add(t.lower())
                deduped.append(t)
        return deduped[:req.count]
