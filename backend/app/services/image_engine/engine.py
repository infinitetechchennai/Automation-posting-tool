"""
engine.py - Dedicated AI Image Generation Engine & Template Randomization Coordinator
Maintains composition diversity, tracks history, ensures non-repeating layouts,
and enforces brand guidelines.
"""

import os
import uuid
from typing import Dict, Any, List, Optional
from app.config import settings
from app.services.image_engine.constants import (
    TEMPLATE_FAMILIES,
    COLOR_PALETTES,
    ASPECT_RATIOS
)
from app.services.image_engine.composer import MarketingImageComposer
from app.services.image_engine.validator import ImageValidator

class ImageDesignEngine:
    def __init__(self):
        self.last_template_id: int = 0
        self.last_palette_id: Optional[str] = None
        self.generation_history: List[Dict[str, Any]] = []

    def get_diverse_template_id(self, preferred_id: Optional[int] = None) -> int:
        """
        Ensures consecutive posts never use the exact same template family or layout.
        Cycles through diverse compositions: Corporate Hero, Split-Screen, Orbital, Cyber, Swiss, etc.
        """
        if preferred_id and 1 <= preferred_id <= len(TEMPLATE_FAMILIES):
            self.last_template_id = preferred_id
            return preferred_id

        available = [t["id"] for t in TEMPLATE_FAMILIES if t["id"] != self.last_template_id]
        if not available:
            available = [t["id"] for t in TEMPLATE_FAMILIES]

        # Deterministic diverse cycling or random choice from non-consecutive
        next_id = (self.last_template_id % len(TEMPLATE_FAMILIES)) + 1
        if next_id == self.last_template_id:
            next_id = (next_id % len(TEMPLATE_FAMILIES)) + 1

        self.last_template_id = next_id
        return next_id

    def generate_image(
        self,
        title: str,
        description: Optional[str] = None,
        benefits: Optional[List[Any]] = None,
        cta: Optional[str] = None,
        company: str = "InfiniteTech AI",
        website: str = "www.infinitetechai.com",
        phone: str = "+91-9884777171",
        template_id: Optional[int] = None,
        aspect_ratio: str = "1:1",
        palette_id: Optional[str] = None,
        output_dir: Optional[str] = None,
        engine_provider: Optional[str] = "procedural",
        ai_prompt: Optional[str] = None,
        ai_style: Optional[str] = "3d_tech"
    ) -> Dict[str, Any]:
        """
        Generates a 100% unique, brand-consistent marketing image with rendered text layers.
        Supports both Instant Procedural drawing and Free Cloud AI (Pollinations.ai / Flux.1).
        Enforces quality validation and regenerates if needed.
        """
        target_dir = output_dir or settings.MEDIA_STORAGE_PATH
        t_id = self.get_diverse_template_id(template_id)
        os.makedirs(target_dir, exist_ok=True)
        
        # Prepare structured post payload
        post_data = {
            "title": title,
            "description": description or f"Autonomous operations and workflow automation by {company}.",
            "benefits": benefits or [],
            "cta": cta or "Book a Demo",
            "company": company,
            "website": website,
            "phone": phone
        }

        # 1. Check if user requested Free AI (Pollinations.ai)
        actual_provider = "procedural"
        if engine_provider in ("pollinations", "free_ai", "pollinations_raw"):
            try:
                from app.services.image_engine.pollinations_service import PollinationsService
                temp_ai_filename = f"ai_hero_{uuid.uuid4().hex[:10]}.png"
                temp_ai_path = os.path.join(target_dir, temp_ai_filename)

                res_path = PollinationsService.generate_and_save(
                    topic=title,
                    output_path=temp_ai_path,
                    style=ai_style or "3d_tech",
                    custom_prompt=ai_prompt,
                    width=1024,
                    height=1024
                )
                if res_path and os.path.exists(res_path):
                    post_data["ai_hero_image_path"] = res_path
                    post_data["engine_provider"] = "pollinations"
                    actual_provider = "pollinations.ai (Flux.1)"
            except Exception as e:
                print(f"Pollinations AI generation failed, falling back gracefully to procedural: {e}")
                actual_provider = "procedural (fallback)"

        filename = f"flyer_gen_{uuid.uuid4().hex[:10]}.png"
        out_path = os.path.join(target_dir, filename)

        composer = MarketingImageComposer(template_id=t_id, aspect_ratio=aspect_ratio, palette_id=palette_id)
        composer.render(post_data, out_path)

        # Quality validation
        val_res = ImageValidator.validate_image(out_path, expected_aspect_ratio=aspect_ratio)
        if not val_res.get("is_valid", False):
            # Fallback to template 1 (Reference Hero) if validation failed
            t_id = 1
            composer = MarketingImageComposer(template_id=1, aspect_ratio=aspect_ratio)
            composer.render(post_data, out_path)
            val_res = ImageValidator.validate_image(out_path, expected_aspect_ratio=aspect_ratio)

        meta = {
            "filename": filename,
            "file_path": out_path,
            "template_id": t_id,
            "template_name": composer.template_info["name"],
            "category": composer.template_info["category"],
            "palette": composer.palette["name"],
            "aspect_ratio": aspect_ratio,
            "width": composer.width,
            "height": composer.height,
            "engine_provider": actual_provider,
            "validation": val_res
        }
        self.generation_history.append(meta)
        return meta

# Global singleton
image_engine = ImageDesignEngine()
