import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_post_creation_and_user_isolation(
    client: AsyncClient,
    auth_headers: dict,
    second_auth_headers: dict
):
    # 1. User 1 creates a post
    post_payload = {
        "title": "Unlocking Organic Social Reach",
        "topic": "Organic Social Strategy",
        "website_url": "https://example.com/growth",
        "target_audience": "Digital Marketers",
        "marketing_goal": "Brand Awareness",
        "content_json": {
            "title": "Unlocking Organic Social Reach",
            "hook": "Are you struggling with algorithmic reach?",
            "main_caption": "Consistency and value-first posts drive true organic reach."
        },
        "platform_posts": [
            {
                "platform": "facebook",
                "caption": "Facebook version: Value-first content wins.",
                "hashtags": ["#marketing", "#social"],
                "mentions": []
            },
            {
                "platform": "twitter",
                "caption": "Twitter version: Value wins. #growth",
                "hashtags": ["#growth"],
                "mentions": []
            }
        ]
    }

    create_resp = await client.post("/api/posts", json=post_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    post_data = create_resp.json()
    post_id = post_data["id"]
    assert post_data["title"] == "Unlocking Organic Social Reach"
    assert len(post_data["platform_posts"]) == 2

    # 2. User 1 can view this post
    get_resp = await client.get(f"/api/posts/{post_id}", headers=auth_headers)
    assert get_resp.status_code == 200

    # 3. User 2 MUST NOT be able to view or edit User 1's post (Strict User Isolation)
    unauthorized_get = await client.get(f"/api/posts/{post_id}", headers=second_auth_headers)
    assert unauthorized_get.status_code == 404

    unauthorized_update = await client.put(
        f"/api/posts/{post_id}",
        json={"title": "Hacked Title"},
        headers=second_auth_headers
    )
    assert unauthorized_update.status_code == 404

    # 4. User 1 updates their own post
    update_resp = await client.put(
        f"/api/posts/{post_id}",
        json={"title": "Updated: Organic Social Reach in 2026"},
        headers=auth_headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Updated: Organic Social Reach in 2026"

    # 5. User 1 lists their posts
    list_resp = await client.get("/api/posts", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) == 1

    # User 2 list has 0 posts
    u2_list = await client.get("/api/posts", headers=second_auth_headers)
    assert u2_list.status_code == 200
    assert len(u2_list.json()) == 0
