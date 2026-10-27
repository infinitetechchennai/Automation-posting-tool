import httpx
from typing import Dict, Any, List
from app.adapters.base import SocialPlatformAdapter
from app.models.social_account import SocialAccount
from app.models.platform_post import PlatformPost
from app.models.media import Media
from app.config import settings
from app.core.encryption import decrypt_token


class InstagramAdapter(SocialPlatformAdapter):
    platform_name = "instagram"
    GRAPH_API_VERSION = "v19.0"
    BASE_URL = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

    def get_auth_url(self, state: str) -> str:
        if not settings.INSTAGRAM_APP_ID:
            raise ValueError("INSTAGRAM_APP_ID is not configured in environment.")
        scopes = "instagram_basic,instagram_content_publish,pages_show_list"
        return (
            f"https://www.facebook.com/{self.GRAPH_API_VERSION}/dialog/oauth"
            f"?client_id={settings.INSTAGRAM_APP_ID}"
            f"&redirect_uri={settings.INSTAGRAM_REDIRECT_URI}"
            f"&state={state}"
            f"&scope={scopes}"
            f"&response_type=code"
        )

    async def exchange_code(self, code: str, state: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.BASE_URL}/oauth/access_token",
                params={
                    "client_id": settings.INSTAGRAM_APP_ID,
                    "client_secret": settings.INSTAGRAM_APP_SECRET,
                    "redirect_uri": settings.INSTAGRAM_REDIRECT_URI,
                    "code": code,
                }
            )
            data = resp.json()
            if resp.status_code != 200:
                raise ValueError(f"Instagram OAuth token exchange failed: {data.get('error', {}).get('message', data)}")
            
            user_token = data["access_token"]
            
            # Fetch Instagram Business Account linked to Facebook page
            pages_resp = await client.get(
                f"{self.BASE_URL}/me/accounts",
                params={"access_token": user_token, "fields": "instagram_business_account,name"}
            )
            pages_data = pages_resp.json().get("data", [])
            ig_account_id = None
            for p in pages_data:
                if "instagram_business_account" in p:
                    ig_account_id = p["instagram_business_account"]["id"]
                    break
            
            if not ig_account_id:
                raise ValueError("No Instagram Professional or Business account connected to your Facebook Pages. Convert to Professional first.")

            return {
                "platform_account_id": ig_account_id,
                "account_name": f"IG Professional ({ig_account_id})",
                "account_type": "Professional",
                "access_token": user_token,
                "refresh_token": None,
                "expires_in": data.get("expires_in", 5184000),
                "permissions": ["instagram_content_publish", "instagram_basic"]
            }

    def validate_content(self, post: PlatformPost, media: List[Media]) -> List[str]:
        errors = []
        if not media:
            errors.append("Instagram requires at least one image or video to publish a post.")
        if len(post.caption or "") > 2200:
            errors.append("Instagram caption length exceeds maximum limit of 2,200 characters.")
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
        ig_user_id = account.platform_account_id

        async with httpx.AsyncClient() as client:
            try:
                # Step 1: Create IG Media Container (requires image_url)
                # In development, local file requires public URL or ngrok; in production uses S3 URL
                container_resp = await client.post(
                    f"{self.BASE_URL}/{ig_user_id}/media",
                    params={
                        "access_token": token,
                        "caption": post.caption,
                        # "image_url": media[0].public_url
                    }
                )
                c_data = container_resp.json()
                creation_id = c_data.get("id")
                if not creation_id:
                    return {
                        "success": False,
                        "platform_post_id": None,
                        "error_message": f"Instagram container creation error: {c_data.get('error', {}).get('message', c_data)}",
                        "is_simulated": False,
                        "raw_response": c_data
                    }

                # Step 2: Publish Media Container
                publish_resp = await client.post(
                    f"{self.BASE_URL}/{ig_user_id}/media_publish",
                    params={
                        "access_token": token,
                        "creation_id": creation_id
                    }
                )
                p_data = publish_resp.json()
                if publish_resp.status_code == 200 and "id" in p_data:
                    return {
                        "success": True,
                        "platform_post_id": p_data["id"],
                        "error_message": None,
                        "is_simulated": False,
                        "raw_response": p_data
                    }
                else:
                    return {
                        "success": False,
                        "platform_post_id": None,
                        "error_message": f"Instagram publish error: {p_data.get('error', {}).get('message', p_data)}",
                        "is_simulated": False,
                        "raw_response": p_data
                    }
            except Exception as e:
                return {
                    "success": False,
                    "platform_post_id": None,
                    "error_message": f"Network error contacting Instagram API: {str(e)}",
                    "is_simulated": False,
                    "raw_response": {}
                }
