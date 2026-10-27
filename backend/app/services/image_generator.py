import os
import math
import random
from typing import List, Optional, Dict, Any
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MEDIA_DIRS = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "storage", "media")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage", "media"))
]

def get_media_dir() -> str:
    for d in MEDIA_DIRS:
        if os.path.exists(d):
            return d
    return MEDIA_DIRS[0]

HERO_ART_ASSETS = [
    "bg_ai_neural_core.jpg",
    "bg_ai_ops_matrix.jpg",
    "bg_ai_finance_ledger.jpg",
    "bg_ai_calendar_clock.jpg",
    "bg_ai_voice_waves.jpg"
]

def get_system_font(font_names: List[str], size: int) -> ImageFont.FreeTypeFont:
    for fn in font_names:
        if os.path.exists(fn):
            try:
                return ImageFont.truetype(fn, size)
            except Exception:
                pass
        try:
            return ImageFont.truetype(fn, size)
        except Exception:
            pass
    return ImageFont.load_default()

def draw_vector_icon(draw: ImageDraw.ImageDraw, icon_type: str, x: int, y: int, size: int, color: tuple):
    cx, cy = x + size // 2, y + size // 2
    if icon_type == "lightning":
        pts = [
            (cx + 2, cy - size//2 + 2),
            (cx - size//3, cy),
            (cx, cy),
            (cx - 2, cy + size//2 - 2),
            (cx + size//3 + 2, cy - 2),
            (cx + 2, cy - 2)
        ]
        draw.polygon(pts, fill=color)
    elif icon_type == "clock":
        r = size // 2 - 2
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)
        draw.line([cx, cy, cx, cy - r + 5], fill=color, width=2)
        draw.line([cx, cy, cx + r - 5, cy], fill=color, width=2)
    elif icon_type == "chart":
        bw = size // 5
        draw.rectangle([cx - bw*2, cy + size//3 - 8, cx - bw - 1, cy + size//3], fill=color)
        draw.rectangle([cx - bw//2, cy + size//3 - 16, cx + bw//2, cy + size//3], fill=color)
        draw.rectangle([cx + bw + 1, cy + size//3 - 24, cx + bw*2, cy + size//3], fill=color)
    elif icon_type == "globe":
        r = size // 2 - 2
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)
        draw.ellipse([cx - r//2, cy - r, cx + r//2, cy + r], outline=color, width=1)
        draw.line([cx - r, cy, cx + r, cy], fill=color, width=1)
    elif icon_type == "calendar":
        w, h = size - 6, size - 8
        x0, y0 = cx - w//2, cy - h//2
        draw.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=3, outline=color, width=2)
        draw.line([x0, y0 + 6, x0 + w, y0 + 6], fill=color, width=2)
        draw.line([x0 + 4, y0 - 3, x0 + 4, y0 + 2], fill=color, width=2)
        draw.line([x0 + w - 4, y0 - 3, x0 + w - 4, y0 + 2], fill=color, width=2)
    elif icon_type == "check":
        draw.line([(cx - 7, cy), (cx - 2, cy + 6)], fill=color, width=3)
        draw.line([(cx - 2, cy + 6), (cx + 8, cy - 6)], fill=color, width=3)
    elif icon_type == "phone":
        draw.rounded_rectangle([cx - 7, cy - 10, cx + 7, cy + 10], radius=3, outline=color, width=2)
        draw.line([cx - 3, cy + 7, cx + 3, cy + 7], fill=color, width=2)
    elif icon_type == "shield":
        draw.polygon([
            (cx, cy - 10),
            (cx + 8, cy - 6),
            (cx + 8, cy + 3),
            (cx, cy + 10),
            (cx - 8, cy + 3),
            (cx - 8, cy - 6)
        ], outline=color, width=2)
    else:
        draw.ellipse([cx - 4, cy - 4, cx + 4, cy + 4], fill=color)

MASTER_THEMES = [
    # 0: Light Teal Studio (Classic InfiniteTech)
    {
        "name": "Light Teal Studio",
        "is_dark": False,
        "bg_color": (248, 250, 252),
        "text_primary": (15, 23, 42),
        "text_secondary": (71, 85, 105),
        "text_accent": (13, 148, 136),
        "btn_bg": (13, 148, 136),
        "btn_shine": (20, 184, 166),
        "btn_text": (255, 255, 255),
        "card_bg": (255, 255, 255),
        "card_border": (226, 232, 240),
        "card_shadow": (226, 232, 240),
        "banner_bg": (11, 19, 43),
        "banner_text": (45, 212, 191),
        "banner_pill": (24, 38, 75),
        "icon_bg": (240, 253, 250),
        "icon_border": (204, 251, 241),
        "icon_color": (13, 148, 136),
        "ambient_color": (13, 148, 136)
    },
    # 1: Midnight Obsidian Cyber Matrix
    {
        "name": "Midnight Obsidian Cyber Matrix",
        "is_dark": True,
        "bg_color": (11, 15, 25),
        "text_primary": (248, 250, 252),
        "text_secondary": (148, 163, 184),
        "text_accent": (6, 182, 212),
        "btn_bg": (14, 116, 144),
        "btn_shine": (6, 182, 212),
        "btn_text": (255, 255, 255),
        "card_bg": (19, 26, 42),
        "card_border": (30, 41, 59),
        "card_shadow": (5, 8, 15),
        "banner_bg": (7, 10, 19),
        "banner_text": (56, 189, 248),
        "banner_pill": (15, 23, 42),
        "icon_bg": (15, 23, 42),
        "icon_border": (30, 58, 138),
        "icon_color": (56, 189, 248),
        "ambient_color": (6, 182, 212)
    },
    # 2: Emerald Finance & Growth
    {
        "name": "Emerald Finance & Growth",
        "is_dark": False,
        "bg_color": (246, 250, 248),
        "text_primary": (6, 78, 59),
        "text_secondary": (55, 65, 81),
        "text_accent": (5, 150, 105),
        "btn_bg": (5, 150, 105),
        "btn_shine": (16, 185, 129),
        "btn_text": (255, 255, 255),
        "card_bg": (255, 255, 255),
        "card_border": (209, 250, 229),
        "card_shadow": (220, 252, 231),
        "banner_bg": (6, 78, 59),
        "banner_text": (110, 231, 183),
        "banner_pill": (4, 120, 87),
        "icon_bg": (236, 253, 245),
        "icon_border": (167, 243, 208),
        "icon_color": (5, 150, 105),
        "ambient_color": (16, 185, 129)
    },
    # 3: Sky Blue Executive Cloud
    {
        "name": "Sky Blue Executive Cloud",
        "is_dark": False,
        "bg_color": (248, 250, 254),
        "text_primary": (30, 58, 138),
        "text_secondary": (71, 85, 105),
        "text_accent": (37, 99, 235),
        "btn_bg": (37, 99, 235),
        "btn_shine": (59, 130, 246),
        "btn_text": (255, 255, 255),
        "card_bg": (255, 255, 255),
        "card_border": (219, 234, 254),
        "card_shadow": (224, 242, 254),
        "banner_bg": (15, 23, 42),
        "banner_text": (96, 165, 250),
        "banner_pill": (30, 41, 59),
        "icon_bg": (239, 246, 255),
        "icon_border": (191, 219, 254),
        "icon_color": (37, 99, 235),
        "ambient_color": (59, 130, 246)
    },
    # 4: Royal Violet Quantum AI
    {
        "name": "Royal Violet Quantum AI",
        "is_dark": True,
        "bg_color": (15, 12, 28),
        "text_primary": (250, 245, 255),
        "text_secondary": (168, 162, 198),
        "text_accent": (168, 85, 247),
        "btn_bg": (126, 34, 206),
        "btn_shine": (168, 85, 247),
        "btn_text": (255, 255, 255),
        "card_bg": (24, 18, 43),
        "card_border": (59, 7, 100),
        "card_shadow": (8, 4, 16),
        "banner_bg": (9, 6, 18),
        "banner_text": (216, 180, 254),
        "banner_pill": (32, 22, 56),
        "icon_bg": (24, 18, 43),
        "icon_border": (88, 28, 135),
        "icon_color": (192, 132, 252),
        "ambient_color": (168, 85, 247)
    }
]

def render_master_infinitetech_flyer(
    topic: str,
    heading: str,
    details: List[str],
    cta_text: str,
    theme_idx: int = 0,
    company: str = "InfiniteTech AI",
    website: str = "www.infinitetechai.com",
    phone: str = "+91-9884777171",
    hero_image_path: Optional[str] = None,
    output_path: str = "flyer.jpg"
) -> str:
    width, height = 1080, 1080
    t = MASTER_THEMES[theme_idx % len(MASTER_THEMES)]

    canvas = Image.new("RGB", (width, height), t["bg_color"])
    draw = ImageDraw.Draw(canvas)

    # Ambient soft glow in background corners
    ambient = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    amb_draw = ImageDraw.Draw(ambient)
    for rad in range(350, 0, -8):
        alpha = int((350 - rad) / 350 * 25)
        r, g, b = t["ambient_color"]
        amb_draw.ellipse([width - 450 - rad, -100 - rad, width - 450 + rad, -100 + rad], fill=(r, g, b, alpha))
        amb_draw.ellipse([width - 150 - rad, 250 - rad, width - 150 + rad, 250 + rad], fill=(r, g, b, alpha // 2))
    canvas = Image.alpha_composite(canvas.convert("RGBA"), ambient).convert("RGB")
    draw = ImageDraw.Draw(canvas)

    # 1. HEADER (y: 40 to 110)
    # Top-Left Logo
    draw.ellipse([50, 48, 50 + 24, 48 + 24], outline=t["text_accent"], width=4)
    draw.ellipse([66, 48, 66 + 24, 48 + 24], outline=t["text_accent"], width=4)
    font_logo = get_system_font(["C:/Windows/Fonts/seguibl.ttf", "arialbd.ttf"], 30)
    draw.text((105, 42), "INFINITE", fill=t["text_accent"], font=font_logo)
    draw.text((250, 42), "TECH", fill=t["text_primary"], font=font_logo)
    
    font_sublogo = get_system_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 11)
    sub_fill = (148, 163, 184) if t["is_dark"] else (100, 116, 139)
    draw.text((52, 82), "AI  |  AUTOMATION  |  A SMARTER TOMORROW", fill=sub_fill, font=font_sublogo)

    # Top-Right Slogan
    font_script = get_system_font(["C:/Windows/Fonts/segoeprb.ttf", "C:/Windows/Fonts/segoescb.ttf", "arialbd.ttf"], 22)
    slogan_text = "Let AI Do The Hard Work For You!"
    s_bbox = draw.textbbox((0, 0), slogan_text, font=font_script)
    s_w = s_bbox[2] - s_bbox[0]
    draw.text((width - 50 - s_w, 52), slogan_text, fill=t["text_accent"], font=font_script)

    line_col = (30, 41, 59) if t["is_dark"] else (226, 232, 240)
    draw.line([50, 112, width - 50, 112], fill=line_col, width=1)

    # 2. HERO SECTION (y: 135 to 630)
    font_hook = get_system_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 24)
    draw.text((50, 140), "Your Business Can't Miss", fill=t["text_primary"], font=font_hook)

    # Headline wrapping and coloring
    font_headline = get_system_font(["C:/Windows/Fonts/seguibl.ttf", "arialbd.ttf"], 36)
    raw_head = heading if heading else topic
    words = raw_head.split()
    lines = []
    cur_line = []
    for w in words:
        cur_line.append(w)
        if len(" ".join(cur_line)) > 23:
            lines.append(" ".join(cur_line[:-1]))
            cur_line = [w]
    if cur_line:
        lines.append(" ".join(cur_line))
    lines = lines[:3]

    cur_y = 180
    for i, line in enumerate(lines):
        color = t["text_accent"] if (i == len(lines)-1 or any(k in line.lower() for k in ["10x", "ai", "autopilot", "smart", "hours", "calls", "invoicing", "leads", "revenue", "grow"])) else t["text_primary"]
        draw.text((50, cur_y), line, fill=color, font=font_headline)
        cur_y += 50

    # Big "AI Can." punchline
    font_punch = get_system_font(["C:/Windows/Fonts/seguibl.ttf", "arialbd.ttf"], 44)
    draw.text((50, cur_y), "AI Can.", fill=t["text_accent"], font=font_punch)
    cur_y += 62

    # Accent divider dashes
    draw.line([50, cur_y, 110, cur_y], fill=t["text_accent"], width=3)
    draw.line([118, cur_y, 130, cur_y], fill=t["btn_shine"], width=3)
    cur_y += 18

    # Subtext / bullet detail
    font_desc = get_system_font(["C:/Windows/Fonts/segoeui.ttf", "arial.ttf"], 18)
    subtext = details[0] if (details and len(details) > 0) else "Automate repetitive customer workflows, data entry, and smart follow-ups with 24/7 autonomous AI agents."
    dwords = subtext.split()
    dlines = []
    dcur = []
    for dw in dwords:
        dcur.append(dw)
        if len(" ".join(dcur)) > 35:
            dlines.append(" ".join(dcur[:-1]))
            dcur = [dw]
    if dcur:
        dlines.append(" ".join(dcur))
    for dline in dlines[:3]:
        draw.text((50, cur_y), dline, fill=t["text_secondary"], font=font_desc)
        cur_y += 26

    # Call to Action Button
    cur_y += 18
    btn_w, btn_h = 310, 56
    draw.rounded_rectangle([50, cur_y, 50 + btn_w, cur_y + btn_h], radius=16, fill=t["btn_bg"])
    draw.rounded_rectangle([52, cur_y + 2, 50 + btn_w - 2, cur_y + 18], radius=14, fill=t["btn_shine"])
    
    draw_vector_icon(draw, "calendar", 72, cur_y + 17, 22, t["btn_text"])
    font_btn = get_system_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 20)
    draw.text((106, cur_y + 14), "Book a Demo  >", fill=t["btn_text"], font=font_btn)

    # Right Hero Visual Card (x: 580 to 1030, y: 135 to 630)
    card_x0, card_y0, card_x1, card_y1 = 580, 135, 1030, 630
    draw.rounded_rectangle([card_x0 + 4, card_y0 + 6, card_x1 + 4, card_y1 + 6], radius=24, fill=t["card_shadow"])
    draw.rounded_rectangle([card_x0, card_y0, card_x1, card_y1], radius=24, fill=t["card_bg"], outline=t["card_border"], width=2)

    # Paste 3D Art Asset
    art_path = hero_image_path
    if not art_path or not os.path.exists(art_path):
        media_dir = get_media_dir()
        art_filename = HERO_ART_ASSETS[theme_idx % len(HERO_ART_ASSETS)]
        art_path = os.path.join(media_dir, art_filename)

    if art_path and os.path.exists(art_path):
        try:
            art = Image.open(art_path).convert("RGB")
            target_w = card_x1 - card_x0 - 24
            target_h = card_y1 - card_y0 - 24
            art_resized = art.resize((target_w, target_h), Image.Resampling.LANCZOS)
            canvas.paste(art_resized, (card_x0 + 12, card_y0 + 12))
            draw.rounded_rectangle([card_x0 + 12, card_y0 + 12, card_x1 - 12, card_y1 - 12], radius=16, outline=t["card_border"], width=2)
        except Exception as e:
            print("Art paste error:", e)

    # Floating Badge on Artwork
    badge_x0, badge_y0 = card_x0 + 24, card_y1 - 65
    badge_bg = (15, 23, 42, 240) if not t["is_dark"] else (7, 10, 19, 240)
    draw.rounded_rectangle([badge_x0, badge_y0, badge_x0 + 240, badge_y0 + 42], radius=12, fill=badge_bg)
    draw_vector_icon(draw, "lightning", badge_x0 + 14, badge_y0 + 11, 20, t["text_accent"])
    font_badge = get_system_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 15)
    draw.text((badge_x0 + 42, badge_y0 + 10), "100% Autopilot Active", fill=t["text_accent"], font=font_badge)

    # 3. FEATURE CARDS (y: 655 to 815)
    feat_y0, feat_y1 = 655, 815
    draw.rounded_rectangle([54, feat_y0 + 4, width - 46, feat_y1 + 4], radius=20, fill=t["card_shadow"])
    draw.rounded_rectangle([50, feat_y0, width - 50, feat_y1], radius=20, fill=t["card_bg"], outline=t["card_border"], width=2)

    feat_items = [
        {"icon": "lightning", "title": "24/7 Autopilot", "desc": "Never miss a lead"},
        {"icon": "clock", "title": "Instant Reply", "desc": "< 1s response time"},
        {"icon": "chart", "title": "10x Growth", "desc": "Max conversions"},
        {"icon": "globe", "title": "Multi-Platform", "desc": "Omnichannel sync"}
    ]
    col_w = (width - 100) // 4
    for idx, f in enumerate(feat_items):
        cx = 50 + idx * col_w
        ic_x, ic_y = cx + 18, feat_y0 + 35
        draw.ellipse([ic_x, ic_y, ic_x + 52, ic_y + 52], fill=t["icon_bg"], outline=t["icon_border"], width=2)
        draw_vector_icon(draw, f["icon"], ic_x + 13, ic_y + 13, 26, t["icon_color"])

        font_ftitle = get_system_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 16)
        draw.text((cx + 78, feat_y0 + 38), f["title"], fill=t["text_primary"], font=font_ftitle)
        font_fdesc = get_system_font(["C:/Windows/Fonts/segoeui.ttf", "arial.ttf"], 13)
        draw.text((cx + 78, feat_y0 + 64), f["desc"], fill=t["text_secondary"], font=font_fdesc)

        if idx < 3:
            div_col = (30, 41, 59) if t["is_dark"] else (241, 245, 249)
            draw.line([cx + col_w - 6, feat_y0 + 25, cx + col_w - 6, feat_y1 - 25], fill=div_col, width=2)

    # 4. BOTTOM NAVY WAVE BANNER (y: 835 to 995)
    banner_y0, banner_y1 = 835, 995
    draw.rounded_rectangle([50, banner_y0, width - 50, banner_y1], radius=22, fill=t["banner_bg"])
    
    font_btitle = get_system_font(["C:/Windows/Fonts/seguibl.ttf", "arialbd.ttf"], 21)
    banner_headline = "LET AI HANDLE YOUR OPERATIONS, SO YOU CAN FOCUS ON GROWTH."
    draw.text((80, banner_y0 + 26), banner_headline, fill=t["banner_text"], font=font_btitle)

    industries = ["Retail", "Real Estate", "Healthcare", "Education", "Finance", "SaaS"]
    font_ind = get_system_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 15)
    ind_x = 80
    for ind in industries:
        ind_bbox = draw.textbbox((0, 0), ind, font=font_ind)
        iw = ind_bbox[2] - ind_bbox[0] + 32
        draw.rounded_rectangle([ind_x, banner_y0 + 80, ind_x + iw, banner_y0 + 118], radius=10, fill=t["banner_pill"])
        draw_vector_icon(draw, "check", ind_x + 10, banner_y0 + 94, 16, t["banner_text"])
        draw.text((ind_x + 28, banner_y0 + 89), ind, fill=(226, 232, 240), font=font_ind)
        ind_x += iw + 12

    # 5. FOOTER (y: 1015 to 1060)
    font_footer = get_system_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 15)
    draw.text((50, 1025), f"{website}   •   {phone}", fill=t["text_accent"], font=font_footer)
    
    slogan_right = "Smarter Conversations. Stronger Businesses."
    s_bbox = draw.textbbox((0, 0), slogan_right, font=font_footer)
    sw = s_bbox[2] - s_bbox[0]
    draw.text((width - 50 - sw, 1025), slogan_right, fill=sub_fill, font=font_footer)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    canvas.save(output_path, "JPEG", quality=95)
    return output_path

def generate_social_card(
    topic: str,
    details: Optional[List[str]] = None,
    cta_text: Optional[str] = None,
    company: str = "InfiniteTech AI",
    website: str = "www.infinitetechai.com",
    phone: str = "+91-9884777171",
    bg_image_path: Optional[str] = None,
    output_path: str = "test_social_card.jpg",
    palette_idx: int = 0,
    engine_provider: Optional[str] = "procedural",
    ai_prompt: Optional[str] = None,
    ai_style: Optional[str] = "3d_tech",
    description: Optional[str] = None
) -> str:
    """
    Renders high-converting, agency-grade marketing flyers matching the InfiniteTech AI brand.
    Uses the 20 distinct design templates from MarketingImageComposer to ensure dynamic visual compositions.
    Supports Free Cloud AI visuals from Pollinations.ai (Flux.1).
    """
    try:
        from app.services.image_engine.composer import MarketingImageComposer
        template_id = (abs(palette_idx) % 20) + 1
        composer = MarketingImageComposer(template_id=template_id, aspect_ratio="1:1")
        
        desc = (description or "").strip()
        if not desc and details and len(details) > 0:
            desc = str(details[0])
            
        post_data = {
            "title": topic,
            "description": desc or f"Autonomous operations and workflow automation by {company}.",
            "benefits": details if (details and len(details) >= 2) else [],
            "cta": cta_text or "Book a Demo",
            "company": company,
            "website": website,
            "phone": phone
        }

        # Handle Pollinations Free AI visual if requested
        if engine_provider in ("pollinations", "free_ai"):
            try:
                from app.services.image_engine.pollinations_service import PollinationsService
                import uuid
                ai_dir = os.path.dirname(os.path.abspath(output_path))
                temp_ai_path = os.path.join(ai_dir, f"ai_hero_{uuid.uuid4().hex[:8]}.png")
                res = PollinationsService.generate_and_save(
                    topic=topic,
                    output_path=temp_ai_path,
                    style=ai_style or "3d_tech",
                    custom_prompt=ai_prompt,
                    width=1024,
                    height=1024
                )
                if res and os.path.exists(res):
                    post_data["ai_hero_image_path"] = res
                    post_data["engine_provider"] = "pollinations"
            except Exception as e:
                print(f"Pollinations AI hero generation failed in generate_social_card: {e}")

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        composer.render(post_data, output_path)
        return output_path
    except Exception as e:
        print(f"MarketingImageComposer error, falling back to master flyer: {e}")
        media_dir = get_media_dir()
        hero_art = os.path.join(media_dir, HERO_ART_ASSETS[palette_idx % len(HERO_ART_ASSETS)])
        heading = topic.split(":", 1)[0].strip() if ":" in topic else topic
        return render_master_infinitetech_flyer(
            topic=topic,
            heading=heading,
            details=details or ["Eliminate 15+ hours of repetitive manual tasks every week"],
            cta_text=cta_text or "Book a Demo >",
            theme_idx=palette_idx,
            company=company,
            website=website,
            phone=phone,
            hero_image_path=hero_art,
            output_path=output_path
        )
