from typing import Dict
from app.config import settings
from app.adapters.base import SocialPlatformAdapter
from app.adapters.mock_adapter import MockSocialAdapter
from app.adapters.facebook_adapter import FacebookAdapter
from app.adapters.instagram_adapter import InstagramAdapter
from app.adapters.linkedin_adapter import LinkedInAdapter
from app.adapters.twitter_adapter import TwitterAdapter

_adapters: Dict[str, SocialPlatformAdapter] = {}

def get_adapter(platform: str, force_mode: str = None) -> SocialPlatformAdapter:
    p = platform.lower()
    if p == "x":
        p = "twitter"

    mode = force_mode or settings.APP_MODE

    # If mock mode is requested or required credentials are missing, use mock adapter
    if mode == "mock" or not settings.has_platform_credentials(p):
        return MockSocialAdapter(platform_name=p)

    if p == "facebook":
        return FacebookAdapter()
    elif p == "instagram":
        return InstagramAdapter()
    elif p == "linkedin":
        return LinkedInAdapter()
    elif p == "twitter":
        return TwitterAdapter()
    else:
        return MockSocialAdapter(platform_name=p)
