from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field


class PlatformPostCreate(BaseModel):
    platform: str
    caption: str
    description: Optional[str] = ""
    hashtags: List[str] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)
    media_ids: List[int] = Field(default_factory=list)
    scheduled_at: Optional[datetime] = None
    social_account_id: Optional[int] = None


class PlatformPostUpdate(BaseModel):
    caption: Optional[str] = None
    description: Optional[str] = None
    hashtags: Optional[List[str]] = None
    mentions: Optional[List[str]] = None
    media_ids: Optional[List[int]] = None
    scheduled_at: Optional[datetime] = None
    social_account_id: Optional[int] = None
    status: Optional[str] = None


class PlatformPostOut(BaseModel):
    id: int
    post_id: int
    social_account_id: Optional[int] = None
    platform: str
    caption: str
    description: Optional[str] = ""
    hashtags: List[str] = []
    mentions: List[str] = []
    media_ids: List[int] = []
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    platform_post_id: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    attempt_count: int = 0
    idempotency_key: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostCreate(BaseModel):
    title: str
    topic: str
    website_url: Optional[str] = ""
    target_audience: Optional[str] = ""
    marketing_goal: Optional[str] = ""
    campaign_id: Optional[int] = None
    content_json: Dict[str, Any]
    platform_posts: List[PlatformPostCreate] = Field(default_factory=list)


class PlatformPostUpdate(BaseModel):
    id: Optional[int] = None
    platform: Optional[str] = None
    caption: Optional[str] = None
    description: Optional[str] = None
    hashtags: Optional[List[str]] = None
    mentions: Optional[List[str]] = None
    media_ids: Optional[List[int]] = None
    scheduled_at: Optional[datetime] = None
    social_account_id: Optional[int] = None
    status: Optional[str] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    website_url: Optional[str] = None
    target_audience: Optional[str] = None
    marketing_goal: Optional[str] = None
    campaign_id: Optional[int] = None
    status: Optional[str] = None
    content_json: Optional[Dict[str, Any]] = None
    media_ids: Optional[List[int]] = None
    platform_posts: Optional[List[PlatformPostUpdate]] = None


class PostOut(BaseModel):
    id: int
    user_id: int
    campaign_id: Optional[int] = None
    title: str
    topic: str
    website_url: Optional[str] = ""
    target_audience: Optional[str] = ""
    marketing_goal: Optional[str] = ""
    status: str
    content_json: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    platform_posts: List[PlatformPostOut] = []

    class Config:
        from_attributes = True


class PublishNowRequest(BaseModel):
    platform_post_ids: Optional[List[int]] = None  # None means publish all in post


class SchedulePostRequest(BaseModel):
    scheduled_at: datetime
    timezone_name: str = "Asia/Kolkata"
    platform_post_ids: Optional[List[int]] = None


class BulkTopicItem(BaseModel):
    topic: str
    heading: Optional[str] = None
    details: Optional[List[str]] = None
    call_to_action: Optional[str] = None


class BulkScheduleRequest(BaseModel):
    topics: List[str]
    items: Optional[List[BulkTopicItem]] = None
    start_date: datetime
    interval_hours: int = 24
    timezone: str = "Asia/Kolkata"
    company_name: Optional[str] = "InfiniteTech AI"
    company_description: Optional[str] = ""
    website_url: Optional[str] = ""
    marketing_goal: Optional[str] = "Lead Generation & Awareness"
    tone: Optional[str] = "Professional"
    platforms: List[str] = Field(default_factory=lambda: ["facebook", "instagram", "linkedin", "twitter"])
    media_id: Optional[int] = None
    generate_ai_images: Optional[bool] = False
    call_to_action: Optional[str] = ""
    campaign_id: Optional[int] = None


class BulkScheduleResponse(BaseModel):
    success: bool
    total_created: int
    message: str
    posts: List[PostOut]


class PostGenerateImageRequest(BaseModel):
    template_id: Optional[int] = None
    aspect_ratio: Optional[str] = "1:1"
    palette_id: Optional[str] = None
    custom_headline: Optional[str] = None
    custom_cta: Optional[str] = None
    details: Optional[List[str]] = None
    engine_provider: Optional[str] = "procedural"
    ai_prompt: Optional[str] = None
    ai_style: Optional[str] = "3d_tech"

