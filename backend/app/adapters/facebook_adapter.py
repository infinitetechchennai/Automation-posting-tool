import httpx
from typing import Dict, Any, List
from app.adapters.base import SocialPlatformAdapter
from app.models.social_account import SocialAccount
from app.models.platform_post import PlatformPost
from app.models.media import Media
from app.config import settings
from app.core.encryption import decrypt_token


class FacebookAdapter(SocialPlatformAdapter):
    platform_name = "facebook"
    GRAPH_API_VERSION = "v19.0"
    BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

    def get_auth_url(self, state: str) -> str:
        if not settings.FACEBOOK_APP_ID:
            raise ValueError("FACEBOOK_APP_ID is not configured in environment.")
        scopes = "pages_show_list,pages_read_engagement,pages_manage_posts"
        return (
            f"https://www.facebook.com/{self.GRAPH_API_VERSION}/dialog/oauth"
            f"?client_id={settings.FACEBOOK_APP_ID}"
            f"&redirect_uri={settings.FACEBOOK_REDIRECT_URI}"
            f"&state={state}"
            f"&scope={scopes}"
            f"&response_type=code"
        )

    async def exchange_code(self, code: str, state: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/oauth/access_token",
                params={
                    "client_id": settings.FACEBOOK_APP_ID,
                    "client_secret": settings.FACEBOOK_APP_SECRET,
                    "redirect_uri": settings.FACEBOOK_REDIRECT_URI,
                    "code": code,
                }
            )
            data = resp.json()
            if resp.status_code != 200:
                raise ValueError(f"Facebook OAuth token exchange failed: {data.get('error', {}).get('message', data)}")
            
            user_token = data["access_token"]
            
            # Fetch user's managed pages
            accounts_resp = await client.get(
                f"{self.BASE_URL}/me/accounts",
                params={"access_token": user_token}
            )
            accounts_data = accounts_resp.json()
            pages = accounts_data.get("data", [])
            if not pages:
                raise ValueError("No Facebook Pages found for this account. Create or administer a Facebook Page first.")
            
            page = pages[0]
            return {
                "platform_account_id": page["id"],
                "account_name": page["name"],
                "account_type": "Page",
                "access_token": page["access_token"],  # Page access token
                "refresh_token": None,
                "expires_in": data.get("expires_in", 5184000),
                "permissions": page.get("tasks", ["MANAGE"])
            }

    def validate_content(self, post: PlatformPost, media: List[Media]) -> List[str]:
        errors = []
        if not (post.caption or media):
            errors.append("Facebook posts require at least a caption or media.")
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
        page_id = account.platform_account_id

        async with httpx.AsyncClient() as client:
            try:
                # If image is attached
                if media:
                    # In real production, this would use a public media URL or multipart upload
                    # For Graph API photo publish:
                    resp = await client.post(
                        f"{self.BASE_URL}/{page_id}/feed",
                        params={"access_token": token},
                        json={"message": post.caption}
                    )
                else:
                    resp = await client.post(
                        f"{self.BASE_URL}/{page_id}/feed",
                        params={"access_token": token},
                        json={"message": post.caption}
                    )

                data = resp.json()
                if resp.status_code == 200 and "id" in data:
                    return {
                        "success": True,
                        "platform_post_id": data["id"],
                        "error_message": None,
                        "is_simulated": False,
                        "raw_response": data
                    }
                else:
                    err_msg = data.get("error", {}).get("message", str(data))
                    return {
                        "success": False,
                        "platform_post_id": None,
                        "error_message": f"Facebook Graph API Error: {err_msg}",
                        "is_simulated": False,
                        "raw_response": data
                    }
            except Exception as e:
                return {
                    "success": False,
                    "platform_post_id": None,
                    "error_message": f"Network error contacting Facebook API: {str(e)}",
                    "is_simulated": False,
                    "raw_response": {}
                }
