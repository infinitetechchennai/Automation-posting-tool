"""
constants.py - 20 Design Families, Color Palettes, Dimension Ratios, and Vector Icon Renderers
for the AI Social Media Content Automation Platform.
"""

from typing import Dict, Any, List, Tuple
from PIL import Image, ImageDraw, ImageFont
import math
import os

ASPECT_RATIOS = {
    "1:1": (1080, 1080),       # Instagram Square / Generic
    "4:5": (1080, 1350),       # Instagram Portrait
    "16:9": (1200, 675),       # X (Twitter) / LinkedIn Landscape
    "9:16": (1080, 1920),      # Instagram Story / Reels / Mobile
    "facebook": (1200, 1200),  # Facebook Square
    "linkedin": (1200, 1200),  # LinkedIn Square
    "twitter": (1200, 675),    # X Landscape
    "instagram": (1080, 1080), # Instagram Post
}

COLOR_PALETTES = [
    {
        "id": "teal_brand",
        "name": "InfiniteTech Corporate Teal",
        "bg_top": (248, 250, 252),
        "bg_bottom": (241, 245, 249),
        "primary": (13, 148, 136),      # Teal 600
        "primary_dark": (15, 118, 110),  # Teal 700
        "accent": (6, 182, 212),        # Cyan 500
        "dark_text": (15, 23, 42),      # Slate 900
        "body_text": (51, 65, 85),      # Slate 700
        "cta_bg": (13, 148, 136),
        "cta_text": (255, 255, 255),
        "card_bg": (255, 255, 255, 240),
        "card_border": (204, 251, 241, 220),
        "footer_bg": (15, 23, 42),
        "footer_text": (241, 245, 249)
    },
    {
        "id": "indigo_royal",
        "name": "Modern SaaS Indigo",
        "bg_top": (15, 23, 42),
        "bg_bottom": (10, 15, 29),
        "primary": (99, 102, 241),      # Indigo 500
        "primary_dark": (79, 70, 229),   # Indigo 600
        "accent": (168, 85, 247),       # Purple 500
        "dark_text": (255, 255, 255),
        "body_text": (226, 232, 240),
        "cta_bg": (79, 70, 229),
        "cta_text": (255, 255, 255),
        "card_bg": (30, 41, 59, 220),
        "card_border": (99, 102, 241, 140),
        "footer_bg": (15, 23, 42),
        "footer_text": (148, 163, 184)
    },
    {
        "id": "emerald_growth",
        "name": "High-Growth Emerald",
        "bg_top": (240, 253, 250),
        "bg_bottom": (204, 251, 241),
        "primary": (5, 150, 105),       # Emerald 600
        "primary_dark": (4, 120, 87),   # Emerald 700
        "accent": (245, 158, 11),       # Amber 500
        "dark_text": (6, 78, 59),       # Emerald 900
        "body_text": (30, 41, 59),
        "cta_bg": (5, 150, 105),
        "cta_text": (255, 255, 255),
        "card_bg": (255, 255, 255, 235),
        "card_border": (167, 243, 208, 200),
        "footer_bg": (6, 78, 59),
        "footer_text": (255, 255, 255)
    },
    {
        "id": "cyber_dark",
        "name": "Obsidian Cyber Neon",
        "bg_top": (11, 15, 25),
        "bg_bottom": (3, 7, 18),
        "primary": (0, 240, 255),       # Neon Cyan
        "primary_dark": (6, 182, 212),
        "accent": (139, 92, 246),       # Neon Violet
        "dark_text": (255, 255, 255),
        "body_text": (203, 213, 225),
        "cta_bg": (0, 240, 255),
        "cta_text": (11, 15, 25),
        "card_bg": (17, 24, 39, 230),
        "card_border": (0, 240, 255, 120),
        "footer_bg": (3, 7, 18),
        "footer_text": (148, 163, 184)
    },
    {
        "id": "clean_swiss",
        "name": "Minimal Swiss White",
        "bg_top": (255, 255, 255),
        "bg_bottom": (250, 250, 250),
        "primary": (15, 23, 42),        # Slate 900
        "primary_dark": (0, 0, 0),
        "accent": (13, 148, 136),       # Teal Accent
        "dark_text": (15, 23, 42),
        "body_text": (71, 85, 105),
        "cta_bg": (15, 23, 42),
        "cta_text": (255, 255, 255),
        "card_bg": (255, 255, 255, 250),
        "card_border": (226, 232, 240, 255),
        "footer_bg": (248, 250, 252),
        "footer_text": (100, 116, 139)
    },
    {
        "id": "sunset_amber",
        "name": "Sunset Momentum",
        "bg_top": (255, 251, 235),
        "bg_bottom": (254, 243, 199),
        "primary": (217, 119, 6),       # Amber 600
        "primary_dark": (180, 83, 9),
        "accent": (239, 68, 68),        # Red 500
        "dark_text": (120, 53, 15),     # Amber 900
        "body_text": (51, 65, 85),
        "cta_bg": (217, 119, 6),
        "cta_text": (255, 255, 255),
        "card_bg": (255, 255, 255, 240),
        "card_border": (253, 230, 138, 220),
        "footer_bg": (69, 26, 3),
        "footer_text": (254, 243, 199)
    }
]

