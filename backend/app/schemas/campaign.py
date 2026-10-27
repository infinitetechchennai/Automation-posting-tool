from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field


class CampaignCreate(BaseModel):
    name: str
    objective: str = "Brand Awareness"
    target_audience: Optional[str] = ""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    settings_json: Dict[str, Any] = Field(default_factory=dict)


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    objective: Optional[str] = None
    target_audience: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    settings_json: Optional[Dict[str, Any]] = None


class CampaignOut(BaseModel):
    id: int
    user_id: int
    name: str
    objective: str
    target_audience: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    settings_json: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime
    posts_count: int = 0

    class Config:
        from_attributes = True
