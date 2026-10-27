import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.core.database import init_db
from app.core.scheduler import start_scheduler, stop_scheduler

from app.api.auth import router as auth_router
from app.api.social import router as social_router
from app.api.ai import router as ai_router
from app.api.posts import router as posts_router
from app.api.publishing import router as publishing_router
from app.api.media import router as media_router
from app.api.campaigns import router as campaigns_router
from app.api.calendar import router as calendar_router
from app.api.dashboard import router as dashboard_router
from app.api.analytics import router as analytics_router
from app.api.brand_settings import router as brand_settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    os.makedirs(settings.MEDIA_STORAGE_PATH, exist_ok=True)
    await init_db()
    start_scheduler()
    yield
    # Shutdown actions
    stop_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    description="AI Social Media Content Generator & Auto Publisher API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local media storage for serving uploaded and generated assets
os.makedirs(settings.MEDIA_STORAGE_PATH, exist_ok=True)
app.mount("/storage/media", StaticFiles(directory=settings.MEDIA_STORAGE_PATH), name="media_storage")

# Include API Routers under /api
app.include_router(auth_router, prefix="/api")
app.include_router(social_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(posts_router, prefix="/api")
app.include_router(publishing_router, prefix="/api")
app.include_router(media_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(calendar_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(brand_settings_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "mode": settings.APP_MODE,
        "environment": settings.APP_ENV,
        "status": "online",
        "docs_url": "/docs"
    }


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app_mode": settings.APP_MODE,
        "database": "connected"
    }