# The 20 Required Unique Design Families
TEMPLATE_FAMILIES = [
    {
        "id": 1,
        "name": "Corporate Hero (Teal Advertising Reference)",
        "category": "Corporate Advertising",
        "description": "Clean white/light background, bold teal typography, 3D device showcase on right, bottom feature cards and CTA",
        "theme": "teal_brand",
        "layout": "split_hero"
    },
    {
        "id": 2,
        "name": "Split-Screen Before vs After",
        "category": "Problem/Solution",
        "description": "Visual comparison between manual chaotic operations and seamless autonomous AI flow with glowing B/A divider",
        "theme": "indigo_royal",
        "layout": "split_before_after"
    },
    {
        "id": 3,
        "name": "Centered Hero + 4 Floating Glass Cards",
        "category": "Product Showcase",
        "description": "Hero technology asset in center surrounded by 4 orbital benefit chips with glowing borders",
        "theme": "cyber_dark",
        "layout": "centered_orbit"
    },
    {
        "id": 4,
        "name": "Dark Technology Matrix",
        "category": "High-Tech",
        "description": "Deep obsidian background, neon cyan/violet glowing circuits, tech badges, and high-impact cyber typography",
        "theme": "cyber_dark",
        "layout": "dark_cyber"
    },
    {
        "id": 5,
        "name": "Minimal Swiss Editorial",
        "category": "Minimalist",
        "description": "High-fashion whitespace, asymmetrical grid, sharp slate typography, emerald micro-accents",
        "theme": "clean_swiss",
        "layout": "minimal_editorial"
    },
    {
        "id": 6,
        "name": "Vibrant Mesh Gradient AI",
        "category": "Creative Modern",
        "description": "Smooth multi-color mesh gradient, large central frosted glass panel, luminous typography",
        "theme": "indigo_royal",
        "layout": "gradient_mesh"
    },
    {
        "id": 7,
        "name": "Smartphone App & Voice Mockup",
        "category": "Product UI",
        "description": "Realistic mobile frame with active AI conversation, audio wave graphics, and action pills",
        "theme": "teal_brand",
        "layout": "phone_mockup"
    },
    {
        "id": 8,
        "name": "Human + AI Co-Pilot Collaboration",
        "category": "Storytelling",
        "description": "Co-pilot concept showing autonomous agent assistance alongside human strategic leadership",
        "theme": "indigo_royal",
        "layout": "human_copilot"
    },
    {
        "id": 9,
        "name": "SaaS Dashboard & Analytics UI",
        "category": "B2B SaaS",
        "description": "Browser window mockup featuring live operational KPI charts, upward growth curves, and revenue counters",
        "theme": "teal_brand",
        "layout": "dashboard_window"
    },
    {
        "id": 10,
        "name": "Neural Constellation & Abstract AI",
        "category": "Deep Tech",
        "description": "Luminous neural nodes, interconnected data lines, glowing cybernetic core and futuristic metrics",
        "theme": "cyber_dark",
        "layout": "neural_network"
    },
    {
        "id": 11,
        "name": "3D Isometric Platform Composition",
        "category": "3D Modern",
        "description": "Elevated isometric pedestals, floating geometric blocks representing automated operational stages",
        "theme": "indigo_royal",
        "layout": "isometric_3d"
    },
    {
        "id": 12,
        "name": "Data Metric & Statistic Callout",
        "category": "Results Focused",
        "description": "Giant 96pt metric callout (+70% Admin Saved, 50,000 Calls, 0 Errors) with high-contrast proof points",
        "theme": "emerald_growth",
        "layout": "statistic_callout"
    },
    {
        "id": 13,
        "name": "Horizontal 3-Step Pipeline",
        "category": "Process & Workflow",
        "description": "Step 1: Capture Data -> Step 2: AI Reasoning -> Step 3: Autopilot Scale with directional connection arrows",
        "theme": "teal_brand",
        "layout": "step_pipeline"
    },
    {
        "id": 14,
        "name": "Problem → Solution Matrix",
        "category": "Direct Response",
        "description": "Red warning challenge card transitioning into a green validated solution card with instant action CTA",
        "theme": "sunset_amber",
        "layout": "problem_solution"
    },
    {
        "id": 15,
        "name": "Bold Typographic Marketing Poster",
        "category": "Editorial Impact",
        "description": "85% typographic focus with oversized bold statement headlines, contrasting color blocks, and striking footer",
        "theme": "clean_swiss",
        "layout": "giant_typography"
    },
    {
        "id": 16,
        "name": "Multi-Service Grid Showcase",
        "category": "Service Portfolio",
        "description": "2x2 modular matrix showcasing 4 core automated services (Invoicing, Scheduling, Data Entry, CRM Calls)",
        "theme": "teal_brand",
        "layout": "service_grid"
    },
    {
        "id": 17,
        "name": "Enterprise Case Study & Proof",
        "category": "Social Proof",
        "description": "Client impact statement, verified corporate badge, quantified operational ROI and executive quote",
        "theme": "indigo_royal",
        "layout": "case_study"
    },
    {
        "id": 18,
        "name": "Thought Leadership Quote Card",
        "category": "Thought Leadership",
        "description": "Giant serif quotation marks, deep slate card with gold accents, provocative industry insight",
        "theme": "sunset_amber",
        "layout": "quote_leadership"
    },
    {
        "id": 19,
        "name": "Industry Vertical Spotlight",
        "category": "Vertical B2B",
        "description": "Targeted badges and workflows customized for Finance, Healthcare, Real Estate, and Legal automation",
        "theme": "teal_brand",
        "layout": "industry_vertical"
    },
    {
        "id": 20,
        "name": "Urgency & Product Launch Event",
        "category": "Promotional",
        "description": "Top launch ribbon badge, countdown styling, vibrant accent borders, and high-urgency CTA button",
        "theme": "sunset_amber",
        "layout": "campaign_launch"
    }
]

