from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.models.user import User
from app.services.ai_service import AIService
from app.schemas.ai import (
    AIPostGenerateRequest,
    CompleteContentPackage,
    SinglePlatformRegenerateRequest,
    PlatformPostContent,
    HashtagGenerateRequest,
    CaptionImproveRequest,
    RepurposeContentRequest,
    ImagePromptGenerateRequest
)

router = APIRouter(prefix="/ai", tags=["AI Generation"])

@router.get("/health")
async def get_ai_health():
    """Returns local Ollama LLM connectivity, model availability, and configuration hints."""
    return await AIService.check_ollama_status()

@router.post("/generate-post", response_model=CompleteContentPackage)
async def generate_post(
    payload: AIPostGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return await AIService.generate_complete_package(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@router.post("/generate-platform-content", response_model=PlatformPostContent)
async def generate_platform_content(
    payload: SinglePlatformRegenerateRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        return await AIService.regenerate_platform_content(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-hashtags")
async def generate_hashtags(
    payload: HashtagGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    tags = await AIService.generate_hashtags(payload)
    return {"hashtags": tags}

@router.post("/improve-caption")
async def improve_caption(
    payload: CaptionImproveRequest,
    current_user: User = Depends(get_current_user)
):
    return await AIService.improve_caption(payload)

@router.post("/generate-image-prompt")
async def generate_image_prompt(
    payload: ImagePromptGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    prompt_text = (
        f"A crisp, high-resolution {payload.visual_style.lower()} scene illustrating '{payload.post_title}'. "
        f"Optimized for {payload.platform} in {payload.aspect_ratio} aspect ratio. "
        f"Professional balanced studio lighting, subtle clean depth of field, high contrast, 8k quality."
    )
    return {
        "prompt": prompt_text,
        "visual_style": payload.visual_style,
        "aspect_ratio": payload.aspect_ratio,
        "platform": payload.platform
    }

@router.post("/repurpose-content")
async def repurpose_content(
    payload: RepurposeContentRequest,
    current_user: User = Depends(get_current_user)
):
    # Extract essence and generate package
    title_summary = payload.source_content[:60].replace("\n", " ") + "..."
    req = AIPostGenerateRequest(
        topic=title_summary,
        company_name="",
        product_service="Core Insights",
        target_audience="General Professionals",
        marketing_objective="Educate the audience",
        additional_instructions=f"Repurposed from {payload.source_type}: {payload.source_content[:500]}",
        platforms=payload.target_platforms
    )
    return await AIService.generate_complete_package(req)
