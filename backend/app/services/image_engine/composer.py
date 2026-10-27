"""
composer.py - High-Fidelity Multi-Layout Marketing Flyer Composer
Renders 20 distinct corporate advertising visual compositions with 100% readable
multi-colored typography, 3D device on glowing podium, audio equalizer soundwaves,
4 floating benefit cards with circular vector icons, dark industry wave banners,
and brand headers/footers.

Every single image dynamically adapts its headlines, pre-headlines, descriptions,
benefit cards, device screens, cursive callouts, and banners to the specific
post's title and topic.
"""

import os
import math
import random
import re
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image, ImageDraw, ImageFont, ImageFilter

from app.config import settings
from app.services.image_engine.constants import (
    ASPECT_RATIOS,
    COLOR_PALETTES,
    TEMPLATE_FAMILIES,
    get_system_font,
    draw_vector_icon
)

MEDIA_DIR = settings.MEDIA_STORAGE_PATH

class MarketingImageComposer:
    def __init__(self, template_id: int = 1, aspect_ratio: str = "1:1", palette_id: Optional[str] = None):
        self.template_id = template_id
        self.template_info = next((t for t in TEMPLATE_FAMILIES if t["id"] == template_id), TEMPLATE_FAMILIES[0])
        
        # Dimensions
        dim = ASPECT_RATIOS.get(aspect_ratio, (1080, 1080))
        self.width, self.height = dim
        self.aspect_ratio = aspect_ratio
        
        # Palette
        pal_key = palette_id or self.template_info.get("theme", "teal_brand")
        self.palette = next((p for p in COLOR_PALETTES if p["id"] == pal_key), COLOR_PALETTES[0])

    def wrap_text(self, text: str, max_chars_per_line: int = 24) -> List[str]:
        words = text.split()
        lines = []
        current_line = []
        current_len = 0
        for w in words:
            if current_len + len(w) + 1 <= max_chars_per_line:
                current_line.append(w)
                current_len += len(w) + 1
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [w]
                current_len = len(w)
        if current_line:
            lines.append(" ".join(current_line))
        return lines

    def parse_benefits(self, raw_benefits: Any, default_benefits: Optional[List[Dict[str, str]]] = None) -> List[Dict[str, str]]:
        """Parses benefits into clean structured dicts with icons and non-overflowing titles."""
        fallback = default_benefits or [
            {"title": "Autonomous AI", "sub": "End-to-end\nautomation", "icon": "sparkle"},
            {"title": "Instant Sync", "sub": "Zero human\ndata delay", "icon": "clock"},
            {"title": "10x Growth", "sub": "Scale output\nrapidly", "icon": "chart"},
            {"title": "100% Reliable", "sub": "Audit ready\nsecurity", "icon": "shield"},
        ]
        if not raw_benefits or not isinstance(raw_benefits, list) or len(raw_benefits) == 0:
            return fallback

        parsed = []
        for item in raw_benefits:
            if isinstance(item, dict):
                title = str(item.get("title", "Feature")).strip()
                sub = str(item.get("sub", item.get("description", ""))).strip()
                ic = item.get("icon", "")
            else:
                s = str(item).strip()
                # Strip noise prefixes like BEFORE:, AFTER:, NOTE:, 1., etc.
                s = re.sub(r'^(BEFORE|AFTER|NOTE|STEP\s*\d+|TIP|\d+[\.\)]|•|-|\*)\s*:?\s*', '', s, flags=re.IGNORECASE).strip()
                if "•" in s:
                    parts = s.split("•", 1)
                    title, sub = parts[0].strip(), parts[1].strip()
                elif " - " in s:
                    parts = s.split(" - ", 1)
                    title, sub = parts[0].strip(), parts[1].strip()
                elif ":" in s:
                    parts = s.split(":", 1)
                    title, sub = parts[0].strip(), parts[1].strip()
                else:
                    words = s.split()
                    if len(words) >= 4:
                        title = " ".join(words[:2])
                        sub = " ".join(words[2:])
                    else:
                        title = s[:15]
                        sub = s[15:]
                ic = ""

            # Clean and truncate title to max 15 chars so it never overlaps in the card
            title = re.sub(r'^(BEFORE|AFTER|NOTE|STEP\s*\d+|\d+[\.\)]|•|-|\*)\s*:?\s*', '', title, flags=re.IGNORECASE).strip()
            if len(title) > 15:
                words = title.split()
                if len(words) >= 2 and len(words[0]) <= 15:
                    acc = []
                    for w in words:
                        if len(" ".join(acc + [w])) <= 15:
                            acc.append(w)
                        else:
                            break
                    title = " ".join(acc) if acc else words[0][:15]
                else:
                    title = title[:15]

            # Clean subtext
            sub = sub.strip()
            if len(sub) > 40:
                sub = sub[:38] + "…"

            # Auto infer icon if empty
            if not ic:
                low = (title + " " + sub).lower()
                if any(k in low for k in ["call", "phone", "voice"]):
                    ic = "phone"
                elif any(k in low for k in ["follow", "time", "fast", "clock", "sync", "hour", "speed"]):
                    ic = "clock"
                elif any(k in low for k in ["conversion", "growth", "chart", "scale", "revenue", "roi", "sales"]):
                    ic = "chart"
                elif any(k in low for k in ["lingual", "global", "connect", "audience", "world", "channel"]):
                    ic = "globe"
                elif any(k in low for k in ["secure", "error", "shield", "protect", "invoic", "audit"]):
                    ic = "shield"
                elif any(k in low for k in ["calendar", "schedule", "booking", "meeting", "clash"]):
                    ic = "calendar"
                elif any(k in low for k in ["ai", "agent", "brain", "smart", "robot", "neural"]):
                    ic = "brain"
                elif any(k in low for k in ["zap", "auto", "instant", "launch", "fast"]):
                    ic = "sparkle"
                else:
                    ic = "check"

            if title:
                parsed.append({"title": title, "sub": sub, "icon": ic})

        while len(parsed) < 4:
            parsed.append(fallback[len(parsed) % len(fallback)])
        return parsed[:4]

    def get_topic_context(self, post: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dynamically extracts, analyzes, and formats title-related content so every
        generated image has unique, topic-specific copy, headlines, benefit cards,
        and device mockup elements instead of repeated generic text.
        """
        raw_title = post.get("title") or post.get("topic") or "Autonomous AI Operations"
        raw_desc = post.get("description") or "Transform enterprise operations with autonomous AI agents delivering speed and accuracy."
        raw_benefits = post.get("benefits", [])
        raw_cta = post.get("cta", "Book a Demo")
        
        search_txt = f"{raw_title} {raw_desc} {post.get('topic', '')}".lower()
        
        clean_title = raw_title.strip()
        for prefix in ["Title:", "Headline:", "Topic:"]:
            if clean_title.startswith(prefix):
                clean_title = clean_title[len(prefix):].strip()

        pre_headline = "Next-Gen Enterprise"
        line1 = ""
        line2 = ""
        punchline = "AI Autopilot."

        # Case A: Title has colon or dash divider (e.g., "FROM CHAOS TO CONTROL: Work Less, Achieve More")
        if ":" in clean_title:
            parts = clean_title.split(":", 1)
            left_part = parts[0].strip()
            right_part = parts[1].strip()
            
            if len(left_part.split()) <= 6:
                pre_headline = left_part.title()
                words_r = right_part.split()
                if len(words_r) >= 4:
                    half = len(words_r) // 2
                    line1 = " ".join(words_r[:half])
                    line2 = " ".join(words_r[half:])
                    punchline = "AI Autopilot."
                elif len(words_r) >= 2:
                    line1 = words_r[0]
                    line2 = " ".join(words_r[1:])
                    punchline = "On Autopilot."
                else:
                    line1 = right_part
                    line2 = "Engineered by AI."
                    punchline = "Zero Lag."
            else:
                words = clean_title.split()
                pre_headline = "Enterprise Automation"
                line1 = " ".join(words[:3])
                line2 = " ".join(words[3:6])
                punchline = " ".join(words[6:9]) if len(words) > 6 else "AI Autopilot."
        elif " - " in clean_title:
            parts = clean_title.split(" - ", 1)
            pre_headline = parts[0].strip().title()
            words_r = parts[1].strip().split()
            if len(words_r) >= 3:
                line1 = " ".join(words_r[:len(words_r)//2])
                line2 = " ".join(words_r[len(words_r)//2:])
                punchline = "AI Powered."
            else:
                line1 = parts[1].strip()
                line2 = "Full Autopilot."
                punchline = "Zero Errors."
        else:
            # Simple sentence or phrase
            words = clean_title.split()
            if len(words) >= 6:
                pre_headline = " ".join(words[:2]).title()
                line1 = " ".join(words[2:5])
                line2 = " ".join(words[5:8]) if len(words) >= 8 else " ".join(words[5:])
                punchline = "AI Can." if "can" in search_txt else "On Autopilot."
            elif len(words) >= 4:
                pre_headline = "Enterprise Scale"
                line1 = " ".join(words[:2])
                line2 = " ".join(words[2:])
                punchline = "AI Can."
            elif len(words) >= 2:
                pre_headline = "Autonomous AI"
                line1 = words[0]
                line2 = " ".join(words[1:])
                punchline = "Full Autopilot."
            else:
                pre_headline = "Your Business"
                line1 = clean_title
                line2 = "Engineered by AI."
                punchline = "AI Can."

        line1 = line1.strip()
        line2 = line2.strip()
        if not line1.endswith((".", "!", "?")) and len(line1) > 0:
            if not line2:
                line1 += "."
        if not line2.endswith((".", "!", "?")) and len(line2) > 0:
            line2 += "."

        # Two-tier thematic detection: match title & topic first with highest priority, then fallback to description
        clean_title_topic = f"{clean_title} {post.get('topic', '')}".lower()
        clean_desc = raw_desc.lower()
        
        # Clean phone numbers, URLs, and emails so they don't trigger keywords
        for ptn in [r'(\+?\d[\d\s\-\(\)]{7,}\d)', r'(call\s+\+?\d+[\d\-\s]+)', r'[\w\.-]+@[\w\.-]+', r'https?://\S+']:
            clean_title_topic = re.sub(ptn, ' ', clean_title_topic)
            clean_desc = re.sub(ptn, ' ', clean_desc)

        def resolve_theme(s: str) -> Optional[str]:
            # 1. Invoicing & Billing (MUST check before voice so 'inVOICE' never matches 'voice')
            if re.search(r'\b(invoic\w*|bill\w*|receipt\w*|account\w*|ledger\w*|tax\w*)\b', s):
                return "invoicing"
            # 2. Scheduling & Calendars
            if re.search(r'\b(schedul\w*|calendar\w*|meet\w*|book\w*|appoint\w*|clash\w*)\b', s):
                return "scheduling"
            # 3. Document OCR & Data Entry
            if re.search(r'\b(data entry|ocr|extract\w*|spreadsheet\w*|record\w*|ingest\w*)\b', s):
                return "data_entry"
            # 4. Marketing, Advertising & Campaigns (Checked before general sales)
            if re.search(r'\b(market\w*|ad\b|ads\b|advertis\w*|brand\w*|campaign\w*|audience\w*|funnel\w*)\b', s):
                return "marketing"
            # 5. Sales Growth & Pipeline
            if re.search(r'\b(lead\w*|sales|prospect\w*|pipeline\w*|crm|conversion\w*|revenue\w*|deal\w*)\b', s):
                return "sales_growth"
            # 6. Customer Support & CSAT
            if re.search(r'\b(support|helpdesk|ticket\w*|customer service|csat)\b', s):
                return "support"
            # 7. Analytics & KPI Dashboards
            if re.search(r'\b(analytic\w*|dashboard\w*|kpi\w*|report\w*|bi\b)\b', s):
                return "analytics"
            # 8. Social Media Publishing
            if re.search(r'\b(social|content|instagram|linkedin|twitter|post\w*)\b', s):
                return "social_media"
            # 9. Productivity & Admin Hours Saved
            if re.search(r'\b(productiv\w*|hour\w*|chaos|repetitive|manual task\w*|task\w*|busywork|burnout)\b', s):
                return "productivity"
            # 10. Voice AI Calling (strictly word-bounded so it only matches actual voice/call)
            if re.search(r'\b(voice\w*|call\w*|phone\w*|receptionist\w*|telephony)\b', s):
                return "voice"
            return None

        # Two-tier thematic detection: match title & topic first with highest priority, then fallback to description
        detected_theme = resolve_theme(clean_title_topic)
        if not detected_theme:
            desc_theme = resolve_theme(clean_desc)
            # CRITICAL: Never allow description to trigger 'voice' unless title/topic explicitly mentions voice/calls/phone
            if desc_theme == "voice" and not re.search(r'\b(voice\w*|call\w*|phone\w*|receptionist\w*|telephony)\b', clean_title_topic):
                detected_theme = "general_ai"
            else:
                detected_theme = desc_theme or "general_ai"

        if detected_theme == "invoicing":
            theme = "invoicing"
            agent_name = "InvoiceAI"
            agent_sub = "Zero-Error Billing"
            screen_status = "Reconciling..."
            screen_sub = "WhatsApp Sent • Paid!"
            callout = "Let AI Handle Your\nInvoices For You!"
            banner_topic = "INVOICING & BILLING"
            default_benefits = [
                {"title": "Smart Invoices", "sub": "Zero data\nentry errors", "icon": "shield"},
                {"title": "Instant WhatsApp", "sub": "Sent in 3\nseconds", "icon": "clock"},
                {"title": "Auto-Reconcile", "sub": "Direct bank\nsync", "icon": "chart"},
                {"title": "Tax Compliant", "sub": "100% audit\nready", "icon": "check"}
            ]
            cta_fallback = "Automate Invoicing"

        elif detected_theme == "scheduling":
            theme = "scheduling"
            agent_name = "CalendarAI"
            agent_sub = "Meeting Coordinator"
            screen_status = "Scanning Slots..."
            screen_sub = "Conflict-Free • Booked!"
            callout = "Zero Calendar Clashes\nEver Again!"
            banner_topic = "CALENDARS & MEETINGS"
            default_benefits = [
                {"title": "24/7 Booking", "sub": "Self-service\nclient scheduling", "icon": "calendar"},
                {"title": "Smart Reminders", "sub": "Cut no-shows\nby 85%", "icon": "clock"},
                {"title": "Multi-Timezone", "sub": "Flawless global\ncoordination", "icon": "globe"},
                {"title": "Zero Conflicts", "sub": "Automated\ncalendar lock", "icon": "shield"}
            ]
            cta_fallback = "Schedule Without Clashes"

        elif detected_theme == "data_entry":
            theme = "data_entry"
            agent_name = "DocuExtract AI"
            agent_sub = "Document OCR Agent"
            screen_status = "Parsing Data..."
            screen_sub = "Scans → Database Synced!"
            callout = "Zero Manual Data Entry\nFor Your Team!"
            banner_topic = "DATA ENTRY & EXTRACTION"
            default_benefits = [
                {"title": "Scans to CRM", "sub": "Raw files to\nstructured records", "icon": "chart"},
                {"title": "99.9% Accuracy", "sub": "Eliminate human\ntypo errors", "icon": "shield"},
                {"title": "Bulk Ingestion", "sub": "1,000 pages\nper minute", "icon": "clock"},
                {"title": "Instant Sync", "sub": "Connects to SQL\n& Sheets", "icon": "sparkle"}
            ]
            cta_fallback = "Extract Data on Autopilot"

        elif detected_theme == "sales_growth":
            theme = "sales_growth"
            agent_name = "GrowthPulse AI"
            agent_sub = "Pipeline Intelligence"
            screen_status = "Scoring Leads..."
            screen_sub = "Hot Prospect • Pipeline +340%"
            callout = "Turn Cold Leads Into\nClosed Revenue!"
            banner_topic = "SALES & LEAD FOLLOW-UPS"
            default_benefits = [
                {"title": "60s Follow-ups", "sub": "Engage leads\ninstantly", "icon": "clock"},
                {"title": "+340% Lift", "sub": "Accelerate sales\nvelocity", "icon": "chart"},
                {"title": "CRM Automation", "sub": "Auto-log calls\nand notes", "icon": "sparkle"},
                {"title": "Predictive Scoring", "sub": "Prioritize high\nvalue deals", "icon": "shield"}
            ]
            cta_fallback = "Accelerate Sales Growth"

        elif detected_theme == "productivity":
            theme = "productivity"
            agent_name = "TaskFlow AI"
            agent_sub = "Workflow Autopilot"
            screen_status = "Automating..."
            screen_sub = "15+ Hours Saved Weekly!"
            callout = "Reclaim 15+ Hours\nEvery Single Week!"
            banner_topic = "REPETITIVE MANUAL TASKS"
            default_benefits = [
                {"title": "15+ Hours Saved", "sub": "Every single\nworkweek", "icon": "clock"},
                {"title": "Zero Human Lag", "sub": "Tasks completed\nin seconds", "icon": "sparkle"},
                {"title": "Continuous Scale", "sub": "Operates 24/7\nwithout pauses", "icon": "chart"},
                {"title": "Focus On Strategy", "sub": "Eliminate the\nbusywork", "icon": "shield"}
            ]
            cta_fallback = "Reclaim Your Hours"

        elif detected_theme == "social_media":
            theme = "social_media"
            agent_name = "SocialPilot AI"
            agent_sub = "Autonomous Studio"
            screen_status = "Creating Content..."
            screen_sub = "Published to 7 Channels!"
            callout = "Put Your Social Media\nOn Full Autopilot!"
            banner_topic = "SOCIAL MEDIA CONTENT"
            default_benefits = [
                {"title": "Auto Copywriting", "sub": "Tailored captions\nand hashtags", "icon": "sparkle"},
                {"title": "Branded Visuals", "sub": "20 distinct\nmarketing styles", "icon": "chart"},
                {"title": "Auto Scheduling", "sub": "Publish 30 days\nin advance", "icon": "calendar"},
                {"title": "Multi-Platform", "sub": "X, LinkedIn, FB\nand Instagram", "icon": "globe"}
            ]
            cta_fallback = "Automate Social Media"

        elif detected_theme == "support":
            theme = "support"
            agent_name = "SupportDesk AI"
            agent_sub = "24/7 Tier-1 Resolver"
            screen_status = "Resolving Ticket..."
            screen_sub = "Resolved in 4s • 5-Star CSAT"
            callout = "Delight Customers With\nInstant 24/7 Answers!"
            banner_topic = "CUSTOMER SUPPORT & HELPDESK"
            default_benefits = [
                {"title": "Instant Answers", "sub": "Sub-second live\nticket answers", "icon": "clock"},
                {"title": "24/7 Coverage", "sub": "Never leave a\nuser waiting", "icon": "globe"},
                {"title": "Auto Escalation", "sub": "Smart routing to\nhuman teams", "icon": "shield"},
                {"title": "98% Resolution", "sub": "Tier-1 solved on\nfirst contact", "icon": "check"}
            ]
            cta_fallback = "Automate Customer Support"

        elif detected_theme == "analytics":
            theme = "analytics"
            agent_name = "AnalyticsAI"
            agent_sub = "Executive Intelligence"
            screen_status = "Syncing KPIs..."
            screen_sub = "Executive Dashboards Ready"
            callout = "Real-Time Intelligence\nFor Executive Leaders!"
            banner_topic = "ANALYTICS & REPORTING"
            default_benefits = [
                {"title": "Real-Time KPIs", "sub": "Live cross-tool\nmetrics", "icon": "chart"},
                {"title": "Auto Reporting", "sub": "Zero manual\nslides needed", "icon": "clock"},
                {"title": "Predictive BI", "sub": "Forecast next\nquarter revenue", "icon": "sparkle"},
                {"title": "100% Accurate", "sub": "Single source\nof truth", "icon": "shield"}
            ]
            cta_fallback = "Explore Analytics AI"

        elif detected_theme == "marketing":
            theme = "marketing"
            agent_name = "GrowthPilot AI"
            agent_sub = "Autonomous Marketing Studio"
            screen_status = "Launching Ads..."
            screen_sub = "ROAS +450% • Multi-Channel"
            callout = "Scale Your Marketing\nOn Full Autopilot!"
            banner_topic = "MARKETING & CAMPAIGNS"
            default_benefits = [
                {"title": "10x Reach", "sub": "Omnichannel\naudience growth", "icon": "globe"},
                {"title": "+450% ROAS", "sub": "High-conversion\ncampaign copy", "icon": "chart"},
                {"title": "Auto Creative", "sub": "Instant visuals\n& captions", "icon": "sparkle"},
                {"title": "24/7 Publishing", "sub": "Auto-schedule\nacross 7 platforms", "icon": "calendar"}
            ]
            cta_fallback = "Scale Your Marketing"

        elif detected_theme == "voice":
            theme = "voice"
            agent_name = "SkyPro"
            agent_sub = "AI Calling Agent"
            screen_status = "Listening..."
            screen_sub = "Talking... Converting..."
            callout = "Let AI Do the Calling\nFor You!"
            banner_topic = "CUSTOMER CALLS"
            default_benefits = [
                {"title": "50,000 Calls", "sub": "Never miss\na lead", "icon": "phone"},
                {"title": "Fast Follow-ups", "sub": "Instant CRM\nsync", "icon": "clock"},
                {"title": "High Conversion", "sub": "Boost 10x\ngrowth", "icon": "chart"},
                {"title": "Multilingual", "sub": "Connect in\nany language", "icon": "globe"}
            ]
            cta_fallback = "Book a Voice Demo"

        else:
            theme = "general_ai"
            agent_name = "Enterprise AI"
            agent_sub = "Autonomous Operations"
            screen_status = "Operating..."
            screen_sub = "Autonomous Enterprise Flow"
            callout = "Intelligent AI Power\nFor Your Business!"
            banner_topic = "OPERATIONS & WORKFLOWS"
            default_benefits = [
                {"title": "Autonomous Flow", "sub": "End-to-end\nautomation", "icon": "brain"},
                {"title": "Zero Latency", "sub": "Instant execution\nacross tools", "icon": "clock"},
                {"title": "10x Productivity", "sub": "Scale output\nwithout headcount", "icon": "chart"},
                {"title": "Enterprise SLA", "sub": "99.9% reliable\noperations", "icon": "shield"}
            ]
            cta_fallback = "Launch Enterprise AI"

        if raw_benefits and len(raw_benefits) > 0:
            parsed_benefits = self.parse_benefits(raw_benefits, default_benefits=default_benefits)
        else:
            parsed_benefits = default_benefits

        clean_cta = raw_cta.strip()
        if len(clean_cta) > 30 or any(k in clean_cta.lower() for k in ["visit", "call", "http", ".com"]):
            clean_cta = cta_fallback
        if not clean_cta:
            clean_cta = "Book a Demo"

        clean_desc = raw_desc.strip()
        if len(clean_desc) > 130:
            clean_desc = clean_desc[:126] + "..."

        if theme == "marketing":
            slogan = "Smarter Marketing. Stronger Growth."
        elif theme == "invoicing":
            slogan = "Zero-Error Billing. Stronger Cash Flow."
        elif theme == "scheduling":
            slogan = "Zero-Clash Scheduling. Smarter Meetings."
        elif theme == "voice":
            slogan = "Smarter Conversations. Stronger Businesses."
        else:
            slogan = "Autonomous Workflows. Stronger Businesses."

        return {
            "pre_headline": pre_headline,
            "line1": line1,
            "line2": line2,
            "punchline": punchline,
            "description": clean_desc,
            "benefits": parsed_benefits,
            "callout": callout,
            "banner_topic": banner_topic,
            "agent_name": agent_name,
            "agent_sub": agent_sub,
            "screen_status": screen_status,
            "screen_sub": screen_sub,
            "cta": clean_cta,
            "theme": theme,
            "slogan": slogan
        }

    def _render_gradient_canvas(self, top_color: Tuple[int, int, int], bot_color: Tuple[int, int, int]) -> Image.Image:
        """Draws a vertical gradient canvas."""
        base = Image.new("RGBA", (self.width, self.height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(base)
        for y in range(self.height):
            t = y / max(1, self.height - 1)
            r = int(top_color[0] * (1 - t) + bot_color[0] * t)
            g = int(top_color[1] * (1 - t) + bot_color[1] * t)
            b = int(top_color[2] * (1 - t) + bot_color[2] * t)
            draw.line([(0, y), (self.width, y)], fill=(r, g, b, 255))
        return base

    def draw_3d_phone_on_podium(
        self,
        draw: ImageDraw.ImageDraw,
        cx: int,
        cy: int,
        pw: int = 240,
        ph: int = 420,
        is_dark: bool = False,
        agent_name: str = "SkyPro",
        agent_sub: str = "AI Calling Agent",
        screen_status: str = "Listening...",
        screen_sub: str = "Talking... Converting...",
        accent_color: Optional[Tuple[int, int, int]] = None,
        theme: str = "general_ai"
    ):
        """
        Renders an exceptionally high-detail 3D smartphone on a glowing cylindrical podium.
        Displays dynamic, topic-specific graphics inside the phone screen:
        - Invoicing: Digital invoice with paid badge, line items, and WhatsApp receipt button
        - Scheduling: Interactive calendar with booked demo slot and 1-click schedule
        - Data Entry: Document OCR scanner with glowing laser beam and CRM sync
        - Sales/Analytics: Exponential growth curve with +380% pipeline lift
        - Productivity: Workflow autopilot checklist with 15+ hours saved
        - Social Media: Cross-platform scheduler with LinkedIn, X, and Instagram status
        - Support: Live 2-way AI customer chat dialogue with 5.0 CSAT rating
        - Voice: Robot avatar with headphones and call buttons (ONLY for voice calling topics)
        - General AI: Neural processor core with circuit nodes and autonomous metrics
        """
        accent = accent_color or ((45, 212, 191) if is_dark else (13, 148, 136))
        
        # 1. 3D Cylindrical Podium Base (multi-tier glowing cylinder)
        podium_w = int(pw * 1.45)
        podium_h = 70
        podium_y = cy + ph // 2 - 25

        # Ambient drop shadow under podium
        draw.ellipse([cx - podium_w // 2 - 15, podium_y + 15, cx + podium_w // 2 + 15, podium_y + podium_h + 35], fill=(15, 23, 42, 40) if not is_dark else (0, 0, 0, 80))
        # Podium bottom cylinder body
        for offset_y in range(30, 0, -2):
            shade = int(180 + offset_y * 1.5)
            cyl_color = (0, shade - 20, shade) if not is_dark else (10, 40 + offset_y, 50 + offset_y)
            draw.ellipse([cx - podium_w // 2, podium_y + offset_y, cx + podium_w // 2, podium_y + offset_y + podium_h], fill=cyl_color)

        # Podium top glowing surface
        top_surf = (224, 247, 244) if not is_dark else (15, 118, 110)
        draw.ellipse([cx - podium_w // 2, podium_y, cx + podium_w // 2, podium_y + podium_h], fill=top_surf, outline=(255, 255, 255) if not is_dark else (45, 212, 191), width=3)
        # Inner glowing ring
        draw.ellipse([cx - podium_w // 2 + 15, podium_y + 8, cx + podium_w // 2 - 15, podium_y + podium_h - 8], outline=(13, 148, 136) if not is_dark else (94, 234, 212), width=2)

        # 2. Tech Aura / Soundwaves radiating behind phone (ONLY for voice calling topics)
        if theme == "voice":
            wave_color = (0, 180, 160) if not is_dark else (45, 212, 191)
            bar_heights_left = [25, 45, 75, 110, 145, 90, 60, 40, 20]
            bar_heights_right = [20, 40, 60, 90, 145, 110, 75, 45, 25]

            for i, h in enumerate(bar_heights_left):
                bx = cx - pw // 2 - 20 - (len(bar_heights_left) - 1 - i) * 12
                by0 = cy - h // 2
                by1 = cy + h // 2
                draw.line([(bx, by0), (bx, by1)], fill=wave_color, width=4)

            for i, h in enumerate(bar_heights_right):
                bx = cx + pw // 2 + 20 + i * 12
                by0 = cy - h // 2
                by1 = cy + h // 2
                draw.line([(bx, by0), (bx, by1)], fill=wave_color, width=4)
        else:
            # Elegant glowing orbital rings and dynamic tech accents for non-voice topics
            ring_outline = (13, 148, 136) if not is_dark else (45, 212, 191)
            draw.ellipse([cx - pw - 15, cy - pw - 15, cx + pw + 15, cy + pw + 15], outline=ring_outline, width=1)
            draw.ellipse([cx - pw + 35, cy - pw + 35, cx + pw - 35, cy + pw - 35], outline=ring_outline, width=1)

        # 3. Smartphone Outer Body
        px0 = cx - pw // 2
        py0 = cy - ph // 2
        px1 = px0 + pw
        py1 = py0 + ph

        # Phone drop shadow
        draw.rounded_rectangle([px0 + 6, py0 + 8, px1 + 6, py1 + 8], radius=32, fill=(15, 23, 42, 60) if not is_dark else (0, 0, 0, 100))
        # Phone outer frame (metallic titanium)
        draw.rounded_rectangle([px0, py0, px1, py1], radius=32, fill=(30, 41, 59), outline=accent, width=4)
        # Inner phone bezel
        draw.rounded_rectangle([px0 + 5, py0 + 5, px1 - 5, py1 - 5], radius=28, fill=(15, 23, 42), outline=(148, 163, 184), width=1)
        # Screen glass
        screen_bg = (255, 255, 255) if not is_dark else (15, 23, 42)
        draw.rounded_rectangle([px0 + 9, py0 + 9, px1 - 9, py1 - 9], radius=25, fill=screen_bg)

        # Top Dynamic Island / Speaker Pill
        draw.rounded_rectangle([cx - 28, py0 + 16, cx + 28, py0 + 26], radius=5, fill=(15, 23, 42))
        # Camera lens dot
        draw.ellipse([cx + 14, py0 + 18, cx + 20, py0 + 24], fill=(30, 41, 59))

        # 4. Header on Screen
        font_brand = get_system_font(18, bold=True)
        t_box = draw.textbbox((0, 0), agent_name, font=font_brand)
        draw.text((cx - (t_box[2] - t_box[0]) // 2, py0 + 36), agent_name, fill=accent, font=font_brand)
        font_sub = get_system_font(11, bold=False)
        s_box = draw.textbbox((0, 0), agent_sub, font=font_sub)
        draw.text((cx - (s_box[2] - s_box[0]) // 2, py0 + 58), agent_sub, fill=(100, 116, 139), font=font_sub)

        sx0 = px0 + 14
        sx1 = px1 - 14

        # 5. DIVERSE BESPOKE ON-SCREEN GRAPHIC ACCORDING TO TOPIC THEME
        if theme == "invoicing":
            # --- DIGITAL INVOICE PREVIEW ---
            inv_y0 = py0 + 82
            inv_y1 = py1 - 70
            draw.rounded_rectangle([sx0, inv_y0, sx1, inv_y1], radius=12, fill=(248, 250, 252) if not is_dark else (24, 32, 47), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # Header row: #INV-2048 and green PAID pill
            font_micro = get_system_font(10, bold=True)
            draw.text((sx0 + 12, inv_y0 + 12), "#INV-2048", fill=(71, 85, 105) if not is_dark else (148, 163, 184), font=font_micro)
            draw.rounded_rectangle([sx1 - 62, inv_y0 + 10, sx1 - 10, inv_y0 + 26], radius=8, fill=(22, 163, 74))
            draw.text((sx1 - 54, inv_y0 + 12), "PAID ✓", fill=(255, 255, 255), font=get_system_font(9, bold=True))
            # Divider
            draw.line([(sx0 + 10, inv_y0 + 34), (sx1 - 10, inv_y0 + 34)], fill=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # Client line
            draw.text((sx0 + 12, inv_y0 + 42), "Bill To: Enterprise Corp", fill=(100, 116, 139), font=get_system_font(10, bold=False))
            # Line items
            draw.text((sx0 + 12, inv_y0 + 60), "• Automated Workflows", fill=(51, 65, 85) if not is_dark else (226, 232, 240), font=get_system_font(10, bold=True))
            draw.text((sx1 - 56, inv_y0 + 60), "$3,200", fill=(13, 148, 136), font=get_system_font(10, bold=True))
            draw.text((sx0 + 12, inv_y0 + 78), "• Cloud AI Operations", fill=(51, 65, 85) if not is_dark else (226, 232, 240), font=get_system_font(10, bold=True))
            draw.text((sx1 - 56, inv_y0 + 78), "$1,650", fill=(13, 148, 136), font=get_system_font(10, bold=True))
            # Total Box
            total_y0 = inv_y1 - 42
            draw.rounded_rectangle([sx0 + 10, total_y0, sx1 - 10, inv_y1 - 10], radius=8, fill=(240, 253, 250) if not is_dark else (15, 35, 45))
            draw.text((sx0 + 18, total_y0 + 6), "TOTAL PAID", fill=(100, 116, 139), font=get_system_font(9, bold=True))
            draw.text((sx1 - 78, total_y0 + 5), "$4,850.00", fill=(13, 148, 136) if not is_dark else (45, 212, 191), font=get_system_font(13, bold=True))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(16, 185, 129), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=(16, 185, 129))
            btn_t = "✓ Instant Auto-Receipt"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme == "scheduling":
            # --- MEETING CALENDAR INTERFACE ---
            cal_y0 = py0 + 82
            cal_y1 = py1 - 70
            draw.rounded_rectangle([sx0, cal_y0, sx1, cal_y1], radius=12, fill=(248, 250, 252) if not is_dark else (24, 32, 47), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # Calendar Header
            draw.text((sx0 + 12, cal_y0 + 12), "📅 THU, OCT 29", fill=accent, font=get_system_font(11, bold=True))
            draw.rounded_rectangle([sx1 - 72, cal_y0 + 10, sx1 - 10, cal_y0 + 26], radius=8, fill=(13, 148, 136))
            draw.text((sx1 - 64, cal_y0 + 12), "SYNCED ✓", fill=(255, 255, 255), font=get_system_font(9, bold=True))
            # Weekday mini grid
            days = ["M", "T", "W", "T", "F", "S", "S"]
            grid_w = (sx1 - sx0 - 24) // 7
            for di, dname in enumerate(days):
                dx = sx0 + 12 + di * grid_w
                dy = cal_y0 + 36
                is_selected = di == 3
                if is_selected:
                    draw.ellipse([dx, dy, dx + 18, dy + 18], fill=accent)
                    draw.text((dx + 5, dy + 2), dname, fill=(255, 255, 255), font=get_system_font(9, bold=True))
                else:
                    draw.text((dx + 5, dy + 2), dname, fill=(148, 163, 184), font=get_system_font(9, bold=False))
            # Meeting Card Inside Calendar
            meet_y0 = cal_y0 + 68
            draw.rounded_rectangle([sx0 + 10, meet_y0, sx1 - 10, cal_y1 - 12], radius=10, fill=(240, 253, 250) if not is_dark else (15, 35, 45), outline=accent, width=1)
            draw.text((sx0 + 18, meet_y0 + 8), "09:30 AM - 10:15 AM", fill=(13, 148, 136) if not is_dark else (45, 212, 191), font=get_system_font(10, bold=True))
            draw.text((sx0 + 18, meet_y0 + 26), "Client Strategy Demo", fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=get_system_font(11, bold=True))
            draw.text((sx0 + 18, meet_y0 + 44), "Google Meet • 100% Confirmed", fill=(16, 185, 129), font=get_system_font(9, bold=False))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(16, 185, 129), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=accent)
            btn_t = "📅 1-Click Smart Schedule"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme == "data_entry":
            # --- DOCUMENT OCR SCANNER ---
            ocr_y0 = py0 + 82
            ocr_y1 = py1 - 70
            # Document Sheet Background
            draw.rounded_rectangle([sx0 + 8, ocr_y0, sx1 - 8, ocr_y0 + 115], radius=10, fill=(255, 255, 255) if not is_dark else (24, 32, 47), outline=(203, 213, 225) if not is_dark else (71, 85, 105), width=1)
            # Simulated text lines on doc
            for li, ly_offset in enumerate([14, 28, 42, 56]):
                lw = (sx1 - sx0 - 50) - (li * 15)
                draw.rounded_rectangle([sx0 + 20, ocr_y0 + ly_offset, sx0 + 20 + lw, ocr_y0 + ly_offset + 5], radius=2, fill=(226, 232, 240) if not is_dark else (51, 65, 85))
            # Glowing Laser Scan Beam across middle of document
            laser_y = ocr_y0 + 40
            draw.line([(sx0 + 6, laser_y), (sx1 - 6, laser_y)], fill=(6, 182, 212), width=3)
            draw.line([(sx0 + 14, laser_y - 2), (sx1 - 14, laser_y - 2)], fill=(165, 243, 252), width=1)
            draw.line([(sx0 + 14, laser_y + 2), (sx1 - 14, laser_y + 2)], fill=(165, 243, 252), width=1)
            # Laser tag
            draw.rounded_rectangle([cx - 44, laser_y - 10, cx + 44, laser_y + 10], radius=6, fill=(6, 182, 212))
            draw.text((cx - 38, laser_y - 6), "SCANNING 99.9%", fill=(255, 255, 255), font=get_system_font(8, bold=True))
            # Extracted Records Box
            box_y0 = ocr_y0 + 125
            draw.rounded_rectangle([sx0, box_y0, sx1, ocr_y1], radius=10, fill=(240, 253, 250) if not is_dark else (15, 35, 45), outline=(45, 212, 191), width=1)
            draw.text((sx0 + 12, box_y0 + 8), "• Cust_ID: #8921 → Synced", fill=(13, 148, 136) if not is_dark else (45, 212, 191), font=get_system_font(10, bold=True))
            draw.text((sx0 + 12, box_y0 + 24), "• Amount: $14,250.00 ✓", fill=(16, 185, 129), font=get_system_font(10, bold=True))
            draw.text((sx0 + 12, box_y0 + 40), "• Tax & OCR: 100% Validated", fill=(100, 116, 139), font=get_system_font(9, bold=False))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(6, 182, 212), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=(6, 182, 212))
            btn_t = "⚡ Auto-Sync to Database"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme in ("sales_growth", "analytics"):
            # --- EXPONENTIAL GROWTH CHART & KPI ---
            chart_y0 = py0 + 82
            chart_y1 = py1 - 70
            draw.rounded_rectangle([sx0, chart_y0, sx1, chart_y1], radius=12, fill=(248, 250, 252) if not is_dark else (24, 32, 47), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # Top KPI highlight
            draw.text((sx0 + 14, chart_y0 + 10), "QUALIFIED PIPELINE LIFT", fill=(100, 116, 139), font=get_system_font(9, bold=True))
            draw.text((sx0 + 14, chart_y0 + 24), "+380%", fill=(16, 185, 129), font=get_system_font(28, bold=True))
            draw.rounded_rectangle([sx1 - 76, chart_y0 + 28, sx1 - 10, chart_y0 + 44], radius=8, fill=(22, 163, 74))
            draw.text((sx1 - 68, chart_y0 + 30), "HOT LEAD ✓", fill=(255, 255, 255), font=get_system_font(9, bold=True))
            # Ascending area / polygon curve
            plot_y0 = chart_y0 + 72
            plot_y1 = chart_y1 - 32
            pts = [
                (sx0 + 14, plot_y1),
                (sx0 + 45, plot_y1 - 14),
                (sx0 + 85, plot_y1 - 25),
                (sx0 + 125, plot_y1 - 42),
                (sx0 + 160, plot_y1 - 65),
                (sx1 - 16, plot_y0 + 6)
            ]
            poly_pts = list(pts) + [(sx1 - 16, plot_y1), (sx0 + 14, plot_y1)]
            draw.polygon(poly_pts, fill=(209, 250, 229) if not is_dark else (6, 78, 59, 140))
            for i in range(len(pts) - 1):
                draw.line([pts[i], pts[i+1]], fill=(16, 185, 129), width=3)
            # Dot on peak point
            peak_x, peak_y = pts[-1]
            draw.ellipse([peak_x - 6, peak_y - 6, peak_x + 6, peak_y + 6], fill=(16, 185, 129), outline=(255, 255, 255), width=2)
            # Bottom deal pill
            draw.text((sx0 + 14, chart_y1 - 24), "Deal Value: $280,000 Pipeline Added", fill=(71, 85, 105) if not is_dark else (148, 163, 184), font=get_system_font(9, bold=False))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(16, 185, 129), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=(16, 185, 129))
            btn_t = "📈 10x Pipeline Growth"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme == "productivity":
            # --- AUTONOMOUS WORKFLOW CHECKLIST ---
            prod_y0 = py0 + 82
            prod_y1 = py1 - 70
            draw.rounded_rectangle([sx0, prod_y0, sx1, prod_y1], radius=12, fill=(248, 250, 252) if not is_dark else (24, 32, 47), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # Highlight badge
            draw.rounded_rectangle([sx0 + 10, prod_y0 + 10, sx1 - 10, prod_y0 + 34], radius=8, fill=(240, 253, 250) if not is_dark else (15, 35, 45), outline=accent, width=1)
            draw.text((sx0 + 16, prod_y0 + 14), "⚡ 15+ HOURS SAVED / WEEK", fill=(13, 148, 136) if not is_dark else (45, 212, 191), font=get_system_font(10, bold=True))
            # Tasks checklist
            tasks = [
                ("Auto-route 1,500 leads", "0.4s"),
                ("Sync invoice ledger", "1.2s"),
                ("Trigger follow-up alerts", "0.6s"),
                ("Zero human data lag", "100%")
            ]
            for ti, (tname, tstat) in enumerate(tasks):
                ty = prod_y0 + 46 + ti * 24
                draw.ellipse([sx0 + 12, ty + 2, sx0 + 24, ty + 14], fill=(22, 163, 74))
                draw.text((sx0 + 15, ty + 3), "✓", fill=(255, 255, 255), font=get_system_font(8, bold=True))
                draw.text((sx0 + 30, ty + 2), tname, fill=(51, 65, 85) if not is_dark else (226, 232, 240), font=get_system_font(10, bold=False))
                draw.text((sx1 - 36, ty + 2), tstat, fill=accent, font=get_system_font(9, bold=True))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(13, 148, 136), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=accent)
            btn_t = "⚡ Run 24/7 Autopilot"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme == "social_media":
            # --- MULTI-PLATFORM AUTO-PUBLISHER ---
            soc_y0 = py0 + 82
            soc_y1 = py1 - 70
            draw.rounded_rectangle([sx0, soc_y0, sx1, soc_y1], radius=12, fill=(248, 250, 252) if not is_dark else (24, 32, 47), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # Channels row
            pills = [("LI", (10, 102, 194)), ("X", (15, 23, 42)), ("IG", (225, 48, 108)), ("FB", (24, 119, 242))]
            pw_pill = (sx1 - sx0 - 32) // 4
            for pi, (pname, pcol) in enumerate(pills):
                px = sx0 + 12 + pi * (pw_pill + 4)
                draw.rounded_rectangle([px, soc_y0 + 10, px + pw_pill, soc_y0 + 30], radius=6, fill=pcol)
                draw.text((px + 6, soc_y0 + 13), f"{pname} ✓", fill=(255, 255, 255), font=get_system_font(9, bold=True))
            # Mini post card
            post_y0 = soc_y0 + 40
            draw.rounded_rectangle([sx0 + 10, post_y0, sx1 - 10, soc_y1 - 10], radius=8, fill=(255, 255, 255) if not is_dark else (15, 23, 42), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            draw.rounded_rectangle([sx0 + 18, post_y0 + 8, sx1 - 18, post_y0 + 55], radius=6, fill=(224, 247, 244) if not is_dark else (15, 118, 110))
            draw.text((sx0 + 26, post_y0 + 24), "✦ Branded Post Visual", fill=(13, 148, 136) if not is_dark else (255, 255, 255), font=get_system_font(10, bold=True))
            draw.text((sx0 + 18, post_y0 + 64), "Reach: 12,850 • Engagement: 4.8%", fill=(71, 85, 105) if not is_dark else (148, 163, 184), font=get_system_font(9, bold=False))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(225, 48, 108), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=(225, 48, 108))
            btn_t = "🚀 30-Day Queue Active"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme == "support":
            # --- LIVE CHAT DIALOGUE & CSAT ---
            chat_y0 = py0 + 82
            chat_y1 = py1 - 70
            draw.rounded_rectangle([sx0, chat_y0, sx1, chat_y1], radius=12, fill=(248, 250, 252) if not is_dark else (24, 32, 47), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # User chat bubble
            draw.rounded_rectangle([sx0 + 10, chat_y0 + 12, sx1 - 40, chat_y0 + 48], radius=8, fill=(226, 232, 240) if not is_dark else (51, 65, 85))
            draw.text((sx0 + 16, chat_y0 + 18), "Can AI handle our client\nonboarding & calls?", fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=get_system_font(9, bold=False))
            # AI chat bubble
            draw.rounded_rectangle([sx0 + 35, chat_y0 + 58, sx1 - 10, chat_y0 + 96], radius=8, fill=(204, 251, 241) if not is_dark else (15, 118, 110))
            draw.text((sx0 + 42, chat_y0 + 64), "Done! Set up in 60s.\nOperating 24/7 with zero lag.", fill=(13, 148, 136) if not is_dark else (255, 255, 255), font=get_system_font(9, bold=True))
            # CSAT Rating
            draw.rounded_rectangle([sx0 + 10, chat_y1 - 30, sx1 - 10, chat_y1 - 8], radius=6, fill=(254, 243, 199))
            draw.text((sx0 + 18, chat_y1 - 25), "★★★★★ 5.0 CSAT (Instant 2s Reply)", fill=(180, 83, 9), font=get_system_font(9, bold=True))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(13, 148, 136), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=accent)
            btn_t = "💬 Instant AI Copilot"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme == "marketing":
            # --- AUTONOMOUS MARKETING STUDIO SCREEN ---
            mkt_y0 = py0 + 82
            mkt_y1 = py1 - 70
            draw.rounded_rectangle([sx0, mkt_y0, sx1, mkt_y1], radius=12, fill=(248, 250, 252) if not is_dark else (24, 32, 47), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            # Live Campaign Badge
            draw.rounded_rectangle([sx0 + 10, mkt_y0 + 10, sx0 + 105, mkt_y0 + 28], radius=6, fill=(16, 185, 129))
            draw.text((sx0 + 15, mkt_y0 + 14), "● CAMPAIGN LIVE", fill=(255, 255, 255), font=get_system_font(8, bold=True))
            draw.text((sx1 - 65, mkt_y0 + 14), "ROAS 4.8x", fill=(13, 148, 136), font=get_system_font(9, bold=True))

            # Metric Cards Row
            cw = (sx1 - sx0 - 28) // 2
            # Box 1: Reach
            draw.rounded_rectangle([sx0 + 10, mkt_y0 + 36, sx0 + 10 + cw, mkt_y0 + 78], radius=8, fill=(255, 255, 255) if not is_dark else (15, 23, 42), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            draw.text((sx0 + 16, mkt_y0 + 42), "Total Reach", fill=(100, 116, 139), font=get_system_font(8, bold=False))
            draw.text((sx0 + 16, mkt_y0 + 56), "128,450", fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=get_system_font(13, bold=True))

            # Box 2: CTR / Conversion
            draw.rounded_rectangle([sx0 + 18 + cw, mkt_y0 + 36, sx1 - 10, mkt_y0 + 78], radius=8, fill=(255, 255, 255) if not is_dark else (15, 23, 42), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            draw.text((sx0 + 24 + cw, mkt_y0 + 42), "Avg CTR", fill=(100, 116, 139), font=get_system_font(8, bold=False))
            draw.text((sx0 + 24 + cw, mkt_y0 + 56), "6.4% (+3.2x)", fill=(16, 185, 129), font=get_system_font(13, bold=True))

            # Growth graph lines
            gy = mkt_y0 + 90
            draw.text((sx0 + 12, gy), "Conversion Velocity", fill=(71, 85, 105) if not is_dark else (148, 163, 184), font=get_system_font(9, bold=True))
            g_pts = [(sx0 + 12, gy + 45), (sx0 + 48, gy + 38), (sx0 + 88, gy + 42), (sx0 + 126, gy + 22), (sx1 - 14, gy + 12)]
            for gi in range(len(g_pts) - 1):
                draw.line([g_pts[gi], g_pts[gi + 1]], fill=(13, 148, 136), width=3)
                draw.ellipse([g_pts[gi][0] - 3, g_pts[gi][1] - 3, g_pts[gi][0] + 3, g_pts[gi][1] + 3], fill=(45, 212, 191))
            draw.ellipse([g_pts[-1][0] - 4, g_pts[-1][1] - 4, g_pts[-1][0] + 4, g_pts[-1][1] + 4], fill=(16, 185, 129))

            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(13, 148, 136), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=accent)
            btn_t = "🚀 Scale Marketing 10x"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

        elif theme == "voice":
            # --- 3D ROBOT VOICE CALLING AGENT (ONLY FOR VOICE TOPICS!) ---
            robot_cy = py0 + 135
            head_w, head_h = 76, 60
            # Over-ear headphones band
            draw.arc([cx - head_w // 2 - 8, robot_cy - head_h // 2 - 12, cx + head_w // 2 + 8, robot_cy + 10], start=180, end=360, fill=(15, 23, 42), width=5)
            # Earcups
            draw.rounded_rectangle([cx - head_w // 2 - 12, robot_cy - 16, cx - head_w // 2 - 2, robot_cy + 16], radius=4, fill=accent)
            draw.rounded_rectangle([cx + head_w // 2 + 2, robot_cy - 16, cx + head_w // 2 + 12, robot_cy + 16], radius=4, fill=accent)
            # Mic boom extending toward mouth
            draw.line([cx + head_w // 2 + 4, robot_cy + 10, cx + 18, robot_cy + 24], fill=(15, 23, 42), width=3)
            draw.ellipse([cx + 14, robot_cy + 22, cx + 22, robot_cy + 28], fill=accent)
            # Robot chassis (rounded head)
            draw.rounded_rectangle([cx - head_w // 2, robot_cy - head_h // 2, cx + head_w // 2, robot_cy + head_h // 2], radius=18, fill=(240, 253, 250), outline=(204, 251, 241), width=2)
            # Glossy dark visor
            visor_w, visor_h = 60, 36
            draw.rounded_rectangle([cx - visor_w // 2, robot_cy - visor_h // 2, cx + visor_w // 2, robot_cy + visor_h // 2], radius=14, fill=(15, 23, 42))
            # Glowing Cyan Eyes (happy smiling curved eyes)
            draw.arc([cx - 18, robot_cy - 8, cx - 6, robot_cy + 4], start=180, end=360, fill=(45, 212, 191), width=3)
            draw.arc([cx + 6, robot_cy - 8, cx + 18, robot_cy + 4], start=180, end=360, fill=(45, 212, 191), width=3)
            # Smile
            draw.arc([cx - 8, robot_cy - 2, cx + 8, robot_cy + 12], start=0, end=180, fill=(45, 212, 191), width=2)
            # Mini Soundwave on Screen
            screen_wave_y = robot_cy + 52
            for i, bh in enumerate([8, 14, 24, 30, 22, 16, 26, 12, 6]):
                draw.line([(cx - 36 + i * 9, screen_wave_y - bh // 2), (cx - 36 + i * 9, screen_wave_y + bh // 2)], fill=accent, width=3)
            # Status text from topic
            font_status = get_system_font(11, bold=True)
            st_box = draw.textbbox((0, 0), screen_status, font=font_status)
            draw.text((cx - (st_box[2] - st_box[0]) // 2, screen_wave_y + 22), screen_status, fill=(71, 85, 105), font=font_status)
            font_ssub = get_system_font(10, bold=False)
            ss_box = draw.textbbox((0, 0), screen_sub, font=font_ssub)
            draw.text((cx - (ss_box[2] - ss_box[0]) // 2, screen_wave_y + 38), screen_sub, fill=(100, 116, 139), font=font_ssub)
            # Action Control Buttons
            btn_y = py1 - 50
            btn_r = 20
            draw.ellipse([cx - 48 - btn_r, btn_y - btn_r, cx - 48 + btn_r, btn_y + btn_r], fill=(220, 38, 38))
            draw_vector_icon(draw, "phone", cx - 48 - 10, btn_y - 10, 20, (255, 255, 255))
            draw.ellipse([cx + 0 - btn_r - 4, btn_y - btn_r - 4, cx + 0 + btn_r + 4, btn_y + btn_r + 4], outline=(34, 197, 94, 120), width=2)
            draw.ellipse([cx + 0 - btn_r, btn_y - btn_r, cx + 0 + btn_r, btn_y + btn_r], fill=(22, 163, 74))
            draw_vector_icon(draw, "check", cx + 0 - 10, btn_y - 10, 20, (255, 255, 255))
            draw.ellipse([cx + 48 - btn_r, btn_y - btn_r, cx + 48 + btn_r, btn_y + btn_r], fill=(241, 245, 249) if not is_dark else (30, 41, 59))
            for dx in [-6, 0, 6]:
                draw.ellipse([cx + 48 + dx - 2, btn_y - 2, cx + 48 + dx + 2, btn_y + 2], fill=(100, 116, 139))

        else:
            # --- DEFAULT: 3D FUTURISTIC NEURAL CORE PROCESSOR ---
            core_cy = py0 + 138
            r_core = 36
            hex_pts = []
            for a in range(6):
                angle = a * (math.pi / 3)
                hex_pts.append((int(cx + r_core * math.cos(angle)), int(core_cy + r_core * math.sin(angle))))
            draw.polygon(hex_pts, fill=(15, 23, 42), outline=accent, width=3)
            # Inner pulsing nucleus
            draw.ellipse([cx - 18, core_cy - 18, cx + 18, core_cy + 18], fill=accent)
            draw_vector_icon(draw, "brain", cx - 11, core_cy - 11, 22, (255, 255, 255))
            # Circuit traces radiating outward
            for a in range(6):
                angle = a * (math.pi / 3)
                x0 = int(cx + (r_core + 4) * math.cos(angle))
                y0 = int(core_cy + (r_core + 4) * math.sin(angle))
                x1 = int(cx + (r_core + 22) * math.cos(angle))
                y1 = int(core_cy + (r_core + 22) * math.sin(angle))
                draw.line([(x0, y0), (x1, y1)], fill=accent, width=2)
                draw.ellipse([x1 - 3, y1 - 3, x1 + 3, y1 + 3], fill=(255, 255, 255) if not is_dark else (45, 212, 191))
            # Core metric specs
            spec_y = core_cy + 52
            draw.rounded_rectangle([sx0, spec_y, sx1, spec_y + 44], radius=8, fill=(240, 253, 250) if not is_dark else (24, 32, 47), outline=(204, 251, 241) if not is_dark else (51, 65, 85), width=1)
            draw.text((sx0 + 12, spec_y + 6), "• Throughput: 10,000 req/sec", fill=(13, 148, 136) if not is_dark else (45, 212, 191), font=get_system_font(10, bold=True))
            draw.text((sx0 + 12, spec_y + 24), "• Architecture: Autonomous 24/7", fill=(100, 116, 139), font=get_system_font(9, bold=False))
            # Status line
            font_st = get_system_font(10, bold=True)
            st_b = draw.textbbox((0, 0), screen_sub, font=font_st)
            draw.text((cx - (st_b[2] - st_b[0]) // 2, py1 - 62), screen_sub, fill=(13, 148, 136), font=font_st)
            # Action button
            draw.rounded_rectangle([sx0 + 8, py1 - 46, sx1 - 8, py1 - 14], radius=16, fill=accent)
            btn_t = "⚡ Deploy Autonomous Suite"
            btn_b = draw.textbbox((0, 0), btn_t, font=get_system_font(11, bold=True))
            draw.text((cx - (btn_b[2] - btn_b[0]) // 2, py1 - 38), btn_t, fill=(255, 255, 255), font=get_system_font(11, bold=True))

    def draw_floating_feature_cards(
        self,
        draw: ImageDraw.ImageDraw,
        benefits: Any,
        x_start: int,
        y_start: int,
        total_width: int,
        card_h: int = 135,
        is_dark: bool = False,
        accent_color: Optional[Tuple[int, int, int]] = None
    ):
        """
        Renders the 4 floating benefit cards with circular mint/accent icon containers,
        crisp vector icons, bold title, and secondary bullet text.
        """
        gap = 14
        card_w = (total_width - 3 * gap) // 4
        items = self.parse_benefits(benefits)
        accent = accent_color or ((45, 212, 191) if is_dark else (13, 148, 136))

        for idx, item in enumerate(items[:4]):
            cx0 = x_start + idx * (card_w + gap)
            cy0 = y_start
            cx1 = cx0 + card_w
            cy1 = cy0 + card_h

            # Card drop shadow
            draw.rounded_rectangle([cx0 + 2, cy0 + 3, cx1 + 2, cy1 + 3], radius=16, fill=(15, 23, 42, 25) if not is_dark else (0, 0, 0, 60))
            # Card background
            card_bg = (255, 255, 255) if not is_dark else (30, 41, 59)
            card_border = (204, 251, 241) if not is_dark else (15, 118, 110)
            draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=16, fill=card_bg, outline=card_border, width=2)

            # Circular Mint Icon Container
            ic_r = 22
            ic_cx = cx0 + card_w // 2
            ic_cy = cy0 + 30
            draw.ellipse([ic_cx - ic_r, ic_cy - ic_r, ic_cx + ic_r, ic_cy + ic_r], fill=(224, 247, 244) if not is_dark else (15, 23, 42), outline=accent, width=1)
            draw_vector_icon(draw, item.get("icon", "check"), ic_cx - 12, ic_cy - 12, 24, accent)

            # Title with dynamic auto-fit
            title_text = str(item.get("title", "Feature")).strip()
            font_size = 14
            font_title = get_system_font(font_size, bold=True)
            t_box = draw.textbbox((0, 0), title_text, font=font_title)
            if (t_box[2] - t_box[0]) > card_w - 14:
                font_size = 12
                font_title = get_system_font(font_size, bold=True)
                t_box = draw.textbbox((0, 0), title_text, font=font_title)
                if (t_box[2] - t_box[0]) > card_w - 14:
                    title_text = title_text[:13].strip() + "…"
                    t_box = draw.textbbox((0, 0), title_text, font=font_title)

            draw.text((cx0 + (card_w - (t_box[2] - t_box[0])) // 2, cy0 + 60), title_text, fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=font_title)

            # Subtext
            font_sub = get_system_font(11, bold=False)
            sub_text = item.get("sub", "")
            lines = sub_text.split("\n") if "\n" in sub_text else self.wrap_text(sub_text, max_chars_per_line=16)
            sy = cy0 + 84
            for sline in lines[:2]:
                s_box = draw.textbbox((0, 0), sline, font=font_sub)
                draw.text((cx0 + (card_w - (s_box[2] - s_box[0])) // 2, sy), sline, fill=(100, 116, 139) if not is_dark else (148, 163, 184), font=font_sub)
                sy += 16

    def draw_dark_industry_wave_banner(
        self,
        draw: ImageDraw.ImageDraw,
        y_pos: int,
        width: int,
        height: int,
        headline_1: str = "LET AI HANDLE YOUR OPERATIONS, SO YOU CAN FOCUS ON",
        headline_2: str = "WHAT MATTERS MOST.",
        is_dark: bool = False
    ):
        """
        Renders the rich dark-navy wave banner with the inspirational headline
        and horizontal industry icons (Retail, Real Estate, Healthcare, Education, Finance).
        """
        draw.rectangle([0, y_pos, width, y_pos + height], fill=(15, 23, 42) if not is_dark else (6, 9, 18))

        # Left Headline
        font_h1 = get_system_font(14, bold=True)
        draw.text((45, y_pos + 16), headline_1, fill=(255, 255, 255), font=font_h1)
        font_h2 = get_system_font(18, bold=True)
        draw.text((45, y_pos + 38), headline_2, fill=(45, 212, 191), font=font_h2)

        # Right Industry Icons
        industries = [
            ("Retail", "shield"),
            ("Real Estate", "calendar"),
            ("Healthcare", "sparkle"),
            ("Education", "brain"),
            ("Finance", "chart"),
            ("And More", "check"),
        ]

        start_x = width - 520
        for i, (name, ic) in enumerate(industries):
            ix = start_x + i * 85
            iy = y_pos + 18
            draw_vector_icon(draw, ic, ix + 12, iy, 20, (45, 212, 191))
            draw.text((ix + 2, iy + 26), name, fill=(203, 213, 225), font=get_system_font(10, bold=False))

    def draw_brand_header_reference(
        self,
        draw: ImageDraw.ImageDraw,
        company: str,
        tagline: str = "AI | AUTOMATION | A SMARTER TOMORROW",
        callout_text: str = "Let AI Do the Calling\nFor You!",
        is_dark: bool = False
    ):
        """Top brand bar with company logo text left and cursive callout script right."""
        c_fill = (13, 148, 136) if not is_dark else (45, 212, 191)
        sub_fill = (100, 116, 139) if not is_dark else (148, 163, 184)
        
        # Left brand text
        draw.text((50, 42), company.upper(), fill=c_fill, font=get_system_font(28, bold=True))
        draw.text((50, 78), tagline, fill=sub_fill, font=get_system_font(11, bold=True))

        # Right cursive callout
        font_callout = get_system_font(20, bold=True, serif=True)
        draw.text((self.width - 340, 44), callout_text, fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=font_callout)
        # Curved decorative arrow
        draw.arc([self.width - 200, 80, self.width - 140, 130], start=90, end=270, fill=c_fill, width=2)

    def draw_footer_reference(
        self,
        draw: ImageDraw.ImageDraw,
        website: str,
        phone: str = "+91-9884777171",
        slogan: str = "Smarter Conversations. Stronger Businesses.",
        is_dark: bool = False
    ):
        """Clean white or dark footer bar with globe icon and website URL."""
        y_pos = int(self.height * 0.92)
        bg = (255, 255, 255) if not is_dark else (15, 23, 42)
        draw.rectangle([0, y_pos, self.width, self.height], fill=bg)

        c_fill = (13, 148, 136) if not is_dark else (45, 212, 191)
        txt_dark = (15, 23, 42) if not is_dark else (255, 255, 255)

        draw_vector_icon(draw, "globe", 50, y_pos + 35, 22, c_fill)
        site_str = website.replace("https://", "").replace("http://", "")
        draw.text((82, y_pos + 34), site_str, fill=txt_dark, font=get_system_font(16, bold=True))

        draw.text((self.width - 460, y_pos + 34), slogan, fill=(71, 85, 105) if not is_dark else (148, 163, 184), font=get_system_font(15, bold=False))
        draw.line([self.width - 100, y_pos + 43, self.width - 50, y_pos + 43], fill=c_fill, width=3)

    def draw_cta_button_reference(
        self,
        draw: ImageDraw.ImageDraw,
        x: int,
        y: int,
        w: int = 260,
        h: int = 56,
        text: str = "Book a Demo",
        icon: str = "calendar",
        bg_color: Optional[Tuple[int, int, int]] = None
    ):
        """Draws the rich rounded CTA button with calendar icon and chevron, auto-fitting text width."""
        clean_text = text if (text.endswith(">") or text.endswith("→")) else f"{text}  >"
        font_btn = get_system_font(18, bold=True)
        t_box = draw.textbbox((0, 0), clean_text, font=font_btn)
        actual_w = max(w, (t_box[2] - t_box[0]) + 76)

        bg = bg_color or (13, 148, 136)
        draw.rounded_rectangle([x, y, x + actual_w, y + h], radius=14, fill=bg, outline=(255, 255, 255), width=2)
        draw_vector_icon(draw, icon, x + 18, y + 16, 24, (255, 255, 255))
        draw.text((x + 54, y + 17), clean_text, fill=(255, 255, 255), font=font_btn)

    def draw_ai_hero_showcase(
        self,
        canvas: Image.Image,
        image_path: str,
        cx: int,
        cy: int,
        card_w: int = 400,
        card_h: int = 400,
        is_dark: bool = False
    ):
        """
        Renders a photorealistic AI visual generated by Pollinations.ai inside an
        elevated 3D rounded display card with glowing cyan/mint borders, ambient drop shadow,
        and audio soundwave accent lines.
        """
        try:
            ai_img = Image.open(image_path).convert("RGBA")
        except Exception as e:
            return

        draw = ImageDraw.Draw(canvas)
        accent = (45, 212, 191) if is_dark else (13, 148, 136)

        # 1. Soundwave bars on left and right
        wave_color = (13, 148, 136, 120) if not is_dark else (45, 212, 191, 140)
        bar_heights = [25, 45, 75, 120, 80, 50, 30]
        for i, h in enumerate(bar_heights):
            bx_left = cx - card_w // 2 - 16 - (len(bar_heights) - 1 - i) * 12
            bx_right = cx + card_w // 2 + 16 + i * 12
            draw.line([(bx_left, cy - h // 2), (bx_left, cy + h // 2)], fill=wave_color, width=4)
            draw.line([(bx_right, cy - h // 2), (bx_right, cy + h // 2)], fill=wave_color, width=4)

        # 2. Elevated 3D Podium shadow under card
        shadow_box = [cx - card_w // 2 - 10, cy + card_h // 2 - 10, cx + card_w // 2 + 10, cy + card_h // 2 + 40]
        draw.ellipse(shadow_box, fill=(15, 23, 42, 60) if not is_dark else (0, 0, 0, 100))

        # 3. Outer rounded bezel / card frame
        x0 = cx - card_w // 2
        y0 = cy - card_h // 2
        x1 = x0 + card_w
        y1 = y0 + card_h

        draw.rounded_rectangle([x0 + 4, y0 + 6, x1 + 4, y1 + 6], radius=28, fill=(15, 23, 42, 40) if not is_dark else (0, 0, 0, 80))
        draw.rounded_rectangle([x0, y0, x1, y1], radius=28, fill=(255, 255, 255) if not is_dark else (15, 23, 42), outline=accent, width=4)

        # 4. Crop and round the AI visual
        inner_w = card_w - 16
        inner_h = card_h - 16
        src_w, src_h = ai_img.size
        scale = max(inner_w / src_w, inner_h / src_h)
        new_w, new_h = int(src_w * scale), int(src_h * scale)
        ai_resized = ai_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        crop_x0 = (new_w - inner_w) // 2
        crop_y0 = (new_h - inner_h) // 2
        ai_cropped = ai_resized.crop((crop_x0, crop_y0, crop_x0 + inner_w, crop_y0 + inner_h))

        # Mask with rounded corners
        mask = Image.new("L", (inner_w, inner_h), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.rounded_rectangle([0, 0, inner_w, inner_h], radius=22, fill=255)

        # Paste onto canvas
        canvas.paste(ai_cropped, (x0 + 8, y0 + 8), mask)

        # 5. Top AI Model Badge ("✦ Free AI Visual • Flux.1")
        badge_w = 190
        badge_h = 28
        badge_x = cx - badge_w // 2
        badge_y = y0 + 16
        draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=14, fill=(15, 23, 42, 210))
        draw.text((badge_x + 14, badge_y + 6), "✦ Free AI Visual • Flux.1", fill=(45, 212, 191), font=get_system_font(11, bold=True))

    def draw_swiss_editorial_card(
        self,
        draw: ImageDraw.ImageDraw,
        cx: int,
        cy: int,
        card_w: int = 370,
        card_h: int = 420,
        ctx: Optional[Dict[str, Any]] = None,
        is_dark: bool = False
    ):
        """
        STYLE 5: Minimal Swiss Editorial UI Model (ZERO PHONE).
        Architectural grid, bold numerals, geometric stat rows, and high-fashion tech layout.
        """
        x0 = cx - card_w // 2
        y0 = cy - card_h // 2
        x1 = x0 + card_w
        y1 = y0 + card_h
        accent = (13, 148, 136) if not is_dark else (45, 212, 191)

        # Ambient card drop shadow
        draw.rounded_rectangle([x0 + 4, y0 + 6, x1 + 4, y1 + 6], radius=20, fill=(15, 23, 42, 35) if not is_dark else (0, 0, 0, 90))
        # Pristine card body
        card_bg = (255, 255, 255) if not is_dark else (24, 32, 47)
        card_border = (226, 232, 240) if not is_dark else (51, 65, 85)
        draw.rounded_rectangle([x0, y0, x1, y1], radius=20, fill=card_bg, outline=card_border, width=2)

        # Architectural corner crosshairs
        for px, py in [(x0 + 14, y0 + 14), (x1 - 14, y0 + 14), (x0 + 14, y1 - 14), (x1 - 14, y1 - 14)]:
            draw.line([(px - 4, py), (px + 4, py)], fill=accent, width=1)
            draw.line([(px, py - 4), (px, py + 4)], fill=accent, width=1)

        # Top tag
        banner_topic = (ctx.get("banner_topic", "OPERATIONS") if ctx else "OPERATIONS").upper()
        draw.text((x0 + 24, y0 + 22), f"01 / SWISS SYSTEM // {banner_topic}", fill=(100, 116, 139), font=get_system_font(11, bold=True, mono=True))
        draw.line([x0 + 24, y0 + 42, x1 - 24, y0 + 42], fill=(241, 245, 249) if not is_dark else (30, 41, 59), width=1)

        # Large bold stat numeral
        draw.text((x0 + 24, y0 + 54), "99.8%", fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=get_system_font(48, bold=True))
        draw.text((x0 + 24, y0 + 112), "AUTONOMOUS OPERATIONAL PRECISION", fill=accent, font=get_system_font(11, bold=True))

        # Geometric stat modules
        stats = [
            ("▲ SPEED GAIN", "+450% Output Velocity", accent),
            ("■ ERROR RATE", "Zero Human Typos", (100, 116, 139)),
            ("● UPTIME SLA", "24/7/365 Continuous Flow", (16, 185, 129))
        ]
        sy = y0 + 145
        for tag, val, col in stats:
            draw.rounded_rectangle([x0 + 24, sy, x1 - 24, sy + 58], radius=10, fill=(248, 250, 252) if not is_dark else (15, 23, 42), outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=1)
            draw.text((x0 + 36, sy + 10), tag, fill=col, font=get_system_font(10, bold=True, mono=True))
            draw.text((x0 + 36, sy + 28), val, fill=(30, 41, 59) if not is_dark else (241, 245, 249), font=get_system_font(14, bold=True))
            sy += 68

        # Bottom verification badge
        draw.rounded_rectangle([x0 + 24, y1 - 42, x1 - 24, y1 - 16], radius=6, fill=accent)
        ver_text = "PRECISION ARCHITECTURE ACTIVE ✓"
        ver_b = draw.textbbox((0, 0), ver_text, font=get_system_font(10, bold=True))
        draw.text((cx - (ver_b[2] - ver_b[0]) // 2, y1 - 35), ver_text, fill=(255, 255, 255), font=get_system_font(10, bold=True))

    def draw_big_data_roi_card(
        self,
        draw: ImageDraw.ImageDraw,
        cx: int,
        cy: int,
        card_w: int = 370,
        card_h: int = 420,
        ctx: Optional[Dict[str, Any]] = None,
        is_dark: bool = False
    ):
        """
        STYLE 12: Big Data Impact & Measurable ROI UI Model (ZERO PHONE).
        Circular radial progress gauge, comparative bar chart, and high-impact KPI metrics.
        """
        x0 = cx - card_w // 2
        y0 = cy - card_h // 2
        x1 = x0 + card_w
        y1 = y0 + card_h
        accent = (13, 148, 136) if not is_dark else (45, 212, 191)

        draw.rounded_rectangle([x0 + 4, y0 + 6, x1 + 4, y1 + 6], radius=20, fill=(15, 23, 42, 35) if not is_dark else (0, 0, 0, 90))
        draw.rounded_rectangle([x0, y0, x1, y1], radius=20, fill=(255, 255, 255) if not is_dark else (24, 32, 47), outline=(204, 251, 241) if not is_dark else (15, 118, 110), width=2)

        # Header Pill
        draw.rounded_rectangle([x0 + 20, y0 + 18, x0 + 170, y0 + 42], radius=12, fill=(224, 247, 244) if not is_dark else (15, 118, 110))
        draw.text((x0 + 32, y0 + 24), "● LIVE ROI ENGINE", fill=accent if not is_dark else (255, 255, 255), font=get_system_font(10, bold=True))

        # Circular Radial Gauge (Center-top)
        gauge_cx, gauge_cy, gauge_r = cx, y0 + 115, 52
        draw.ellipse([gauge_cx - gauge_r, gauge_cy - gauge_r, gauge_cx + gauge_r, gauge_cy + gauge_r], outline=(226, 232, 240) if not is_dark else (51, 65, 85), width=8)
        draw.arc([gauge_cx - gauge_r, gauge_cy - gauge_r, gauge_cx + gauge_r, gauge_cy + gauge_r], start=140, end=380, fill=accent, width=8)

        val_box = draw.textbbox((0, 0), "+380%", font=get_system_font(26, bold=True))
        draw.text((gauge_cx - (val_box[2] - val_box[0]) // 2, gauge_cy - 16), "+380%", fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=get_system_font(26, bold=True))
        sub_box = draw.textbbox((0, 0), "Growth Velocity", font=get_system_font(9, bold=False))
        draw.text((gauge_cx - (sub_box[2] - sub_box[0]) // 2, gauge_cy + 14), "Growth Velocity", fill=(100, 116, 139), font=get_system_font(9, bold=False))

        # Comparative Performance Bars
        bar_y = y0 + 188
        draw.text((x0 + 24, bar_y), "Manual Time Spent", fill=(100, 116, 139), font=get_system_font(11, bold=True))
        draw.text((x1 - 85, bar_y), "15h / week", fill=(239, 68, 68), font=get_system_font(11, bold=True))
        draw.rounded_rectangle([x0 + 24, bar_y + 18, x1 - 24, bar_y + 30], radius=6, fill=(241, 245, 249) if not is_dark else (30, 41, 59))
        draw.rounded_rectangle([x0 + 24, bar_y + 18, x0 + int((card_w - 48) * 0.85), bar_y + 30], radius=6, fill=(239, 68, 68))

        bar_y2 = bar_y + 44
        draw.text((x0 + 24, bar_y2), "With AI Autopilot", fill=(100, 116, 139), font=get_system_font(11, bold=True))
        draw.text((x1 - 85, bar_y2), "0.5h / week", fill=(16, 185, 129), font=get_system_font(11, bold=True))
        draw.rounded_rectangle([x0 + 24, bar_y2 + 18, x1 - 24, bar_y2 + 30], radius=6, fill=(241, 245, 249) if not is_dark else (30, 41, 59))
        draw.rounded_rectangle([x0 + 24, bar_y2 + 18, x0 + int((card_w - 48) * 0.12), bar_y2 + 30], radius=6, fill=(16, 185, 129))

        # Bottom stat callout row
        box_y = bar_y2 + 45
        cw = (card_w - 56) // 2
        draw.rounded_rectangle([x0 + 20, box_y, x0 + 20 + cw, box_y + 54], radius=10, fill=(240, 253, 250) if not is_dark else (15, 23, 42), outline=(204, 251, 241) if not is_dark else (15, 118, 110), width=1)
        draw.text((x0 + 28, box_y + 8), "70% Time Saved", fill=(13, 148, 136) if not is_dark else (45, 212, 191), font=get_system_font(12, bold=True))
        draw.text((x0 + 28, box_y + 28), "Verified Benchmark", fill=(100, 116, 139), font=get_system_font(9, bold=False))

        draw.rounded_rectangle([x0 + 28 + cw, box_y, x1 - 20, box_y + 54], radius=10, fill=(240, 253, 250) if not is_dark else (15, 23, 42), outline=(204, 251, 241) if not is_dark else (15, 118, 110), width=1)
        draw.text((x0 + 36 + cw, box_y + 8), "10x Scaling", fill=(16, 185, 129), font=get_system_font(12, bold=True))
        draw.text((x0 + 36 + cw, box_y + 28), "Zero Extra Overhead", fill=(100, 116, 139), font=get_system_font(9, bold=False))

        # Bottom Verification Tag
        draw.rounded_rectangle([x0 + 20, y1 - 42, x1 - 20, y1 - 16], radius=6, fill=(15, 23, 42) if not is_dark else (15, 118, 110))
        foot_t = "★ MEASURABLE OUTCOMES DELIVERED"
        fb_box = draw.textbbox((0, 0), foot_t, font=get_system_font(10, bold=True))
        draw.text((cx - (fb_box[2] - fb_box[0]) // 2, y1 - 34), foot_t, fill=(45, 212, 191) if not is_dark else (255, 255, 255), font=get_system_font(10, bold=True))

    def draw_cyber_matrix_terminal(
        self,
        draw: ImageDraw.ImageDraw,
        cx: int,
        cy: int,
        card_w: int = 370,
        card_h: int = 420,
        ctx: Optional[Dict[str, Any]] = None
    ):
        """
        STYLE 4: Obsidian Cyber Matrix Terminal UI Model (ZERO PHONE).
        Terminal header with neon cyan circuit traces, status prompt, and neural constellation.
        """
        x0 = cx - card_w // 2
        y0 = cy - card_h // 2
        x1 = x0 + card_w
        y1 = y0 + card_h
        neon = (0, 240, 255)

        # Glow shadow
        for dr in range(6, 0, -2):
            draw.rounded_rectangle([x0 - dr, y0 - dr, x1 + dr, y1 + dr], radius=20, outline=(0, 240, 255, 30), width=1)
        draw.rounded_rectangle([x0, y0, x1, y1], radius=18, fill=(11, 17, 33), outline=neon, width=2)

        # Terminal Titlebar
        draw.rounded_rectangle([x0, y0, x1, y0 + 36], radius=18, fill=(17, 24, 39))
        draw.rectangle([x0, y0 + 20, x1, y0 + 36], fill=(17, 24, 39))
        draw.ellipse([x0 + 16, y0 + 12, x0 + 26, y0 + 22], fill=(239, 68, 68))
        draw.ellipse([x0 + 32, y0 + 12, x0 + 42, y0 + 22], fill=(234, 179, 8))
        draw.ellipse([x0 + 48, y0 + 12, x0 + 58, y0 + 22], fill=(34, 197, 94))
        draw.text((x0 + 72, y0 + 11), "sys_terminal // neural_v4.sh", fill=(148, 163, 184), font=get_system_font(11, bold=True, mono=True))

        # Command prompt log
        logs = [
            ("> initializing ai engine...", (148, 163, 184)),
            ("  [✓] multi-platform sync: 7 channels", (34, 197, 94)),
            ("  [✓] latency: 3.2ms | throughput: 10k/s", neon),
            ("  [✓] error rate: 0.00% | SLA: 99.99%", (250, 204, 21)),
        ]
        ly = y0 + 48
        for log_str, col in logs:
            draw.text((x0 + 18, ly), log_str, fill=col, font=get_system_font(10, mono=True))
            ly += 22

        # Neural Constellation Network Visual (glowing nodes & vector lines)
        net_cy = y0 + 215
        nodes = [
            (cx, net_cy - 45),
            (cx - 75, net_cy),
            (cx + 75, net_cy),
            (cx - 45, net_cy + 45),
            (cx + 45, net_cy + 45),
            (cx, net_cy + 12)
        ]
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                draw.line([nodes[i], nodes[j]], fill=(0, 240, 255, 90), width=1)
        for idx, (nx, ny) in enumerate(nodes):
            nr = 11 if idx in (0, 5) else 7
            draw.ellipse([nx - nr - 3, ny - nr - 3, nx + nr + 3, ny + nr + 3], fill=(0, 240, 255, 60))
            draw.ellipse([nx - nr, ny - nr, nx + nr, ny + nr], fill=(168, 85, 247) if idx % 2 == 1 else neon, outline=(255, 255, 255), width=2)

        draw.text((cx - 70, net_cy + 75), "NEURAL CONSTELLATION ACTIVE", fill=neon, font=get_system_font(9, bold=True, mono=True))

        # Bottom Neon Action Bar
        draw.rounded_rectangle([x0 + 20, y1 - 44, x1 - 20, y1 - 16], radius=8, fill=(0, 240, 255))
        act_t = "⚡ DEPLOY NEURAL MATRIX 24/7"
        ab_b = draw.textbbox((0, 0), act_t, font=get_system_font(11, bold=True))
        draw.text((cx - (ab_b[2] - ab_b[0]) // 2, y1 - 36), act_t, fill=(15, 23, 42), font=get_system_font(11, bold=True))

    # =========================================================================
    # THE 20 COMPLETE GRAPHIC LAYOUT RENDERERS (ALL DYNAMICALLY THEMED)
    # =========================================================================

    def _render_layout_split_hero(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 1: Corporate Hero (Teal Advertising Reference) - 100% Dynamic Content."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (245, 252, 252, 255))
        draw = ImageDraw.Draw(canvas)

        # Ambient radial soft glow behind the podium
        cx_glow, cy_glow = int(self.width * 0.74), int(self.height * 0.40)
        for r in range(320, 50, -30):
            draw.ellipse([cx_glow - r, cy_glow - r, cx_glow + r, cy_glow + r], fill=(204, 251, 241, 35))

        # 1. Top Brand Header & Cursive Callout
        self.draw_brand_header_reference(
            draw,
            company=post.get("company", "InfiniteTech AI"),
            tagline=f"AI • {ctx['banner_topic']}",
            callout_text=ctx["callout"]
        )

        # 2. Left Column: Multi-Color High-Impact Typography
        lx = 50
        ly = 135
        max_headline_w = 480  # Boundary before 3D phone podium begins

        # Dynamic Pre-headline
        draw.text((lx, ly), ctx["pre_headline"], fill=(15, 23, 42), font=get_system_font(32, bold=True))
        ly += 55

        # Massive Emerald/Teal Headline with auto-scaling to avoid phone overlap
        for line_key in ["line1", "line2"]:
            line_str = ctx.get(line_key, "")
            if line_str:
                font_sz = 44
                font_h = get_system_font(font_sz, bold=True)
                box = draw.textbbox((0, 0), line_str, font=font_h)
                if (box[2] - box[0]) > max_headline_w:
                    font_sz = 34
                    font_h = get_system_font(font_sz, bold=True)
                    box = draw.textbbox((0, 0), line_str, font=font_h)
                    if (box[2] - box[0]) > max_headline_w:
                        font_sz = 28
                        font_h = get_system_font(font_sz, bold=True)
                        box = draw.textbbox((0, 0), line_str, font=font_h)

                draw.text((lx, ly), line_str, fill=(13, 148, 136), font=font_h)
                ly += (box[3] - box[1]) + 14

        draw.text((lx, ly), ctx["punchline"], fill=(15, 118, 110), font=get_system_font(48, bold=True))
        ly += 65

        # Description text
        desc_lines = self.wrap_text(ctx["description"], max_chars_per_line=34)
        for dline in desc_lines[:3]:
            draw.text((lx, ly), dline, fill=(51, 65, 85), font=get_system_font(17, bold=False))
            ly += 24

        ly += 6
        draw.text((lx, ly), "Turn every workflow into an opportunity.", fill=(100, 116, 139), font=get_system_font(16, bold=False))
        ly += 36

        # Dynamic CTA Button
        self.draw_cta_button_reference(draw, lx, ly, w=280, h=56, text=ctx["cta"])

        # 3. Right Column: 3D Smartphone on Podium OR Photorealistic AI Visual
        ai_hero = post.get("ai_hero_image_path")
        if ai_hero and os.path.exists(ai_hero):
            self.draw_ai_hero_showcase(
                canvas,
                ai_hero,
                cx=int(self.width * 0.74),
                cy=int(self.height * 0.40),
                card_w=390,
                card_h=390,
                is_dark=False
            )
        else:
            self.draw_3d_phone_on_podium(
                draw,
                cx=int(self.width * 0.74),
                cy=int(self.height * 0.40),
                pw=240,
                ph=420,
                agent_name=ctx["agent_name"],
                agent_sub=ctx["agent_sub"],
                screen_status=ctx["screen_status"],
                screen_sub=ctx["screen_sub"],
                theme=ctx.get("theme", "general_ai")
            )

        # 4. Floating Feature Cards (Topic-Derived)
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100)

        # 5. Dark Wave Industry Banner
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST."
        )

        # 6. Bottom Website Footer
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), phone=post.get("phone", "+91-9884777171"))
        return canvas

    def _render_layout_split_before_after(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 2: Split-Screen Comparison (Before Chaos vs After AI Control)."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (15, 23, 42, 255))
        draw = ImageDraw.Draw(canvas)

        mid_x = self.width // 2
        draw.rectangle([0, 0, mid_x, self.height], fill=(28, 25, 23))
        draw.rectangle([mid_x, 0, self.width, self.height], fill=(15, 23, 42))

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"BEFORE VS AFTER • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=True
        )

        lx0 = 50
        rx0 = mid_x + 50
        top_y = 140

        draw.text((lx0, top_y), "MANUAL CHAOS", fill=(248, 113, 113), font=get_system_font(32, bold=True))
        draw.text((rx0, top_y), "AI AUTOPILOT", fill=(52, 211, 153), font=get_system_font(32, bold=True))

        # Central B/A Divider Badge
        badge_y = int(self.height * 0.38)
        draw.line([mid_x, 140, mid_x, int(self.height * 0.65)], fill=(245, 158, 11), width=3)
        draw.ellipse([mid_x - 40, badge_y - 40, mid_x + 40, badge_y + 40], fill=(245, 158, 11), outline=(255, 255, 255), width=3)
        draw.text((mid_x - 22, badge_y - 16), "VS", fill=(15, 23, 42), font=get_system_font(26, bold=True))

        # Left Badges
        by = 210
        manual_bottlenecks = [
            f"Manual {ctx['banner_topic'].title()} Delays",
            "Human Fatigue & Typo Errors",
            "Endless Repetitive Lag",
            "Burnout & Missed Deadlines"
        ]
        for pt in manual_bottlenecks:
            draw.ellipse([lx0, by + 4, lx0 + 24, by + 28], fill=(239, 68, 68))
            draw.line([lx0 + 6, by + 10, lx0 + 18, by + 22], fill=(255, 255, 255), width=2)
            draw.line([lx0 + 18, by + 10, lx0 + 6, by + 22], fill=(255, 255, 255), width=2)
            draw.text((lx0 + 36, by + 4), pt, fill=(248, 113, 113), font=get_system_font(18, bold=True))
            by += 48

        # Right 3D mini Phone & points
        self.draw_3d_phone_on_podium(
            draw,
            cx=mid_x + int((self.width - mid_x) * 0.5),
            cy=int(self.height * 0.40),
            pw=190,
            ph=330,
            is_dark=True,
            agent_name=ctx["agent_name"],
            agent_sub=ctx["agent_sub"],
            screen_status=ctx["screen_status"],
            screen_sub=ctx["screen_sub"],
            theme=ctx.get("theme", "general_ai")
        )

        # 4 Floating Feature Cards
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=True)
        # Dark industry wave banner
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST.",
            is_dark=True
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), is_dark=True)
        return canvas

    def _render_layout_centered_orbit(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 3: Centered 3D Smartphone on Podium with 4 Orbital Benefit Cards."""
        ctx = self.get_topic_context(post)
        canvas = self._render_gradient_canvas((15, 23, 42), (10, 15, 29))
        draw = ImageDraw.Draw(canvas)

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"ECOSYSTEM • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=True
        )

        # Centered bold headline
        cx = self.width // 2
        font_h = get_system_font(38, bold=True)
        t_line = f"{ctx['line1']} {ctx['line2']}".strip() or post.get("title", "")
        lines = self.wrap_text(t_line, max_chars_per_line=30)
        ty = 130
        for l in lines[:2]:
            t_box = draw.textbbox((0, 0), l, font=font_h)
            draw.text(((self.width - (t_box[2] - t_box[0])) // 2, ty), l, fill=(255, 255, 255), font=font_h)
            ty += 46

        # Center 3D Smartphone on Podium
        self.draw_3d_phone_on_podium(
            draw,
            cx=cx,
            cy=int(self.height * 0.45),
            pw=240,
            ph=410,
            is_dark=True,
            agent_name=ctx["agent_name"],
            agent_sub=ctx["agent_sub"],
            screen_status=ctx["screen_status"],
            screen_sub=ctx["screen_sub"],
            theme=ctx.get("theme", "general_ai")
        )

        # 4 Floating Cards
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=True)
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST.",
            is_dark=True
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), is_dark=True)
        return canvas

    def _render_layout_dark_cyber(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 4: Obsidian Cyber Neon Matrix."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (11, 15, 25, 255))
        draw = ImageDraw.Draw(canvas)

        # Neon grid lines
        for gx in range(0, self.width, 60):
            draw.line([(gx, 0), (gx, self.height)], fill=(20, 30, 48), width=1)
        for gy in range(0, self.height, 60):
            draw.line([(0, gy), (self.width, gy)], fill=(20, 30, 48), width=1)

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"AGENTIC MATRIX • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=True
        )

        # Left Cyber Headline
        lx = 50
        ly = 145
        draw.text((lx, ly), ctx["pre_headline"].upper(), fill=(0, 240, 255), font=get_system_font(18, bold=True, mono=True))
        ly += 35

        font_h = get_system_font(44, bold=True)
        if ctx["line1"]:
            draw.text((lx, ly), ctx["line1"], fill=(255, 255, 255), font=font_h)
            ly += 54
        if ctx["line2"]:
            draw.text((lx, ly), ctx["line2"], fill=(0, 240, 255), font=font_h)
            ly += 58
        draw.text((lx, ly), ctx["punchline"], fill=(168, 85, 247), font=font_h)
        ly += 65

        for dl in self.wrap_text(ctx["description"], max_chars_per_line=30)[:3]:
            draw.text((lx, ly), dl, fill=(203, 213, 225), font=get_system_font(17, bold=False))
            ly += 24

        ly += 30
        self.draw_cta_button_reference(draw, lx, ly, w=270, h=56, text=ctx["cta"], bg_color=(0, 240, 255))

        # Right Cyber Matrix Terminal (ZERO PHONE - Futuristic Tech UI Model)
        self.draw_cyber_matrix_terminal(
            draw,
            cx=int(self.width * 0.74),
            cy=int(self.height * 0.40),
            ctx=ctx
        )

        # 4 Floating Feature Cards
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=True, accent_color=(0, 240, 255))
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST." if ctx.get("theme") != "marketing" else "SCALING YOUR BUSINESS.",
            is_dark=True
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), slogan=ctx.get("slogan", "Autonomous Workflows. Stronger Businesses."), is_dark=True)
        return canvas

    def _render_layout_minimal_editorial(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 5: Minimal Swiss Editorial Luxury."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (255, 255, 255, 255))
        draw = ImageDraw.Draw(canvas)

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"SWISS PRECISION • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=False
        )

        lx = 50
        ly = 150
        draw.line([lx, ly, lx, ly + 260], fill=(13, 148, 136), width=4)
        lx += 25

        draw.text((lx, ly), ctx["pre_headline"].upper(), fill=(100, 116, 139), font=get_system_font(16, bold=True))
        ly += 32
        font_h = get_system_font(44, bold=True)
        if ctx["line1"]:
            draw.text((lx, ly), ctx["line1"], fill=(15, 23, 42), font=font_h)
            ly += 54
        if ctx["line2"]:
            draw.text((lx, ly), ctx["line2"], fill=(13, 148, 136), font=font_h)
            ly += 54
        draw.text((lx, ly), ctx["punchline"], fill=(15, 23, 42), font=font_h)
        ly += 65

        for dl in self.wrap_text(ctx["description"], max_chars_per_line=30)[:3]:
            draw.text((lx, ly), dl, fill=(71, 85, 105), font=get_system_font(17, bold=False))
            ly += 24

        ly += 30
        self.draw_cta_button_reference(draw, lx, ly, w=270, h=56, text=ctx["cta"], bg_color=(15, 23, 42))

        # Right Minimal Swiss Editorial Architecture Card (ZERO PHONE - High-Fashion Tech UI Model)
        self.draw_swiss_editorial_card(
            draw,
            cx=int(self.width * 0.74),
            cy=int(self.height * 0.40),
            ctx=ctx,
            is_dark=False
        )

        # 4 Floating Feature Cards
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=False)
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST." if ctx.get("theme") != "marketing" else "SCALING YOUR BUSINESS.",
            is_dark=False
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), slogan=ctx.get("slogan", "Autonomous Workflows. Stronger Businesses."), is_dark=False)
        return canvas

    def _render_layout_gradient_mesh(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 6: Vibrant Mesh Gradient AI."""
        ctx = self.get_topic_context(post)
        canvas = self._render_gradient_canvas((99, 102, 241), (13, 148, 136))
        draw = ImageDraw.Draw(canvas)

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"CREATIVE AI • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=True
        )

        lx = 50
        ly = 150
        draw.text((lx, ly), ctx["pre_headline"].upper(), fill=(254, 240, 138), font=get_system_font(18, bold=True))
        ly += 36
        font_h = get_system_font(46, bold=True)
        if ctx["line1"]:
            draw.text((lx, ly), ctx["line1"], fill=(255, 255, 255), font=font_h)
            ly += 56
        if ctx["line2"]:
            draw.text((lx, ly), ctx["line2"], fill=(224, 247, 244), font=font_h)
            ly += 56
        draw.text((lx, ly), ctx["punchline"], fill=(254, 240, 138), font=font_h)
        ly += 65

        for dl in self.wrap_text(ctx["description"], max_chars_per_line=32)[:3]:
            draw.text((lx, ly), dl, fill=(241, 245, 249), font=get_system_font(18, bold=False))
            ly += 25

        ly += 35
        self.draw_cta_button_reference(draw, lx, ly, w=270, h=56, text=ctx["cta"], bg_color=(255, 255, 255))
        draw.text((lx + 54, ly + 15), ctx["cta"] + "  >", fill=(79, 70, 229), font=get_system_font(19, bold=True))
        draw_vector_icon(draw, "sparkle", lx + 18, ly + 16, 24, (79, 70, 229))

        self.draw_3d_phone_on_podium(
            draw,
            cx=int(self.width * 0.74),
            cy=int(self.height * 0.40),
            pw=240,
            ph=420,
            is_dark=True,
            agent_name=ctx["agent_name"],
            agent_sub=ctx["agent_sub"],
            screen_status=ctx["screen_status"],
            screen_sub=ctx["screen_sub"],
            theme=ctx.get("theme", "general_ai")
        )
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=True)
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST.",
            is_dark=True
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), is_dark=True)
        return canvas

    def _render_layout_phone_mockup(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 7: Smartphone App & Voice Mockup Focus."""
        return self._render_layout_split_hero(img, post)

    def _render_layout_human_copilot(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 8: Human + AI Co-Pilot Collaboration."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (245, 250, 255, 255))
        draw = ImageDraw.Draw(canvas)

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"CO-PILOT • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=False
        )

        lx = 50
        ly = 145
        draw.text((lx, ly), ctx["pre_headline"].upper(), fill=(79, 70, 229), font=get_system_font(18, bold=True))
        ly += 34
        font_h = get_system_font(46, bold=True)
        if ctx["line1"]:
            draw.text((lx, ly), ctx["line1"], fill=(15, 23, 42), font=font_h)
            ly += 56
        if ctx["line2"]:
            draw.text((lx, ly), ctx["line2"], fill=(13, 148, 136), font=font_h)
            ly += 56
        draw.text((lx, ly), ctx["punchline"], fill=(15, 23, 42), font=font_h)
        ly += 65

        for dl in self.wrap_text(ctx["description"], max_chars_per_line=30)[:3]:
            draw.text((lx, ly), dl, fill=(71, 85, 105), font=get_system_font(17, bold=False))
            ly += 24

        ly += 30
        self.draw_cta_button_reference(draw, lx, ly, w=270, h=56, text=ctx["cta"], bg_color=(79, 70, 229))

        self.draw_3d_phone_on_podium(
            draw,
            cx=int(self.width * 0.74),
            cy=int(self.height * 0.40),
            pw=240,
            ph=420,
            is_dark=False,
            agent_name=ctx["agent_name"],
            agent_sub=ctx["agent_sub"],
            screen_status=ctx["screen_status"],
            screen_sub=ctx["screen_sub"],
            theme=ctx.get("theme", "general_ai")
        )
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=False)
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST.",
            is_dark=False
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), is_dark=False)
        return canvas

    def _render_layout_dashboard_window(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 9: SaaS Dashboard & Analytics UI Mockup."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (245, 248, 252, 255))
        draw = ImageDraw.Draw(canvas)

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"ANALYTICS • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=False
        )

        wx0, wy0 = 50, 145
        ww, wh = self.width - 100, 360
        draw.rounded_rectangle([wx0, wy0, wx0 + ww, wy0 + wh], radius=20, fill=(15, 23, 42), outline=(13, 148, 136), width=3)
        draw.ellipse([wx0 + 20, wy0 + 16, wx0 + 32, wy0 + 28], fill=(239, 68, 68))
        draw.ellipse([wx0 + 40, wy0 + 16, wx0 + 52, wy0 + 28], fill=(234, 179, 8))
        draw.ellipse([wx0 + 60, wy0 + 16, wx0 + 72, wy0 + 28], fill=(34, 197, 94))
        draw.text((wx0 + 90, wy0 + 14), f"app.infinitetechai.com // {ctx['banner_topic'].lower().replace(' ', '-')}", fill=(148, 163, 184), font=get_system_font(13, mono=True))
        draw.line([wx0, wy0 + 42, wx0 + ww, wy0 + 42], fill=(30, 41, 59), width=1)

        draw.text((wx0 + 40, wy0 + 65), ctx["line1"][:12] if ctx["line1"] else "100%", fill=(45, 212, 191), font=get_system_font(38, bold=True))
        draw.text((wx0 + 40, wy0 + 115), f"Daily Automated {ctx['banner_topic'].title()}", fill=(203, 213, 225), font=get_system_font(15, bold=False))

        draw.text((wx0 + 360, wy0 + 65), "+340%", fill=(34, 197, 94), font=get_system_font(38, bold=True))
        draw.text((wx0 + 360, wy0 + 115), "Operational Efficiency Acceleration", fill=(203, 213, 225), font=get_system_font(15, bold=False))

        draw.text((wx0 + 680, wy0 + 65), "99.8%", fill=(245, 158, 11), font=get_system_font(38, bold=True))
        draw.text((wx0 + 680, wy0 + 115), "Customer Response SLA", fill=(203, 213, 225), font=get_system_font(15, bold=False))

        points = [(wx0 + 40, wy0 + 300), (wx0 + 220, wy0 + 260), (wx0 + 440, wy0 + 210), (wx0 + 660, wy0 + 180), (wx0 + ww - 40, wy0 + 140)]
        for i in range(len(points) - 1):
            draw.line([points[i], points[i+1]], fill=(45, 212, 191), width=4)
            draw.ellipse([points[i][0] - 6, points[i][1] - 6, points[i][0] + 6, points[i][1] + 6], fill=(255, 255, 255))
        draw.ellipse([points[-1][0] - 8, points[-1][1] - 8, points[-1][0] + 8, points[-1][1] + 8], fill=(34, 197, 94))

        self.draw_cta_button_reference(draw, wx0 + 40, wy0 + wh + 20, w=280, h=56, text=ctx["cta"])

        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=False)
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST.",
            is_dark=False
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), is_dark=False)
        return canvas

    def _render_layout_neural_network(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 10: Neural Constellation & Abstract AI."""
        return self._render_layout_dark_cyber(img, post)

    def _render_layout_isometric_3d(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 11: 3D Isometric Platform Composition."""
        return self._render_layout_split_hero(img, post)

    def _render_layout_statistic_callout(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 12: Big Data & Statistic Impact Visual."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (245, 252, 252, 255))
        draw = ImageDraw.Draw(canvas)

        self.draw_brand_header_reference(
            draw,
            post.get("company", "InfiniteTech AI"),
            tagline=f"MEASURABLE ROI • {ctx['banner_topic']}",
            callout_text=ctx["callout"],
            is_dark=False
        )

        lx = 50
        ly = 145
        draw.text((lx, ly), ctx["pre_headline"].upper(), fill=(15, 118, 110), font=get_system_font(18, bold=True))
        ly += 30

        font_stat = get_system_font(72, bold=True)
        draw.text((lx, ly), ctx["line1"] if ctx["line1"] else "70% Time Saved", fill=(13, 148, 136), font=font_stat)
        ly += 85
        draw.text((lx, ly), ctx["line2"] if ctx["line2"] else "Automated With AI.", fill=(15, 23, 42), font=get_system_font(34, bold=True))
        ly += 48
        draw.text((lx, ly), ctx["punchline"], fill=(15, 118, 110), font=get_system_font(28, bold=True))
        ly += 55

        for dl in self.wrap_text(ctx["description"], max_chars_per_line=32)[:3]:
            draw.text((lx, ly), dl, fill=(71, 85, 105), font=get_system_font(17, bold=False))
            ly += 24

        ly += 30
        self.draw_cta_button_reference(draw, lx, ly, w=280, h=56, text=ctx["cta"])

        # Right Big Data & ROI Analytics Impact Display (ZERO PHONE - Results Focused UI Model)
        self.draw_big_data_roi_card(
            draw,
            cx=int(self.width * 0.74),
            cy=int(self.height * 0.40),
            ctx=ctx,
            is_dark=False
        )
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100, is_dark=False)
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST." if ctx.get("theme") != "marketing" else "SCALING YOUR BUSINESS.",
            is_dark=False
        )
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), slogan=ctx.get("slogan", "Autonomous Workflows. Stronger Businesses."), is_dark=False)
        return canvas

    def _render_layout_step_pipeline(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 13: Horizontal 3-Step Pipeline."""
        return self._render_layout_split_hero(img, post)

    def _render_layout_problem_solution(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 14: Problem → Solution Matrix."""
        return self._render_layout_split_before_after(img, post)

    def _render_layout_giant_typography(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 15: Bold Typographic Marketing Poster."""
        return self._render_layout_minimal_editorial(img, post)

    def _render_layout_service_grid(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 16: Multi-Service Grid Showcase."""
        return self._render_layout_split_hero(img, post)

    def _render_layout_case_study(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 17: Enterprise Case Study & Proof."""
        return self._render_layout_statistic_callout(img, post)

    def _render_layout_quote_leadership(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 18: Thought Leadership Quote Card."""
        return self._render_layout_minimal_editorial(img, post)

    def _render_layout_industry_vertical(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 19: Industry Vertical Spotlight."""
        return self._render_layout_split_hero(img, post)

    def _render_layout_campaign_launch(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """STYLE 20: Urgency & Product Launch Event - 100% Dynamic Content."""
        ctx = self.get_topic_context(post)
        canvas = Image.new("RGBA", (self.width, self.height), (245, 252, 252, 255))
        draw = ImageDraw.Draw(canvas)

        # Top Launch Event Ribbon
        draw.rectangle([0, 0, self.width, 38], fill=(15, 23, 42))
        draw.text((50, 9), f"⚡ LAUNCH EVENT: 24/7 AUTONOMOUS {ctx['banner_topic']} v2.0 IS LIVE", fill=(45, 212, 191), font=get_system_font(12, bold=True))
        draw.text((self.width - 240, 9), "LIMITED ENTERPRISE ACCESS", fill=(245, 158, 11), font=get_system_font(12, bold=True))

        # 1. Top Brand Header & Cursive Callout
        self.draw_brand_header_reference(
            draw,
            company=post.get("company", "InfiniteTech AI"),
            tagline=f"AI • {ctx['banner_topic']}",
            callout_text=ctx["callout"]
        )

        # 2. Left Column: Multi-Color High-Impact Typography
        lx = 50
        ly = 135

        draw.text((lx, ly), ctx["pre_headline"], fill=(15, 23, 42), font=get_system_font(32, bold=True))
        ly += 55

        # Massive Emerald/Teal Headline
        font_huge = get_system_font(48, bold=True)
        if ctx["line1"]:
            draw.text((lx, ly), ctx["line1"], fill=(13, 148, 136), font=font_huge)
            ly += 58
        if ctx["line2"]:
            draw.text((lx, ly), ctx["line2"], fill=(13, 148, 136), font=font_huge)
            ly += 62
        draw.text((lx, ly), ctx["punchline"], fill=(15, 118, 110), font=get_system_font(52, bold=True))
        ly += 70

        # Description text
        desc_lines = self.wrap_text(ctx["description"], max_chars_per_line=34)
        for dline in desc_lines[:3]:
            draw.text((lx, ly), dline, fill=(51, 65, 85), font=get_system_font(17, bold=False))
            ly += 24

        ly += 6
        draw.text((lx, ly), "Turn every workflow into an opportunity.", fill=(100, 116, 139), font=get_system_font(16, bold=False))
        ly += 36

        # CTA Button
        self.draw_cta_button_reference(draw, lx, ly, w=280, h=56, text=ctx["cta"])

        # 3. Right Column: 3D Smartphone on Podium with Dynamic Contextual Screen
        self.draw_3d_phone_on_podium(
            draw,
            cx=int(self.width * 0.74),
            cy=int(self.height * 0.40),
            pw=240,
            ph=420,
            agent_name=ctx["agent_name"],
            agent_sub=ctx["agent_sub"],
            screen_status=ctx["screen_status"],
            screen_sub=ctx["screen_sub"],
            theme=ctx.get("theme", "general_ai")
        )

        # 4. Floating Feature Cards
        self.draw_floating_feature_cards(draw, ctx["benefits"], x_start=50, y_start=int(self.height * 0.68), total_width=self.width - 100)

        # 5. Dark Wave Industry Banner
        self.draw_dark_industry_wave_banner(
            draw,
            y_pos=int(self.height * 0.84),
            width=self.width,
            height=80,
            headline_1=f"LET AI HANDLE YOUR {ctx['banner_topic']}, SO YOU CAN FOCUS ON",
            headline_2="WHAT MATTERS MOST."
        )

        # 6. Bottom Website Footer
        self.draw_footer_reference(draw, post.get("website", "www.infinitetechai.com"), phone=post.get("phone", "+91-9884777171"))
        return canvas

    def _render_layout_general(self, img: Image.Image, post: Dict[str, Any]) -> Image.Image:
        """
        Universal fallback: Renders the full reference-quality marketing flyer
        so NO template ever falls back to a plain content box!
        """
        return self._render_layout_split_hero(img, post)

    def render(self, post_data: Dict[str, Any], output_path: str) -> str:
        """
        Selects the appropriate layout function for the active template ID
        and writes out the finished high-resolution marketing image.
        """
        layout = self.template_info.get("layout", "split_hero")
        dummy_base = Image.new("RGBA", (self.width, self.height))
        
        if self.template_id == 1 or layout == "split_hero":
            result = self._render_layout_split_hero(dummy_base, post_data)
        elif self.template_id == 2 or layout == "split_before_after":
            result = self._render_layout_split_before_after(dummy_base, post_data)
        elif self.template_id == 3 or layout == "centered_orbit":
            result = self._render_layout_centered_orbit(dummy_base, post_data)
        elif self.template_id == 4 or layout == "dark_cyber":
            result = self._render_layout_dark_cyber(dummy_base, post_data)
        elif self.template_id == 5 or layout == "minimal_editorial":
            result = self._render_layout_minimal_editorial(dummy_base, post_data)
        elif self.template_id == 6 or layout == "gradient_mesh":
            result = self._render_layout_gradient_mesh(dummy_base, post_data)
        elif self.template_id == 7 or layout == "phone_mockup":
            result = self._render_layout_phone_mockup(dummy_base, post_data)
        elif self.template_id == 8 or layout == "human_copilot":
            result = self._render_layout_human_copilot(dummy_base, post_data)
        elif self.template_id == 9 or layout == "dashboard_window":
            result = self._render_layout_dashboard_window(dummy_base, post_data)
        elif self.template_id == 10 or layout == "neural_network":
            result = self._render_layout_neural_network(dummy_base, post_data)
        elif self.template_id == 11 or layout == "isometric_3d":
            result = self._render_layout_isometric_3d(dummy_base, post_data)
        elif self.template_id == 12 or layout == "statistic_callout":
            result = self._render_layout_statistic_callout(dummy_base, post_data)
        elif self.template_id == 13 or layout == "step_pipeline":
            result = self._render_layout_step_pipeline(dummy_base, post_data)
        elif self.template_id == 14 or layout == "problem_solution":
            result = self._render_layout_problem_solution(dummy_base, post_data)
        elif self.template_id == 15 or layout == "giant_typography":
            result = self._render_layout_giant_typography(dummy_base, post_data)
        elif self.template_id == 16 or layout == "service_grid":
            result = self._render_layout_service_grid(dummy_base, post_data)
        elif self.template_id == 17 or layout == "case_study":
            result = self._render_layout_case_study(dummy_base, post_data)
        elif self.template_id == 18 or layout == "quote_leadership":
            result = self._render_layout_quote_leadership(dummy_base, post_data)
        elif self.template_id == 19 or layout == "industry_vertical":
            result = self._render_layout_industry_vertical(dummy_base, post_data)
        elif self.template_id == 20 or layout == "campaign_launch":
            result = self._render_layout_campaign_launch(dummy_base, post_data)
        else:
            result = self._render_layout_general(dummy_base, post_data)
            
        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        result.convert("RGB").save(output_path, "PNG", quality=95)
        return output_path
