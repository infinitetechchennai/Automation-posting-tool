from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SocialAccount(Base):
    __tablename__ = "social_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    platform = Column(String(50), nullable=False, index=True)  # facebook, instagram, linkedin, twitter
    platform_account_id = Column(String(255), nullable=False)
    account_name = Column(String(255), nullable=False)
    account_type = Column(String(100), default="Standard")  # Page, Professional, Profile, Company
    encrypted_access_token = Column(Text, nullable=True)
    encrypted_refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime(timezone=True), nullable=True)
    permissions = Column(Text, default="[]")  # JSON string array
    connection_status = Column(String(50), default="connected", index=True)  # connected, expired, disconnected, error
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="social_accounts")
    platform_posts = relationship("PlatformPost", back_populates="social_account")
