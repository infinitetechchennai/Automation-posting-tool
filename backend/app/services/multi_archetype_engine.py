import os
import math
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

BACKGROUND_LIBRARY = [
    {
        "filename": "bg_ai_neural_core.jpg",
        "tag": "AI • AGENTIC WORKFLOWS",
        "accent_color": (99, 102, 241),   # Indigo
        "highlight_color": (168, 85, 247), # Purple
        "btn_color": (79, 70, 229)
    },
    {
        "filename": "bg_ai_finance_ledger.jpg",
        "tag": "AI • INVOICING & FINANCE",
        "accent_color": (16, 185, 129),   # Emerald
        "highlight_color": (52, 211, 153), # Light Emerald
        "btn_color": (5, 150, 105)
    },
    {
        "filename": "bg_ai_calendar_clock.jpg",
        "tag": "AI • SMART SCHEDULING",
        "accent_color": (245, 158, 11),   # Amber
        "highlight_color": (251, 191, 36), # Light Amber
        "btn_color": (217, 119, 6)
    },
    {
        "filename": "bg_ai_voice_waves.jpg",
        "tag": "AI • VOICE & RECEPTIONIST",
        "accent_color": (236, 72, 153),   # Pink/Magenta
        "highlight_color": (6, 182, 212),  # Cyan
        "btn_color": (219, 39, 119)
    },
    {
        "filename": "bg_ai_ops_matrix.jpg",
        "tag": "AI • ENTERPRISE OPERATIONS",
        "accent_color": (6, 182, 212),    # Cyan
        "highlight_color": (59, 130, 246), # Electric Blue
        "btn_color": (14, 116, 144)
    }
]

def get_system_font(names: List[str], size: int) -> ImageFont.ImageFont:
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return ImageFont.load_default()

def wrap_text(text: str, max_chars_per_line: int = 26) -> List[str]:
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

def load_or_create_background(bg_filename: str, width: int = 1080, height: int = 1080, palette_idx: int = 0) -> Image.Image:
    media_dir = get_media_dir()
    full_path = os.path.join(media_dir, bg_filename)
    if os.path.exists(full_path):
        try:
            base_bg = Image.open(full_path).convert("RGBA")
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

            return base_bg.resize((width, height), Image.Resampling.LANCZOS)
        except Exception:
            pass

    # Procedural fallback gradient
    img = Image.new("RGBA", (width, height), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)
    colors = [
        ((30, 27, 75), (15, 23, 42)),
        ((6, 78, 59), (15, 23, 42)),
        ((120, 53, 15), (15, 23, 42)),
        ((88, 28, 135), (15, 23, 42)),
        ((12, 74, 96), (15, 23, 42))
    ]
    c1, c2 = colors[palette_idx % len(colors)]
    for y in range(height):
        r = int(c1[0] + (c2[0] - c1[0]) * (y / height))
        g = int(c1[1] + (c2[1] - c1[1]) * (y / height))
        b = int(c1[2] + (c2[2] - c1[2]) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))
    return img

print("Setup completed")
