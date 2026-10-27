import os
import sys
from PIL import Image, ImageDraw, ImageFont

# Add backend directory to sys.path
backend_dir = os.path.abspath(r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\backend")
sys.path.insert(0, backend_dir)

from app.services.image_engine.constants import get_system_font, draw_vector_icon

def draw_3d_phone_on_podium(draw: ImageDraw.ImageDraw, cx: int, cy: int, pw: int = 250, ph: int = 430, is_dark: bool = False):
    """
    Renders an exceptionally high-detail 3D smartphone on a glowing cylindrical podium
    with audio frequency soundwaves and a cute AI Robot Agent avatar on screen.
    """
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

    # 2. Audio Waveform Equalizer Soundwaves radiating behind phone
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

    # 3. Smartphone Outer Body
    px0 = cx - pw // 2
    py0 = cy - ph // 2
    px1 = px0 + pw
    py1 = py0 + ph

    # Phone drop shadow
    draw.rounded_rectangle([px0 + 6, py0 + 8, px1 + 6, py1 + 8], radius=32, fill=(15, 23, 42, 60) if not is_dark else (0, 0, 0, 100))
    # Phone outer frame (metallic titanium)
    draw.rounded_rectangle([px0, py0, px1, py1], radius=32, fill=(30, 41, 59), outline=(13, 148, 136) if not is_dark else (45, 212, 191), width=4)
    # Inner phone bezel
    draw.rounded_rectangle([px0 + 5, py0 + 5, px1 - 5, py1 - 5], radius=28, fill=(15, 23, 42), outline=(148, 163, 184), width=1)
    # Screen glass
    screen_bg = (255, 255, 255) if not is_dark else (15, 23, 42)
    draw.rounded_rectangle([px0 + 9, py0 + 9, px1 - 9, py1 - 9], radius=25, fill=screen_bg)

    # Top Dynamic Island / Speaker Pill
    draw.rounded_rectangle([cx - 28, py0 + 16, cx + 28, py0 + 26], radius=5, fill=(15, 23, 42))
    # Camera lens dot
    draw.ellipse([cx + 14, py0 + 18, cx + 20, py0 + 24], fill=(30, 41, 59))

    # 4. Inside Screen Elements
    # Header: "SkyPro"
    font_brand = get_system_font(21, bold=True)
    draw.text((cx - 36, py0 + 40), "SkyPro", fill=(13, 148, 136) if not is_dark else (45, 212, 191), font=font_brand)
    font_sub = get_system_font(12, bold=False)
    draw.text((cx - 44, py0 + 65), "AI Calling Agent", fill=(100, 116, 139), font=font_sub)

    # 5. Cute 3D Robot Agent Avatar
    robot_cy = py0 + 135
    head_w, head_h = 76, 60
    # Over-ear headphones band
    draw.arc([cx - head_w // 2 - 8, robot_cy - head_h // 2 - 12, cx + head_w // 2 + 8, robot_cy + 10], start=180, end=360, fill=(15, 23, 42), width=5)
    # Earcups
    draw.rounded_rectangle([cx - head_w // 2 - 12, robot_cy - 16, cx - head_w // 2 - 2, robot_cy + 16], radius=4, fill=(13, 148, 136))
    draw.rounded_rectangle([cx + head_w // 2 + 2, robot_cy - 16, cx + head_w // 2 + 12, robot_cy + 16], radius=4, fill=(13, 148, 136))
    # Mic boom extending toward mouth
    draw.line([cx + head_w // 2 + 4, robot_cy + 10, cx + 18, robot_cy + 24], fill=(15, 23, 42), width=3)
    draw.ellipse([cx + 14, robot_cy + 22, cx + 22, robot_cy + 28], fill=(13, 148, 136))

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

    # 6. Mini Soundwave on Screen
    screen_wave_y = robot_cy + 52
    for i, bh in enumerate([8, 14, 24, 30, 22, 16, 26, 12, 6]):
        draw.line([(cx - 36 + i * 9, screen_wave_y - bh // 2), (cx - 36 + i * 9, screen_wave_y + bh // 2)], fill=(13, 148, 136), width=3)

    # Status: "Listening... Talking... Converting..."
    font_status = get_system_font(11, bold=True)
    draw.text((cx - 30, screen_wave_y + 22), "Listening...", fill=(71, 85, 105), font=font_status)
    draw.text((cx - 55, screen_wave_y + 38), "Talking... Converting...", fill=(100, 116, 139), font=get_system_font(10, bold=False))

    # 7. Call Action Buttons
    btn_y = py1 - 50
    btn_r = 20
    # Red decline button
    draw.ellipse([cx - 48 - btn_r, btn_y - btn_r, cx - 48 + btn_r, btn_y + btn_r], fill=(220, 38, 38))
    draw_vector_icon(draw, "phone", cx - 48 - 10, btn_y - 10, 20, (255, 255, 255))
    # Green accept button with pulse ring
    draw.ellipse([cx + 0 - btn_r - 4, btn_y - btn_r - 4, cx + 0 + btn_r + 4, btn_y + btn_r + 4], outline=(34, 197, 94, 120), width=2)
    draw.ellipse([cx + 0 - btn_r, btn_y - btn_r, cx + 0 + btn_r, btn_y + btn_r], fill=(22, 163, 74))
    draw_vector_icon(draw, "phone", cx + 0 - 10, btn_y - 10, 20, (255, 255, 255))
    # 3-dots button
    draw.ellipse([cx + 48 - btn_r, btn_y - btn_r, cx + 48 + btn_r, btn_y + btn_r], fill=(241, 245, 249) if not is_dark else (30, 41, 59))
    for dx in [-6, 0, 6]:
        draw.ellipse([cx + 48 + dx - 2, btn_y - 2, cx + 48 + dx + 2, btn_y + 2], fill=(100, 116, 139))

def draw_4_floating_feature_cards(draw: ImageDraw.ImageDraw, benefits: list, x_start: int, y_start: int, total_width: int, is_dark: bool = False):
    """
    Renders the 4 floating white benefit cards with circular mint icon containers,
    crisp vector icons, bold title, and secondary bullet text.
    """
    gap = 14
    card_w = (total_width - 3 * gap) // 4
    card_h = 135

    default_benefits = [
        {"title": "More Calls", "sub": "Never miss\na customer", "icon": "phone"},
        {"title": "Faster Follow-ups", "sub": "Turn leads\ninto customers", "icon": "clock"},
        {"title": "Higher Conversions", "sub": "Boost business\ngrowth", "icon": "chart"},
        {"title": "Multilingual", "sub": "Connect with\nany audience", "icon": "globe"},
    ]

    items = benefits if benefits and len(benefits) >= 4 else default_benefits

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
        draw.ellipse([ic_cx - ic_r, ic_cy - ic_r, ic_cx + ic_r, ic_cy + ic_r], fill=(224, 247, 244) if not is_dark else (15, 23, 42), outline=(13, 148, 136), width=1)
        draw_vector_icon(draw, item.get("icon", "check"), ic_cx - 12, ic_cy - 12, 24, (13, 148, 136) if not is_dark else (45, 212, 191))

        # Title
        font_title = get_system_font(14, bold=True)
        title_text = item.get("title", "Feature")
        t_box = draw.textbbox((0, 0), title_text, font=font_title)
        draw.text((cx0 + (card_w - (t_box[2] - t_box[0])) // 2, cy0 + 60), title_text, fill=(15, 23, 42) if not is_dark else (255, 255, 255), font=font_title)

        # Subtext
        font_sub = get_system_font(11, bold=False)
        sub_text = item.get("sub", "")
        lines = sub_text.split("\n")
        sy = cy0 + 84
        for sline in lines[:2]:
            s_box = draw.textbbox((0, 0), sline, font=font_sub)
            draw.text((cx0 + (card_w - (s_box[2] - s_box[0])) // 2, sy), sline, fill=(100, 116, 139) if not is_dark else (148, 163, 184), font=font_sub)
            sy += 16

def draw_dark_industry_wave_banner(draw: ImageDraw.ImageDraw, y_pos: int, width: int, height: int):
    """
    Renders the rich dark-navy wave banner with the inspirational headline
    and the horizontal industry icons (Retail, Real Estate, Healthcare, Education, Finance).
    """
    # Dark curved banner
    draw.rectangle([0, y_pos, width, y_pos + height], fill=(15, 23, 42))

    # Left Headline
    font_h1 = get_system_font(14, bold=True)
    draw.text((45, y_pos + 16), "LET AI HANDLE YOUR CALLS, SO YOU CAN FOCUS ON", fill=(255, 255, 255), font=font_h1)
    font_h2 = get_system_font(18, bold=True)
    draw.text((45, y_pos + 38), "WHAT MATTERS MOST.", fill=(45, 212, 191), font=font_h2)

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

def generate_reference_quality_flyer(output_path: str):
    canvas = Image.new("RGBA", (1080, 1080), (245, 252, 252, 255))
    draw = ImageDraw.Draw(canvas)

    # Ambient radial soft glow behind the podium
    cx_glow, cy_glow = 750, 420
    for r in range(320, 50, -30):
        draw.ellipse([cx_glow - r, cy_glow - r, cx_glow + r, cy_glow + r], fill=(204, 251, 241, 35))

    # 1. Top Header: Brand Logo Left + Script Callout Right
    # Brand Logo
    draw.text((50, 42), "INFINITE TECH", fill=(13, 148, 136), font=get_system_font(28, bold=True))
    draw.text((50, 78), "AI  |  AUTOMATION  |  A SMARTER TOMORROW", fill=(100, 116, 139), font=get_system_font(11, bold=True))

    # Cursive callout right
    font_callout = get_system_font(20, bold=True, serif=True)
    draw.text((740, 44), "Let AI Do the Calling\nFor You!", fill=(15, 23, 42), font=font_callout)
    # Curved arrow pointing to phone
    draw.arc([880, 80, 940, 130], start=90, end=270, fill=(13, 148, 136), width=2)

    # 2. Left Column: Multi-Color High-Impact Typography
    lx = 50
    ly = 135

    # Pre-headline
    draw.text((lx, ly), "Your Business", fill=(15, 23, 42), font=get_system_font(34, bold=True))
    ly += 42
    draw.text((lx, ly), "Can't Miss", fill=(15, 23, 42), font=get_system_font(34, bold=True))
    ly += 55

    # Massive Emerald/Teal Headline
    font_huge = get_system_font(52, bold=True)
    draw.text((lx, ly), "50,000 Calls", fill=(13, 148, 136), font=font_huge)
    ly += 60
    draw.text((lx, ly), "Every Morning.", fill=(13, 148, 136), font=font_huge)
    ly += 65
    draw.text((lx, ly), "AI Can.", fill=(15, 118, 110), font=get_system_font(56, bold=True))
    ly += 75

    # Description text
    desc_p1 = "Automate customer calls, lead follow-ups, reminders"
    desc_p2 = "and collections with "
    desc_p3 = "AI Voice Agents."
    draw.text((lx, ly), desc_p1, fill=(51, 65, 85), font=get_system_font(17, bold=False))
    ly += 24
    draw.text((lx, ly), desc_p2, fill=(51, 65, 85), font=get_system_font(17, bold=False))
    p2_w = draw.textbbox((0, 0), desc_p2, font=get_system_font(17, bold=False))[2]
    draw.text((lx + p2_w, ly), desc_p3, fill=(13, 148, 136), font=get_system_font(17, bold=True))
    ly += 30

    draw.text((lx, ly), "Turn every call into an opportunity.", fill=(100, 116, 139), font=get_system_font(16, bold=False))
    ly += 38

    # CTA Button
    btn_w = 260
    btn_h = 56
    draw.rounded_rectangle([lx, ly, lx + btn_w, ly + btn_h], radius=14, fill=(13, 148, 136), outline=(255, 255, 255), width=2)
    draw_vector_icon(draw, "calendar", lx + 18, ly + 16, 24, (255, 255, 255))
    draw.text((lx + 54, ly + 15), "Book a Demo  >", fill=(255, 255, 255), font=get_system_font(20, bold=True))

    # 3. Right Column: 3D Smartphone on Podium
    draw_3d_phone_on_podium(draw, cx=760, cy=385, pw=240, ph=420)

    # 4. Floating Feature Cards
    draw_4_floating_feature_cards(draw, [], x_start=50, y_start=680, total_width=980)

    # 5. Dark Wave Industry Banner
    draw_dark_industry_wave_banner(draw, y_pos=840, width=1080, height=80)

    # 6. Bottom Website Footer
    draw.rectangle([0, 920, 1080, 1080], fill=(255, 255, 255))
    draw_vector_icon(draw, "globe", 50, 955, 22, (13, 148, 136))
    draw.text((82, 954), "www.infinitetechai.com", fill=(15, 23, 42), font=get_system_font(16, bold=True))
    draw.text((620, 954), "Smarter Conversations. Stronger Businesses.", fill=(71, 85, 105), font=get_system_font(15, bold=False))
    draw.line([980, 963, 1030, 963], fill=(13, 148, 136), width=3)

    canvas.convert("RGB").save(output_path, "PNG", quality=95)
    print(f"Generated Reference Quality Flyer at {output_path}")

if __name__ == "__main__":
    out_dir = r"C:\Users\katana\.gemini\antigravity-ide\scratch\socialpilot-ai\storage\media"
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "test_reference_quality_flyer.png")
    generate_reference_quality_flyer(out_file)
