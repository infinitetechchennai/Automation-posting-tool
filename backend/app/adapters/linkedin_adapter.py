import httpx
from typing import Dict, Any, List
from app.adapters.base import SocialPlatformAdapter
from app.models.social_account import SocialAccount
from app.models.platform_post import PlatformPost
from app.models.media import Media
from app.config import settings
from app.core.encryption import decrypt_token


class LinkedInAdapter(SocialPlatformAdapter):
    platform_name = "linkedin"
    BASE_URL = "https://api.linkedin.com/v2"

    def get_auth_url(self, state: str) -> str:
        if not settings.LINKEDIN_CLIENT_ID:
            raise ValueError("LINKEDIN_CLIENT_ID is not configured in environment.")
        scopes = "openid,profile,email,w_member_social"
        return (
            "https://www.linkedin.com/oauth/v2/authorization"
            f"?response_type=code"
            f"&client_id={settings.LINKEDIN_CLIENT_ID}"
            f"&redirect_uri={settings.LINKEDIN_REDIRECT_URI}"
            f"&state={state}"
            f"&scope={scopes}"
        )

    async def exchange_code(self, code: str, state: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            data = resp.json()
            if resp.status_code != 200:
                raise ValueError(f"LinkedIn OAuth token exchange failed: {data.get('error_description', data)}")
            
            token = data["access_token"]
            
            # Fetch user profile info via userinfo endpoint
            profile_resp = await client.get(
                f"{self.BASE_URL}/userinfo",
                headers={"Authorization": f"Bearer {token}"}
            )
            profile_data = profile_resp.json()
            sub = profile_data.get("sub", "unknown")
            name = profile_data.get("name", "LinkedIn Member")

            return {
                "platform_account_id": f"urn:li:person:{sub}",
                "account_name": name,
                "account_type": "Personal Profile",
                "access_token": token,
                "refresh_token": data.get("refresh_token"),
                "expires_in": data.get("expires_in", 5184000),
                "permissions": ["w_member_social", "openid", "profile"]
            }

    def validate_content(self, post: PlatformPost, media: List[Media]) -> List[str]:
        errors = []
        if not post.caption:
            errors.append("LinkedIn posts require text content.")
        if len(post.caption or "") > 3000:
            errors.append("LinkedIn posts cannot exceed 3,000 characters.")
        return errors

    async def publish(
        self,
        account: SocialAccount,
        post: PlatformPost,
        media: List[Media]
    ) -> Dict[str, Any]:
        errors = self.validate_content(post, media)
        if errors:
            return {"success": False, "platform_post_id": None, "error_message": "; ".join(errors), "is_simulated": False, "raw_response": {}}

        token = decrypt_token(account.encrypted_access_token)
        author_urn = account.platform_account_id

        payload = {
            "author": author_urn,
            "lifecycleState": "PUBLISHED",
            "specificContent": {
                "com.linkedin.ugc.ShareContent": {
                    "shareCommentary": {
                        "text": post.caption
                    },
                    "shareMediaCategory": "NONE"
                }
            },
            "visibility": {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        }

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{self.BASE_URL}/ugcPosts",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "X-Restli-Protocol-Version": "2.0.0",
                        "Content-Type": "application/json"
                    }
                )
                data = resp.json() if resp.text else {}
                if resp.status_code in (200, 201) and "id" in data:
                    return {
                        "success": True,
                        "platform_post_id": data["id"],
                        "error_message": None,
                        "is_simulated": False,
                        "raw_response": data
                    }
                else:
                    err_msg = data.get("message", resp.text or f"HTTP {resp.status_code}")
                    return {
                        "success": False,
                        "platform_post_id": None,
                        "error_message": f"LinkedIn API Error: {err_msg}",
                        "is_simulated": False,
                        "raw_response": data
                    }
            except Exception as e:
                return {
                    "success": False,
                    "platform_post_id": None,
                    "error_message": f"Network error contacting LinkedIn API: {str(e)}",
                    "is_simulated": False,
                    "raw_response": {}
                }
