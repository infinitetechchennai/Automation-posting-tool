import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MEDIA_DIR = os.path.abspath("storage/media")

BG_MAPPINGS = [
    {
        "keywords": ["invoice", "invoicing", "payment", "billing", "finance", "accounting", "money"],
        "filename": "ai_invoicing_automation.jpg",
        "tag": "AI • INVOICING & FINANCE",
        "default_details": [
            "100% Automated Invoicing with Zero Data Entry Errors",
            "Instant WhatsApp & Email Reminders for Faster Client Payments"
        ]
    },
    {
        "keywords": ["schedule", "scheduling", "calendar", "booking", "meeting", "appointment", "time"],
        "filename": "ai_smart_scheduling.jpg",
        "tag": "AI • SMART SCHEDULING",
        "default_details": [
            "Seamless 24/7 Smart Calendar Sync Across All Platforms",
            "Zero Double Bookings & Autonomous AI Follow-Up Reminders"
        ]
    },
    {
        "keywords": ["burnout", "growth", "scale", "scale-up", "revenue", "productivity", "profit", "executive"],
        "filename": "ai_burnout_to_growth.jpg",
        "tag": "AI • BUSINESS GROWTH",
        "default_details": [
            "Eliminate 70% Administrative Burnout and Focus on Growth",
            "Autonomous Multi-Platform Scaling for Modern Enterprises"
        ]
    },
    {
        "keywords": ["chaos", "control", "streamline", "workflow", "automate", "automation", "operations", "system"],
        "filename": "ai_chaos_to_control.jpg",
        "tag": "AI • OPERATIONS & WORKFLOW",
        "default_details": [
            "Turn Everyday Operational Delays into Seamless Auto-Pilot",
            "Unified AI Agents for Marketing, Invoicing, and Customer Care"
        ]
    }
]

def find_best_bg(topic: str) -> dict:
    t_lower = topic.lower()
    for item in BG_MAPPINGS:
        for kw in item["keywords"]:
            if kw in t_lower:
                full_path = os.path.join(MEDIA_DIR, item["filename"])
                if os.path.exists(full_path):
                    return {
                        "path": full_path,
                        "tag": item["tag"],
                        "details": item["default_details"]
                    }
    # Fallback to first existing
    for item in BG_MAPPINGS:
        full_path = os.path.join(MEDIA_DIR, item["filename"])
        if os.path.exists(full_path):
            return {
                "path": full_path,
                "tag": item["tag"],
                "details": item["default_details"]
            }
    return None

def wrap_text(text: str, max_chars_per_line: int = 24) -> list[str]:
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

