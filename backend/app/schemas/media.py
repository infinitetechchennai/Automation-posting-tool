from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MediaOut(BaseModel):
    id: int
    user_id: int
    storage_key: str
    original_filename: str
    mime_type: str
    size_bytes: int
    width: Optional[int] = None
    height: Optional[int] = None
    duration_seconds: Optional[float] = None
    alt_text: str = ""
    created_at: datetime
    url: str = ""

    class Config:
        from_attributes = True


class MediaUpdate(BaseModel):
    alt_text: Optional[str] = None


class FlyerGenerateRequest(BaseModel):
    topic: str
    details: Optional[list[str]] = None
    description: Optional[str] = None
    cta_text: Optional[str] = None
    company: Optional[str] = "InfiniteTech AI"
    website: Optional[str] = "www.infinitetechai.com"
    phone: Optional[str] = "+91-9884777171"
    bg_image_path: Optional[str] = None
    template_id: Optional[int] = None
    aspect_ratio: Optional[str] = "1:1"
    palette_id: Optional[str] = None
    engine_provider: Optional[str] = "procedural"
    ai_prompt: Optional[str] = None
    ai_style: Optional[str] = "3d_tech"

