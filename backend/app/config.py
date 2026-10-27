import os
from typing import Literal, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    APP_NAME: str = "SocialPilot AI"
    APP_ENV: Literal["development", "production", "test"] = "development"
    APP_MODE: Literal["mock", "real"] = "mock"
    SECRET_KEY: str = Field(default="dev_secret_key_needs_replacement_in_production_12345678")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database: Supports Postgres or SQLite
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./socialpilot.db")

    # Redis & Background Workers
    REDIS_URL: str = "redis://localhost:6379/0"

    # Ollama Local AI
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"

    # Image Generation
    IMAGE_MODEL_NAME: str = "stabilityai/stable-diffusion-xl-base-1.0"
    IMAGE_GENERATION_ENABLED: bool = False

    # Media Storage Path
    MEDIA_STORAGE_PATH: str = Field(
        default_factory=lambda: os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage", "media"))
    )

    # Encryption key for tokens (Fernet key - 32 url-safe base64-encoded bytes)
    TOKEN_ENCRYPTION_KEY: Optional[str] = "wmNwVB_zQm7_aD7k2LBvGE2QJbYnOdfJ2herXOI5FRs="

    # Facebook Credentials
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    FACEBOOK_REDIRECT_URI: str = "http://localhost:5173/social/callback/facebook"

    # Instagram Credentials
    INSTAGRAM_APP_ID: Optional[str] = None
    INSTAGRAM_APP_SECRET: Optional[str] = None
    INSTAGRAM_REDIRECT_URI: str = "http://localhost:5173/social/callback/instagram"

    # LinkedIn Credentials
    LINKEDIN_CLIENT_ID: Optional[str] = None
    LINKEDIN_CLIENT_SECRET: Optional[str] = None
    LINKEDIN_REDIRECT_URI: str = "http://localhost:5173/social/callback/linkedin"

    # X (Twitter) Credentials
    X_CLIENT_ID: Optional[str] = None
    X_CLIENT_SECRET: Optional[str] = None
    X_REDIRECT_URI: str = "http://localhost:5173/social/callback/twitter"

    @property
    def is_mock_mode(self) -> bool:
        return self.APP_MODE.lower() == "mock"

    def has_platform_credentials(self, platform: str) -> bool:
        p = platform.lower()
        if p == "facebook":
            return bool(self.FACEBOOK_APP_ID and self.FACEBOOK_APP_SECRET)
        elif p == "instagram":
            return bool(self.INSTAGRAM_APP_ID and self.INSTAGRAM_APP_SECRET)
        elif p == "linkedin":
            return bool(self.LINKEDIN_CLIENT_ID and self.LINKEDIN_CLIENT_SECRET)
        elif p in ("twitter", "x"):
            return bool(self.X_CLIENT_ID and self.X_CLIENT_SECRET)
        return False


settings = Settings()
