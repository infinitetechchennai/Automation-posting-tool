from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional
from app.models.social_account import SocialAccount
from app.models.platform_post import PlatformPost
from app.models.media import Media


class SocialPlatformAdapter(ABC):
    platform_name: str

    @abstractmethod
    def get_auth_url(self, state: str) -> str:
        """Generate OAuth 2.0 authorization URL."""
        pass

    @abstractmethod
    async def exchange_code(self, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for access tokens."""
        pass

    @abstractmethod
    def validate_content(self, post: PlatformPost, media: List[Media]) -> List[str]:
        """Validate content against platform rules. Returns list of error messages."""
        pass

    @abstractmethod
    async def publish(
        self,
        account: SocialAccount,
        post: PlatformPost,
        media: List[Media]
    ) -> Dict[str, Any]:
        """
        Publish post to the platform.
        Returns dict with:
        - success: bool
        - platform_post_id: Optional[str]
        - error_message: Optional[str]
        - is_simulated: bool
        - raw_response: Dict[str, Any]
        """
        pass
