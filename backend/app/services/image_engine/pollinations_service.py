"""
pollinations_service.py - Free AI Image Generation Service powered by Pollinations.ai
Generates AI visuals (Flux / SDXL) via Pollinations' open HTTP API with:
- Zero API keys required for development
- High-converting marketing prompt engineering
- Local disk caching to prevent duplicate rate-limit burns
- Graceful offline fallback to the procedural engine
"""

import os
import re
import time
import random
import hashlib
import logging
import urllib.parse
import urllib.request
import urllib.error
from typing import Optional, Dict, Any, Tuple
from PIL import Image

logger = logging.getLogger("socialpilot.pollinations")

STYLE_PROMPTS = {
    "3d_tech": (
        "A sleek modern 3D smartphone standing on an elevated round podium displaying {subject} interface, "
        "ambient teal and mint green studio lighting, soft reflections, octane 3d render, 8k commercial quality, clean corporate tech"
    ),
    "cyber_matrix": (
        "High-tech futuristic cyber operations center illustrating {subject}, glowing neon cyan and electric blue lines, "
        "dark obsidian glass panels, holographic data widgets, sleek cyberpunk corporate aesthetic, 8k render"
    ),
    "minimal_studio": (
        "Minimalist modern product studio composition illustrating {subject}, smooth geometric shapes, "
        "soft pastel shadows, elegant high-key commercial lighting, 3d blender render, clean luxury aesthetic"
    ),
    "isometric": (
        "Vibrant 3D isometric diorama representing {subject}, clean rounded tech devices and cloud servers, "
        "smooth clay 3d render, modern tech enterprise aesthetic, high contrast, 8k"
    ),
    "photoreal_office": (
        "Modern bright architectural tech office showcasing {subject}, professional executives collaborating, "
        "warm natural sunlight, cinematic depth of field, 8k commercial photography"
    )
}

CACHE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "storage", "pollinations_cache")
)

class PollinationsService:
    BASE_URL = "https://image.pollinations.ai/prompt"
    TIMEOUT_SECONDS = 30

    @classmethod
    def get_api_key(cls) -> Optional[str]:
        return os.getenv("POLLINATIONS_API_KEY") or os.getenv("POLLEN_API_KEY")

    @classmethod
    def build_prompt(cls, topic: str, style: str = "3d_tech", custom_prompt: Optional[str] = None) -> str:
        """Constructs an optimized visual prompt for marketing imagery."""
        if custom_prompt and custom_prompt.strip():
            return custom_prompt.strip()

        # Clean topic from prefixes
        clean_topic = topic.strip()
        for pfx in ["Title:", "Headline:", "Topic:"]:
            if clean_topic.startswith(pfx):
                clean_topic = clean_topic[len(pfx):].strip()

        # Extract subject
        subject = clean_topic
        if ":" in clean_topic:
            subject = clean_topic.split(":", 1)[0].strip()
        elif " - " in clean_topic:
            subject = clean_topic.split(" - ", 1)[0].strip()

        template = STYLE_PROMPTS.get(style, STYLE_PROMPTS["3d_tech"])
        prompt = template.format(subject=subject)
        return prompt

    @classmethod
    def generate_image_bytes(
        cls,
        prompt: str,
        width: int = 1080,
        height: int = 1080,
        seed: Optional[int] = None
    ) -> Optional[bytes]:
        """
        Calls Pollinations.ai HTTP API to generate an image.
        Checks local cache first, then calls the API with rate-limit tolerance.
        """
        # 1. Check local disk cache
        cache_key = hashlib.md5(f"{prompt}_{width}_{height}".encode("utf-8")).hexdigest()
        cache_path = os.path.join(CACHE_DIR, f"{cache_key}.png")
        if os.path.exists(cache_path):
            try:
                with open(cache_path, "rb") as f:
                    logger.info("Serving Pollinations visual from local cache")
                    return f.read()
            except Exception:
                pass

        # 2. Build URL
        encoded_prompt = urllib.parse.quote(prompt.strip())
        used_seed = seed if seed is not None else 12345
        url = f"{cls.BASE_URL}/{encoded_prompt}?width={width}&height={height}&nologo=true&seed={used_seed}"

        api_key = cls.get_api_key()
        if api_key:
            url += f"&key={api_key}"

        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )

        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=cls.TIMEOUT_SECONDS) as response:
                if response.status == 200:
                    data = response.read()
                    duration = round(time.time() - t0, 2)
                    logger.info(f"Pollinations.ai generated image in {duration}s ({len(data)} bytes)")
                    
                    # Save to cache
                    try:
                        os.makedirs(CACHE_DIR, exist_ok=True)
                        with open(cache_path, "wb") as cf:
                            cf.write(data)
                    except Exception:
                        pass

                    return data
                else:
                    logger.warning(f"Pollinations.ai responded with HTTP {response.status}")
                    return None
        except urllib.error.HTTPError as he:
            if he.code == 402:
                logger.warning("Pollinations free rate limit active (1 image per 45s). Falling back gracefully.")
            else:
                logger.warning(f"Pollinations HTTPError {he.code}: {he.reason}")
            return None
        except Exception as e:
            logger.warning(f"Pollinations.ai request failed or timed out: {e}")
            return None

    @classmethod
    def generate_and_save(
        cls,
        topic: str,
        output_path: str,
        style: str = "3d_tech",
        custom_prompt: Optional[str] = None,
        width: int = 1080,
        height: int = 1080
    ) -> Optional[str]:
        """Generates an image and writes it directly to disk."""
        prompt = cls.build_prompt(topic, style, custom_prompt)
        img_bytes = cls.generate_image_bytes(prompt, width, height)
        if not img_bytes:
            return None

        os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
        with open(output_path, "wb") as f:
            f.write(img_bytes)
        return output_path

    @classmethod
    def check_health(cls) -> Dict[str, Any]:
        """Checks if Pollinations.ai is reachable and returns status."""
        test_url = f"{cls.BASE_URL}/ping?width=32&height=32&nologo=true"
        req = urllib.request.Request(test_url, headers={"User-Agent": "Mozilla/5.0"})
        t0 = time.time()
        try:
            with urllib.request.urlopen(req, timeout=8) as resp:
                available = (resp.status == 200)
                latency = round((time.time() - t0) * 1000, 1)
                has_key = bool(cls.get_api_key())
                return {
                    "is_available": available,
                    "provider": "Pollinations.ai (Free Cloud AI)",
                    "models_supported": ["FLUX.1", "SANA", "SDXL Turbo"],
                    "latency_ms": latency,
                    "requires_api_key": False,
                    "has_custom_key": has_key,
                    "rate_limit_info": "Free Tier: 1 call / 45s (cached locally). Unlimited with Pollen key.",
                    "message": "Connected — Free cloud AI text-to-image is online!"
                }
        except Exception as e:
            return {
                "is_available": False,
                "provider": "Pollinations.ai",
                "latency_ms": None,
                "requires_api_key": False,
                "message": f"Pollinations.ai unreachable: {str(e)}"
            }
