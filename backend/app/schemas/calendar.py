from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CalendarItem(BaseModel):
    id: int  # platform_post id
    post_id: int
    title: str
    platform: str
    caption: str
    scheduled_at: Optional[datetime] = None
    published_at: Optional[datetime] = None
    status: str
    account_name: Optional[str] = None
    campaign_name: Optional[str] = None
    media_ids: List[int] = []


class RescheduleRequest(BaseModel):
    scheduled_at: datetime
    timezone_name: str = "Asia/Kolkata"
