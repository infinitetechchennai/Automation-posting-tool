import httpx
from typing import Dict, Any, List
from app.adapters.base import SocialPlatformAdapter
from app.models.social_account import SocialAccount
from app.models.platform_post import PlatformPost
from app.models.media import Media
from app.config import settings
from app.core.encryption import decrypt_token


class TwitterAdapter(SocialPlatformAdapter):
    platform_name = "twitter"
    BASE_URL = "https://api.twitter.com/2"

    def get_auth_url(self, state: str) -> str:
        if not settings.X_CLIENT_ID:
            raise ValueError("X_CLIENT_ID is not configured in environment.")
        # OAuth 2.0 PKCE flow for X API v2
        scopes = "tweet.read,tweet.write,users.read,offline.access"
        return (
            "https://twitter.com/i/oauth2/authorize"
            f"?response_type=code"
            f"&client_id={settings.X_CLIENT_ID}"
            f"&redirect_uri={settings.X_REDIRECT_URI}"
            f"&scope={scopes}"
            f"&state={state}"
            f"&code_challenge=challenge"
            f"&code_challenge_method=plain"
        )

    async def exchange_code(self, code: str, state: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://api.twitter.com/2/oauth2/token",
                data={
                    "code": code,
                    "grant_type": "authorization_code",
                    "client_id": settings.X_CLIENT_ID,
                    "redirect_uri": settings.X_REDIRECT_URI,
                    "code_verifier": "challenge",
                },
                auth=(settings.X_CLIENT_ID, settings.X_CLIENT_SECRET) if settings.X_CLIENT_SECRET else None,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            data = resp.json()
            if resp.status_code != 200:
                raise ValueError(f"X OAuth token exchange failed: {data.get('error_description', data)}")
            
            token = data["access_token"]
            
            # Fetch authenticated user profile
            user_resp = await client.get(
                f"{self.BASE_URL}/users/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            u_data = user_resp.json().get("data", {})
            username = u_data.get("username", "XUser")
            user_id = u_data.get("id", "x_user")

            return {
                "platform_account_id": user_id,
                "account_name": f"@{username}",
                "account_type": "Standard",
                "access_token": token,
                "refresh_token": data.get("refresh_token"),
                "expires_in": data.get("expires_in", 7200),
                "permissions": ["tweet.read", "tweet.write", "users.read"]
            }

    def validate_content(self, post: PlatformPost, media: List[Media]) -> List[str]:
        errors = []
        caption = post.caption or ""
        # Strictly enforce 280 characters limit
        if len(caption) > 280:
            errors.append(f"X (Twitter) posts strictly cannot exceed 280 characters. Current length is {len(caption)} characters. Please edit to shorten.")
        if not caption and not media:
            errors.append("X (Twitter) posts require either text or media.")
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

        payload = {"text": post.caption}

        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(
                    f"{self.BASE_URL}/tweets",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json"
                    }
                )
                data = resp.json()
                if resp.status_code in (200, 201) and "data" in data and "id" in data["data"]:
                    return {
                        "success": True,
                        "platform_post_id": data["data"]["id"],
                        "error_message": None,
                        "is_simulated": False,
                        "raw_response": data
                    }
                else:
                    err_msg = data.get("detail", data.get("title", resp.text))
                    return {
                        "success": False,
                        "platform_post_id": None,
                        "error_message": f"X API v2 Error: {err_msg}",
                        "is_simulated": False,
                        "raw_response": data
                    }
            except Exception as e:
                return {
                    "success": False,
                    "platform_post_id": None,
                    "error_message": f"Network error contacting X API: {str(e)}",
                    "is_simulated": False,
                    "raw_response": {}
                }
