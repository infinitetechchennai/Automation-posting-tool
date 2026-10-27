from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class BrandSettingsBase(BaseModel):
    company_name: str = ""
    website: str = ""
    company_description: str = ""
    logo_url: str = ""
    brand_colors: List[str] = Field(default_factory=list)
    industry: str = "Technology"
    target_audience: str = ""
    writing_tone: str = "Professional"
    preferred_language: str = "English"
    default_cta: str = ""
    default_hashtags: str = ""
    prohibited_phrases: str = ""
    brand_guidelines: str = ""


class BrandSettingsUpdate(BrandSettingsBase):
    pass


class BrandSettingsOut(BrandSettingsBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
