from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class SocialAccountOut(BaseModel):
    id: int
    user_id: int
    platform: str
    platform_account_id: str
    account_name: str
    account_type: str
    connection_status: str
    permissions: List[str] = []
    token_expires_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SocialConnectResponse(BaseModel):
    platform: str
    connect_url: Optional[str] = None
    app_mode: str
    is_mock: bool
    instructions: str
