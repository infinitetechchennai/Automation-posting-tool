from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class AIPostGenerateRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="What do you want to post about?")
    company_name: Optional[str] = Field(default="", description="Name of the company")
    company_description: Optional[str] = Field(default="", description="Explain company's products/services")
    product_service: Optional[str] = Field(default="", description="What are you promoting?")
    website_url: Optional[str] = Field(default="", description="Optional website or landing page")
    target_audience: Optional[str] = Field(default="Target Customers", description="Who should see this content?")
    marketing_objective: str = Field(default="Increase brand awareness", description="Marketing objective")
    industry: Optional[str] = Field(default="Technology", description="Industry")
    tone: str = Field(default="Professional", description="Writing tone")
    language: str = Field(default="English", description="Output language")
    content_type: str = Field(default="Promotional post", description="Type of content")
    keywords: List[str] = Field(default_factory=list, description="Keywords to emphasize")
    offer: Optional[str] = Field(default="", description="Optional promotional offer")
    call_to_action: Optional[str] = Field(default="", description="CTA or blank for auto")
    additional_instructions: Optional[str] = Field(default="", description="Optional instructions")
    platforms: List[str] = Field(
        default=["facebook", "instagram", "linkedin", "twitter"],
        description="Platforms to target"
    )


class ImagePromptDetails(BaseModel):
    main_subject: str = ""
    background: str = ""
    composition: str = ""
    visual_style: str = "Photorealistic"
    lighting: str = "Studio"
    brand_colors: str = ""
    intended_audience: str = ""
    aspect_ratio: str = "1:1"
    text_placement: Optional[str] = "No text"
    full_prompt: str = ""


class ContentOverview(BaseModel):
    internal_title: str
    main_topic: str
    campaign_objective: str
    target_audience: str
    primary_keyword: str
    secondary_keywords: List[str] = Field(default_factory=list)
    content_category: str


class PlatformPostContent(BaseModel):
    platform: str
    hook: str
    caption: str
    description: Optional[str] = ""
    key_points: List[str] = Field(default_factory=list)
    cta: str
    hashtags: List[str] = Field(default_factory=list)
    mentions: List[str] = Field(default_factory=list)
    media_recommendation: str = ""
    character_count: int = 0
    is_valid_length: bool = True
    char_limit: int = 280


class TagsAndMentions(BaseModel):
    search_keywords: List[str] = Field(default_factory=list)
    internal_content_tags: List[str] = Field(default_factory=list)
    hashtags: List[str] = Field(default_factory=list)
    suggested_mentions_to_verify: List[str] = Field(default_factory=list)


class CompleteContentPackage(BaseModel):
    overview: ContentOverview
    title: str
    hook: str
    description: str
    main_caption: str
    key_points: List[str] = Field(default_factory=list)
    call_to_action: str
    hashtags: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    tags_and_mentions: TagsAndMentions
    image_prompt: ImagePromptDetails
    alternative_hooks: List[str] = Field(default_factory=list)  # 3 hooks
    alternative_ctas: List[str] = Field(default_factory=list)   # 2 CTAs
    alt_text: str = ""
    improvements: List[str] = Field(default_factory=list)
    platform_posts: Dict[str, PlatformPostContent] = Field(default_factory=dict)
    generation_source: Literal["ollama", "fallback_demo"] = "fallback_demo"


class SinglePlatformRegenerateRequest(BaseModel):
    platform: str
    topic: str
    company_name: Optional[str] = ""
    target_audience: Optional[str] = ""
    tone: Optional[str] = "Professional"
    language: Optional[str] = "English"
    custom_instruction: Optional[str] = ""


class HashtagGenerateRequest(BaseModel):
    topic: str
    industry: Optional[str] = "General"
    platform: Optional[str] = "all"
    count: int = 15


class CaptionImproveRequest(BaseModel):
    caption: str
    action: Literal["improve", "shorten", "expand", "check_grammar", "change_tone"]
    target_tone: Optional[str] = "Professional"


class RepurposeContentRequest(BaseModel):
    source_content: str
    source_type: Literal["blog_url", "raw_text", "article"]
    target_platforms: List[str] = ["facebook", "instagram", "linkedin", "twitter"]


class ImagePromptGenerateRequest(BaseModel):
    post_title: str
    caption: str
    visual_style: Optional[str] = "Photorealistic"
    aspect_ratio: Optional[str] = "1:1"
    platform: Optional[str] = "instagram"
