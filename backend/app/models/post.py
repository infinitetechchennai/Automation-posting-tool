from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    topic = Column(Text, nullable=False)
    website_url = Column(String(500), default="")
    target_audience = Column(String(255), default="")
    marketing_goal = Column(String(100), default="")
    content_json = Column(Text, nullable=False)  # Full AI generated content package
    status = Column(String(50), default="draft", index=True)  # draft, scheduled, publishing, published, partially_published, failed
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="posts")
    campaign = relationship("Campaign", back_populates="posts")
    platform_posts = relationship("PlatformPost", back_populates="post", cascade="all, delete-orphan")
