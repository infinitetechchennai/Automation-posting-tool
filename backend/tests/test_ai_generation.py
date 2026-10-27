import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_ai_health_endpoint(client: AsyncClient):
    resp = await client.get("/api/ai/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "is_available" in data
    assert "configured_model" in data
    assert "message" in data

@pytest.mark.asyncio
async def test_generate_complete_content_package(client: AsyncClient, auth_headers: dict):
    req_payload = {
        "topic": "AI-Powered Automation for Small Business Growth",
        "company_name": "TaskFlow Technologies",
        "company_description": "We build automated tools that eliminate repetitive clerical work.",
        "product_service": "SmartScheduler Pro",
        "website_url": "https://taskflow.io/smartscheduler",
        "target_audience": "Small business owners and busy founders",
        "marketing_objective": "Generate leads and drive website traffic",
        "industry": "B2B SaaS",
        "tone": "Professional",
        "language": "English",
        "content_type": "Product announcement",
        "keywords": ["Automation", "Productivity", "SmallBusiness"],
        "offer": "Free 14-day trial with zero credit card required",
        "call_to_action": "Claim your free trial",
        "platforms": ["facebook", "instagram", "linkedin", "twitter"]
    }

    resp = await client.post("/api/ai/generate-post", json=req_payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    # Verify structured fields
    assert "overview" in data
    assert "title" in data and len(data["title"]) > 0
    assert "hook" in data and len(data["hook"]) > 0
    assert "description" in data
    assert "main_caption" in data
    assert "key_points" in data and len(data["key_points"]) >= 3
    assert "call_to_action" in data
    assert "hashtags" in data and len(data["hashtags"]) > 0
    assert "keywords" in data and len(data["keywords"]) > 0
    assert "tags_and_mentions" in data
    assert "image_prompt" in data
    assert "alternative_hooks" in data and len(data["alternative_hooks"]) == 3
    assert "alternative_ctas" in data and len(data["alternative_ctas"]) == 2
    assert "alt_text" in data
    assert "improvements" in data
    assert "platform_posts" in data

    # Verify individual platforms
    p_posts = data["platform_posts"]
    assert "facebook" in p_posts
    assert "instagram" in p_posts
    assert "linkedin" in p_posts
    assert "twitter" in p_posts

    # Twitter post MUST strictly respect 280-char limit
    tw_caption = p_posts["twitter"]["caption"]
    assert len(tw_caption) <= 280, f"Twitter post exceeded 280 characters: {len(tw_caption)}"
    assert p_posts["twitter"]["is_valid_length"] is True

    # Instagram recommendation and alt text
    assert len(p_posts["instagram"]["hashtags"]) >= 3
    assert len(data["image_prompt"]["full_prompt"]) > 10

@pytest.mark.asyncio
async def test_regenerate_single_platform_content(client: AsyncClient, auth_headers: dict):
    resp = await client.post(
        "/api/ai/generate-platform-content",
        json={
            "platform": "linkedin",
            "topic": "Scaling Customer Support with AI Agents",
            "company_name": "SupportPilot",
            "tone": "Professional"
        },
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["platform"] == "linkedin"
    assert "caption" in data
    assert len(data["caption"]) > 0

@pytest.mark.asyncio
async def test_ai_helper_tools(client: AsyncClient, auth_headers: dict):
    # 1. Hashtags
    ht_resp = await client.post(
        "/api/ai/generate-hashtags",
        json={"topic": "Social Media Strategy", "industry": "Marketing", "count": 5},
        headers=auth_headers
    )
    assert ht_resp.status_code == 200
    assert len(ht_resp.json()["hashtags"]) > 0

    # 2. Caption improver: shorten
    shorten_resp = await client.post(
        "/api/ai/improve-caption",
        json={
            "caption": "First sentence is here. Second sentence is here. Third sentence is here. Fourth sentence is here.",
            "action": "shorten"
        },
        headers=auth_headers
    )
    assert shorten_resp.status_code == 200
    assert "improved" in shorten_resp.json()

    # 3. Image prompt generator
    img_resp = await client.post(
        "/api/ai/generate-image-prompt",
        json={"post_title": "Launch of SocialPilot AI", "caption": "Exciting new tools", "visual_style": "Minimalist"},
        headers=auth_headers
    )
    assert img_resp.status_code == 200
    assert "prompt" in img_resp.json()
