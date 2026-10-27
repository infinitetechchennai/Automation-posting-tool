from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class BrandSettings(Base):
    __tablename__ = "brand_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    company_name = Column(String(255), default="")
    website = Column(String(500), default="")
    company_description = Column(Text, default="")
    logo_url = Column(String(500), default="")
    brand_colors = Column(Text, default="[]")  # JSON string of colors
    industry = Column(String(100), default="Technology")
    target_audience = Column(Text, default="")
    writing_tone = Column(String(100), default="Professional")
    preferred_language = Column(String(50), default="English")
    default_cta = Column(String(255), default="")
    default_hashtags = Column(Text, default="")
    prohibited_phrases = Column(Text, default="")
    brand_guidelines = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="brand_settings")
