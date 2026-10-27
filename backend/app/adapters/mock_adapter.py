import uuid
import asyncio
from typing import Dict, Any, List
from app.adapters.base import SocialPlatformAdapter
from app.models.social_account import SocialAccount
from app.models.platform_post import PlatformPost
from app.models.media import Media


class MockSocialAdapter(SocialPlatformAdapter):
    def __init__(self, platform_name: str):
        self.platform_name = platform_name

    def get_auth_url(self, state: str) -> str:
        return f"/mock-oauth-complete?platform={self.platform_name}&state={state}"

    async def exchange_code(self, code: str, state: str) -> Dict[str, Any]:
        return {
            "platform_account_id": f"mock_acc_{self.platform_name}_{uuid.uuid4().hex[:8]}",
            "account_name": f"Demo {self.platform_name.capitalize()} Account",
            "account_type": "Page" if self.platform_name == "facebook" else "Professional",
            "access_token": f"mock_token_{uuid.uuid4().hex}",
            "refresh_token": f"mock_refresh_{uuid.uuid4().hex}",
            "expires_in": 5184000,  # 60 days
            "permissions": ["read", "write", "publish_content"]
        }

    def validate_content(self, post: PlatformPost, media: List[Media]) -> List[str]:
        errors = []
        caption = post.caption or ""
        
        # Check platform length limits
        if self.platform_name in ("twitter", "x"):
            # Max 280 chars
            if len(caption) > 280:
                errors.append(f"X (Twitter) posts cannot exceed 280 characters. Current length: {len(caption)}")
        
        # Instagram requires media
        if self.platform_name == "instagram" and not media:
            errors.append("Instagram posts require at least one attached image or video.")
            
        return errors

    async def publish(
        self,
        account: SocialAccount,
        post: PlatformPost,
        media: List[Media]
    ) -> Dict[str, Any]:
        # Validate content rules first
        errors = self.validate_content(post, media)
        if errors:
            return {
                "success": False,
                "platform_post_id": None,
                "error_message": "; ".join(errors),
                "is_simulated": True,
                "raw_response": {"validation_errors": errors}
            }

        # Check for simulated failure trigger in post text or test flags
        text_lower = (post.caption or "").lower()
        if "[sim-fail]" in text_lower or "[simulate-fail]" in text_lower:
            return {
                "success": False,
                "platform_post_id": None,
                "error_message": f"Simulated {self.platform_name.capitalize()} API error: Rate limit or temporary platform downtime.",
                "is_simulated": True,
                "raw_response": {"status": "simulated_error", "code": 429}
            }

        if "[token-expired]" in text_lower:
            return {
                "success": False,
                "platform_post_id": None,
                "error_message": f"Simulated {self.platform_name.capitalize()} API error: Access token expired. Please reconnect account.",
                "is_simulated": True,
                "raw_response": {"status": "simulated_error", "code": 401}
            }

        # Simulate small publishing latency
        await asyncio.sleep(0.1)

        simulated_id = f"{self.platform_name[:2]}_mock_{uuid.uuid4().hex[:12]}"
        return {
            "success": True,
            "platform_post_id": simulated_id,
            "error_message": None,
            "is_simulated": True,
            "raw_response": {
                "id": simulated_id,
                "status": "success",
                "message": f"Simulated publish to {self.platform_name} completed in Development Mode."
            }
        }