def create_marketing_flyer(
    topic: str,
    details: list[str] = None,
    cta_text: str = None,
    company: str = "InfiniteTech AI",
    website: str = "www.infinitetechai.com",
    phone: str = "+91-9884777171",
    bg_image_path: str = None,
    output_path: str = "test_flyer.png",
    palette_idx: int = 0
) -> str:
    width, height = 1080, 1080

    bg_info = find_best_bg(topic)
    if not bg_image_path and bg_info:
        bg_image_path = bg_info["path"]
        category_tag = bg_info["tag"]
        if not details:
            details = bg_info["details"]
    else:
        category_tag = "AI • AUTOMATION & GROWTH"
        if not details:
            details = [
                "Automate repetitive daily operations with ₹0 extra overhead",
                "Work smarter, save 70% admin time, and scale faster"
            ]

    if not cta_text:
        cta_text = f"GET STARTED NOW: {website.upper()} | {phone}  >"

    # 1. Base image: Real AI Background photo/render
    if bg_image_path and os.path.exists(bg_image_path):
        base_bg = Image.open(bg_image_path).convert("RGBA")
        # Resize and center crop to 1080x1080
        src_w, src_h = base_bg.size
        target_ratio = width / height
        src_ratio = src_w / src_h

        if src_ratio > target_ratio:
            new_w = int(src_h * target_ratio)
            left = (src_w - new_w) // 2
            base_bg = base_bg.crop((left, 0, left + new_w, src_h))
        else:
            new_h = int(src_w / target_ratio)
            top = (src_h - new_h) // 2
            base_bg = base_bg.crop((0, top, src_w, top + new_h))

        base_bg = base_bg.resize((width, height), Image.Resampling.LANCZOS)
    else:
        # Fallback dark gradient canvas
        base_bg = Image.new("RGBA", (width, height), (15, 23, 42, 255))

    # 2. Add rich dark contrast gradient so bottom text & glass container are 100% readable
    # Top has subtle vignette (0 to 140 alpha), bottom has dark translucent fill (180 to 240 alpha)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(overlay)

    # Vertical gradient overlay
    for y in range(height):
        if y < 350:
            # Top area: slight dark overlay so brand tags pop
            alpha = int(120 * (1 - y / 350) + 40 * (y / 350))
        elif y < 550:
            # Middle-top: transparent window for the 3D visual to shine
            progress = (y - 350) / 200
            alpha = int(40 + progress * 80)
        else:
            # Lower half: high-contrast dark backdrop for title, details, and CTA button
            progress = (y - 550) / (height - 550)
            alpha = int(120 + progress * 125) # Reaches ~245 alpha at bottom
        odraw.line([(0, y), (width, y)], fill=(10, 15, 29, alpha))

    base_bg = Image.alpha_composite(base_bg, overlay)

    # Fonts loading
    def get_font(name_or_list, size):
        if isinstance(name_or_list, str):
            name_or_list = [name_or_list]
        for name in name_or_list:
            try:
                return ImageFont.truetype(name, size)
            except Exception:
                pass
        return ImageFont.load_default()

    font_brand = get_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 22)
    font_tag = get_font(["C:/Windows/Fonts/segoeui.ttf", "arial.ttf"], 18)
    font_title = get_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 44)
    font_bullet_title = get_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 22)
    font_cta = get_font(["C:/Windows/Fonts/segoeuib.ttf", "arialbd.ttf"], 23)
    font_footer = get_font(["C:/Windows/Fonts/segoeui.ttf", "arial.ttf"], 18)

    draw = ImageDraw.Draw(base_bg)

    # 3. Top Header Bar: Brand Badge & Category
    pill_x, pill_y = 60, 50
    pill_w, pill_h = 240, 48
    draw.rounded_rectangle(
        [pill_x, pill_y, pill_x + pill_w, pill_y + pill_h],
        radius=24,
        fill=(30, 41, 59, 220),
        outline=(99, 102, 241, 255),
        width=2
    )
    draw.text((pill_x + 24, pill_y + 11), company.upper(), fill=(255, 255, 255), font=font_brand)

    # Category Pill on Top Right
    tag_w = 300
    tag_x = width - 60 - tag_w
    draw.rounded_rectangle(
        [tag_x, pill_y, tag_x + tag_w, pill_y + pill_h],
        radius=24,
        fill=(15, 23, 42, 210),
        outline=(6, 182, 212, 230),
        width=1
    )
    draw.text((tag_x + 22, pill_y + 13), category_tag, fill=(56, 189, 248), font=font_tag)

    # 4. Glassmorphic Card for Lower Section (Headline + Details + CTA)
    card_x0 = 50
    card_y0 = 480
    card_x1 = width - 50
    card_y1 = height - 50
    card_radius = 28

    # Frosted glass panel
    glass = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glass)
    gdraw.rounded_rectangle(
        [card_x0, card_y0, card_x1, card_y1],
        radius=card_radius,
        fill=(13, 20, 38, 225),
        outline=(99, 102, 241, 160),
        width=2
    )
    base_bg = Image.alpha_composite(base_bg, glass)
    draw = ImageDraw.Draw(base_bg)

    # 5. Topic Headline (Clean, wrapped, bold)
    clean_topic = topic.replace("| InfiniteTech AI", "").replace("Accelerate Growth with ", "").strip()
    title_lines = wrap_text(clean_topic, max_chars_per_line=28)
    # Take max 2-3 lines so it fits gracefully
    if len(title_lines) > 3:
        title_lines = title_lines[:3]
        title_lines[2] = title_lines[2] + "..."

    cur_y = card_y0 + 35
    # Small topic pre-badge
    pre_badge_w = 200
    draw.rounded_rectangle(
        [card_x0 + 35, cur_y, card_x0 + 35 + pre_badge_w, cur_y + 30],
        radius=8,
        fill=(30, 27, 75, 255),
        outline=(129, 140, 248, 200),
        width=1
    )
    draw.text((card_x0 + 47, cur_y + 5), "TOPIC SPOTLIGHT", fill=(192, 132, 252), font=get_font("arialbd.ttf", 15))

    cur_y += 45
    for line in title_lines:
        # Draw subtle drop shadow for maximum crispness
        draw.text((card_x0 + 36, cur_y + 2), line, fill=(0, 0, 0, 200), font=font_title)
        draw.text((card_x0 + 35, cur_y), line, fill=(255, 255, 255), font=font_title)
        cur_y += 54

    cur_y += 10
    # Subtle divider
    draw.line([card_x0 + 35, cur_y, card_x1 - 35, cur_y], fill=(51, 65, 85, 200), width=1)
    cur_y += 22

    # 6. Detail Bullet Points
    if details:
        for item in details[:2]:
            # Draw glowing bullet icon (cyan circle)
            bullet_cx = card_x0 + 50
            bullet_cy = cur_y + 12
            draw.ellipse([bullet_cx - 6, bullet_cy - 6, bullet_cx + 6, bullet_cy + 6], fill=(6, 182, 212))
            draw.ellipse([bullet_cx - 3, bullet_cy - 3, bullet_cx + 3, bullet_cy + 3], fill=(255, 255, 255))

            # Detail text
            detail_lines = wrap_text(item, max_chars_per_line=48)
            for dline in detail_lines:
                draw.text((card_x0 + 72, cur_y), dline, fill=(226, 232, 240), font=font_bullet_title)
                cur_y += 32
            cur_y += 8

    # 7. CALL TO ACTION (CTA) BUTTON!
    # Prominent, vibrant, clickable-style CTA button
    btn_h = 68
    btn_y = card_y1 - btn_h - 40
    btn_x0 = card_x0 + 35
    btn_x1 = card_x1 - 35

    # Glowing button fill with gradient effect
    draw.rounded_rectangle(
        [btn_x0, btn_y, btn_x1, btn_y + btn_h],
        radius=18,
        fill=(79, 70, 229), # Indigo 600
        outline=(165, 180, 252), # Indigo 300 accent border
        width=2
    )

    # Inner subtle highlight for 3D depth
    draw.line([btn_x0 + 15, btn_y + 3, btn_x1 - 15, btn_y + 3], fill=(129, 140, 248), width=2)

    # Clean button text centered
    cta_display = cta_text.strip()
    cta_bbox = draw.textbbox((0, 0), cta_display, font=font_cta)
    cta_text_w = cta_bbox[2] - cta_bbox[0]
    cta_text_x = btn_x0 + (btn_x1 - btn_x0 - cta_text_w) // 2
    cta_text_y = btn_y + (btn_h - (cta_bbox[3] - cta_bbox[1])) // 2 - 2

    # Draw button text with slight shadow
    draw.text((cta_text_x + 1, cta_text_y + 1), cta_display, fill=(30, 27, 75), font=font_cta)
    draw.text((cta_text_x, cta_text_y), cta_display, fill=(255, 255, 255), font=font_cta)

    # 8. Subtle micro footer below button
    footer_text = f"Enterprise Operations • 24/7 Autopilot • {company}"
    draw.text((btn_x0 + 10, btn_y + btn_h + 12), footer_text, fill=(148, 163, 184), font=font_footer)

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    base_bg.convert("RGB").save(output_path, "PNG", quality=95)
    return output_path

if __name__ == "__main__":
    test_topics = [
        "From Chaos to Control: How AI Streamlines Invoicing and Scheduling",
        "Smart Scheduling: Say Goodbye to Double Bookings Forever",
        "Eliminate Administrative Burnout: Scale Your Revenue 10x"
    ]
    for idx, t in enumerate(test_topics):
        out = f"storage/media/test_output_flyer_{idx+1}.png"
        res = create_marketing_flyer(topic=t, output_path=out)
        print("Generated flyer:", res)
