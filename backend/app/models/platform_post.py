from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class PlatformPost(Base):
    __tablename__ = "platform_posts"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    social_account_id = Column(Integer, ForeignKey("social_accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    platform = Column(String(50), nullable=False, index=True)  # facebook, instagram, linkedin, twitter
    caption = Column(Text, nullable=False, default="")
    description = Column(Text, nullable=True, default="")
    hashtags_json = Column(Text, default="[]")
    mentions_json = Column(Text, default="[]")
    media_ids_json = Column(Text, default="[]")
    scheduled_at = Column(DateTime(timezone=True), nullable=True, index=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    platform_post_id = Column(String(255), nullable=True)  # Platform-returned external ID
    status = Column(String(50), default="draft", index=True)  # draft, pending, queued, processing, published, failed, cancelled, needs_attention
    error_message = Column(Text, nullable=True)
    attempt_count = Column(Integer, default=0)
    idempotency_key = Column(String(100), unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    post = relationship("Post", back_populates="platform_posts")
    social_account = relationship("SocialAccount", back_populates="platform_posts")
    publishing_jobs = relationship("PublishingJob", back_populates="platform_post", cascade="all, delete-orphan")