def get_system_font(size: int, bold: bool = False, mono: bool = False, serif: bool = False) -> ImageFont.ImageFont:
    """Robust font loader checking Windows font directory with fallbacks."""
    candidates = []
    if mono:
        candidates = ["consola.ttf", "cour.ttf", "lucon.ttf"]
    elif serif:
        candidates = ["georgiab.ttf" if bold else "georgia.ttf", "timesbd.ttf" if bold else "times.ttf"]
    elif bold:
        candidates = ["segoeuib.ttf", "arialbd.ttf", "calibrib.ttf", "tahomabd.ttf"]
    else:
        candidates = ["segoeui.ttf", "arial.ttf", "calibri.ttf", "tahoma.ttf"]

    for c in candidates:
        full_path = os.path.join("C:/Windows/Fonts", c)
        if os.path.exists(full_path):
            try:
                return ImageFont.truetype(full_path, size)
            except Exception:
                pass
        # Try direct name
        try:
            return ImageFont.truetype(c, size)
        except Exception:
            pass

    return ImageFont.load_default()

def draw_vector_icon(draw: ImageDraw.ImageDraw, icon_name: str, x: int, y: int, size: int, color: Tuple[int, int, int]):
    """
    Renders clean, crisp, pixel-perfect vector geometric icons using PIL math.
    Zero external image dependencies, instant rendering, 100% sharp.
    """
    half = size // 2
    cx, cy = x + half, y + half

    if icon_name == "phone":
        # Draw handset receiver
        r = size // 3
        draw.arc([cx - r, cy - r, cx + r, cy + r], start=180, end=270, fill=color, width=max(2, size // 8))
        # Ear piece and mouth piece
        draw.ellipse([cx - r - 2, cy - 2, cx - r + size // 4, cy + 4], fill=color)
        draw.ellipse([cx - 2, cy - r - 2, cx + 4, cy - r + size // 4], fill=color)

    elif icon_name == "calendar":
        # Calendar body
        w = int(size * 0.75)
        h = int(size * 0.7)
        x0, y0 = cx - w // 2, cy - h // 2
        draw.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=max(2, size // 10), outline=color, width=max(2, size // 10))
        # Top binder rings
        draw.line([x0 + w // 4, y0 - 3, x0 + w // 4, y0 + 3], fill=color, width=2)
        draw.line([x0 + 3 * w // 4, y0 - 3, x0 + 3 * w // 4, y0 + 3], fill=color, width=2)
        # Header line
        draw.line([x0, y0 + h // 3, x0 + w, y0 + h // 3], fill=color, width=2)

    elif icon_name == "check":
        # Checkmark
        p1 = (cx - size // 3, cy)
        p2 = (cx - size // 10, cy + size // 4)
        p3 = (cx + size // 3, cy - size // 4)
        draw.line([p1, p2, p3], fill=color, width=max(2, size // 6), joint="curve")

    elif icon_name == "chart":
        # Upward trending chart
        draw.line([cx - half + 2, cy + half - 2, cx + half - 2, cy + half - 2], fill=color, width=2)
        draw.line([cx - half + 2, cy + half - 2, cx - half + 2, cy - half + 2], fill=color, width=2)
        # Trend line
        p1 = (cx - half + 4, cy + size // 4)
        p2 = (cx - size // 8, cy)
        p3 = (cx + size // 8, cy + size // 8)
        p4 = (cx + half - 4, cy - half + 4)
        draw.line([p1, p2, p3, p4], fill=color, width=max(2, size // 8))
        # Arrowhead
        draw.polygon([(p4[0], p4[1]), (p4[0] - size // 5, p4[1]), (p4[0], p4[1] + size // 5)], fill=color)

    elif icon_name == "clock":
        # Clock face
        draw.ellipse([cx - half + 2, cy - half + 2, cx + half - 2, cy + half - 2], outline=color, width=max(2, size // 9))
        # Hour and minute hand
        draw.line([cx, cy, cx, cy - size // 4], fill=color, width=max(2, size // 9))
        draw.line([cx, cy, cx + size // 4, cy], fill=color, width=max(2, size // 9))

    elif icon_name == "shield":
        # Shield outline
        p = [
            (cx - half + 3, cy - half + 4),
            (cx + half - 3, cy - half + 4),
            (cx + half - 3, cy + size // 8),
            (cx, cy + half - 2),
            (cx - half + 3, cy + size // 8)
        ]
        draw.polygon(p, outline=color, width=max(2, size // 9))

    elif icon_name == "sparkle":
        # 4-point star sparkle
        draw.polygon([
            (cx, cy - half + 2),
            (cx + size // 7, cy - size // 7),
            (cx + half - 2, cy),
            (cx + size // 7, cy + size // 7),
            (cx, cy + half - 2),
            (cx - size // 7, cy + size // 7),
            (cx - half + 2, cy),
            (cx - size // 7, cy - size // 7)
        ], fill=color)

    elif icon_name == "brain":
        # Simplified AI node circle with orbit
        draw.ellipse([cx - size // 4, cy - size // 4, cx + size // 4, cy + size // 4], fill=color)
        draw.arc([cx - half + 2, cy - half + 2, cx + half - 2, cy + half - 2], start=30, end=150, fill=color, width=2)
        draw.arc([cx - half + 2, cy - half + 2, cx + half - 2, cy + half - 2], start=210, end=330, fill=color, width=2)

    elif icon_name == "globe":
        # Globe with latitude/longitude
        draw.ellipse([cx - half + 2, cy - half + 2, cx + half - 2, cy + half - 2], outline=color, width=2)
        draw.line([cx - half + 2, cy, cx + half - 2, cy], fill=color, width=2)
        draw.arc([cx - size // 4, cy - half + 2, cx + size // 4, cy + half - 2], start=0, end=360, fill=color, width=2)

    else:
        # Default circle bullet
        draw.ellipse([cx - size // 4, cy - size // 4, cx + size // 4, cy + size // 4], fill=color)
