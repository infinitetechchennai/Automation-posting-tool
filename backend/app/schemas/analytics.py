from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_posts: int = 0
    published_posts: int = 0
    scheduled_posts: int = 0
    draft_posts: int = 0
    failed_posts: int = 0
    connected_accounts: int = 0
    app_mode: str = "mock"


class RecentActivityItem(BaseModel):
    id: int  # platform_post id
    post_id: int
    title: str
    platform: str
    account_name: str
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    status: str
    error_message: Optional[str] = None


class PlatformAnalytics(BaseModel):
    platform: str
    connected: bool
    is_real_data: bool
    followers_count: Optional[int] = None
    posts_published_count: int = 0
    total_engagements: Optional[int] = None
    estimated_reach: Optional[int] = None
    disclaimer: str = ""


class AnalyticsOverview(BaseModel):
    app_mode: str
    is_real_data: bool
    data_source_notice: str
    total_published: int
    total_scheduled: int
    total_failed: int
    platform_breakdown: Dict[str, int]
    platforms: List[PlatformAnalytics]
