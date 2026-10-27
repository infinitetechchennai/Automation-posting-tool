import io
import pytest
from PIL import Image
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_media_upload_and_validation(client: AsyncClient, auth_headers: dict):
    # Create small valid test PNG image in memory
    img = Image.new("RGB", (640, 480), color=(73, 109, 137))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    # Upload valid image
    files = {"file": ("test_banner.png", buf.getvalue(), "image/png")}
    data = {"alt_text": "A beautiful blue gradient test banner"}
    resp = await client.post("/api/media/upload", files=files, data=data, headers=auth_headers)
    assert resp.status_code == 201
    media_data = resp.json()
    assert media_data["original_filename"] == "test_banner.png"
    assert media_data["width"] == 640
    assert media_data["height"] == 480
    assert media_data["alt_text"] == "A beautiful blue gradient test banner"
    media_id = media_data["id"]

    # List media
    list_resp = await client.get("/api/media", headers=auth_headers)
    assert list_resp.status_code == 200
    assert any(m["id"] == media_id for m in list_resp.json())

    # Update alt text
    up_resp = await client.put(f"/api/media/{media_id}", json={"alt_text": "Updated alt text"}, headers=auth_headers)
    assert up_resp.status_code == 200
    assert up_resp.json()["alt_text"] == "Updated alt text"

    # Delete media
    del_resp = await client.delete(f"/api/media/{media_id}", headers=auth_headers)
    assert del_resp.status_code == 204

@pytest.mark.asyncio
async def test_campaign_crud_and_batch_generation(client: AsyncClient, auth_headers: dict):
    # 1. Create Campaign
    c_resp = await client.post(
        "/api/campaigns",
        json={
            "name": "Q4 SaaS Growth Surge",
            "objective": "Lead Generation",
            "target_audience": "Tech Startup Founders",
            "settings_json": {"tone": "Inspirational", "primary_keywords": ["Scale", "Growth"]}
        },
        headers=auth_headers
    )
    assert c_resp.status_code == 201
    campaign = c_resp.json()
    campaign_id = campaign["id"]

    # 2. Generate proposed batch of posts
    batch_resp = await client.post(
        f"/api/campaigns/{campaign_id}/generate-batch?count=2",
        headers=auth_headers
    )
    assert batch_resp.status_code == 200
    batch_data = batch_resp.json()
    assert batch_data["proposed_count"] == 2
    assert len(batch_data["proposed_posts"]) == 2
    # Verify notice requiring approval
    assert "Approval is required" in batch_data["notice"]

@pytest.mark.asyncio
async def test_brand_settings_get_and_update(client: AsyncClient, auth_headers: dict):
    # Get initial settings
    get_resp = await client.get("/api/brand-settings", headers=auth_headers)
    assert get_resp.status_code == 200

    # Update settings
    put_resp = await client.put(
        "/api/brand-settings",
        json={
            "company_name": "Antigravity Cloud",
            "website": "https://antigravity.dev",
            "company_description": "Next-gen intelligent coding and productivity tools.",
            "logo_url": "https://antigravity.dev/logo.png",
            "brand_colors": ["#4F46E5", "#06B6D4"],
            "industry": "Artificial Intelligence",
            "target_audience": "Software engineers and tech leaders",
            "writing_tone": "Inspirational",
            "preferred_language": "English",
            "default_cta": "Try Antigravity free today.",
            "default_hashtags": "#AI #Engineering",
            "prohibited_phrases": "cheap, guaranteed riches",
            "brand_guidelines": "Always maintain high technical integrity."
        },
        headers=auth_headers
    )
    assert put_resp.status_code == 200
    brand = put_resp.json()
    assert brand["company_name"] == "Antigravity Cloud"
    assert len(brand["brand_colors"]) == 2
