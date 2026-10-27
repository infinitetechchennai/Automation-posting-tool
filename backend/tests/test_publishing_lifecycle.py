from datetime import datetime, timedelta, timezone
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_publishing_lifecycle_and_failure_isolation(client: AsyncClient, auth_headers: dict):
    # 1. Connect a mock Facebook and mock Twitter account
    conn_fb = await client.get("/api/social/callback/facebook?code=mock_code&state=1:abc")
    assert conn_fb.status_code == 200

    conn_tw = await client.get("/api/social/callback/twitter?code=mock_code&state=1:abc")
    assert conn_tw.status_code == 200

    # 2. Create post with 2 platforms:
    # Facebook has a normal caption (should succeed)
    # Twitter has "[sim-fail]" in caption to trigger simulated API failure
    create_resp = await client.post(
        "/api/posts",
        json={
            "title": "Multi-Platform Post with Failure Isolation",
            "topic": "Resilience Testing",
            "content_json": {"title": "Resilience Testing"},
            "platform_posts": [
                {
                    "platform": "facebook",
                    "caption": "Facebook post will succeed smoothly.",
                    "hashtags": ["#success"],
                    "mentions": []
                },
                {
                    "platform": "twitter",
                    "caption": "Twitter will trigger [sim-fail] to verify platform isolation.",
                    "hashtags": ["#test"],
                    "mentions": []
                }
            ]
        },
        headers=auth_headers
    )
    assert create_resp.status_code == 201
    post = create_resp.json()
    post_id = post["id"]
    fb_pp_id = [p["id"] for p in post["platform_posts"] if p["platform"] == "facebook"][0]
    tw_pp_id = [p["id"] for p in post["platform_posts"] if p["platform"] == "twitter"][0]

    # 3. Publish post now
    pub_resp = await client.post(f"/api/posts/{post_id}/publish", headers=auth_headers)
    assert pub_resp.status_code == 200
    pub_data = pub_resp.json()

    # Verify: Facebook succeeded, Twitter failed, and overall status is partially_published
    assert pub_data["overall_status"] == "partially_published"
    assert pub_data["platform_results"]["facebook"]["success"] is True
    assert pub_data["platform_results"]["facebook"]["status"] == "published"
    assert pub_data["platform_results"]["twitter"]["success"] is False
    assert pub_data["platform_results"]["twitter"]["status"] == "failed"

    # 4. Duplicate prevention test:
    # Attempting to re-publish the already-published Facebook post must prevent duplicate post creation
    fb_retry = await client.post(f"/api/platform-posts/{fb_pp_id}/retry", headers=auth_headers)
    assert fb_retry.status_code == 200
    assert fb_retry.json()["status"] == "published"
    assert "duplicate prevented" in fb_retry.json()["message"].lower()

    # 5. Fix the failed Twitter post caption and retry
    await client.put(
        f"/api/platform-posts/{tw_pp_id}",
        json={"caption": "Twitter issue fixed without failure flag. #resilience"},
        headers=auth_headers
    )

    tw_retry = await client.post(f"/api/platform-posts/{tw_pp_id}/retry", headers=auth_headers)
    assert tw_retry.status_code == 200
    assert tw_retry.json()["success"] is True
    assert tw_retry.json()["status"] == "published"

    # 6. Verify Dashboard stats updated
    stats_resp = await client.get("/api/dashboard/stats", headers=auth_headers)
    assert stats_resp.status_code == 200
    stats = stats_resp.json()
    assert stats["total_posts"] >= 1
    assert stats["published_posts"] >= 2  # Both FB and TW are published now

@pytest.mark.asyncio
async def test_schedule_post_and_calendar_retrieval(client: AsyncClient, auth_headers: dict):
    # Create post to schedule
    future_time = datetime.now(timezone.utc) + timedelta(days=2)
    create_resp = await client.post(
        "/api/posts",
        json={
            "title": "Scheduled Announcement",
            "topic": "Future Launch",
            "content_json": {},
            "platform_posts": [
                {
                    "platform": "linkedin",
                    "caption": "Excited to announce our upcoming feature launch next week.",
                    "hashtags": ["#launch"]
                }
            ]
        },
        headers=auth_headers
    )
    post_id = create_resp.json()["id"]

    # Schedule post
    sched_resp = await client.post(
        f"/api/posts/{post_id}/schedule",
        json={
            "scheduled_at": future_time.isoformat(),
            "timezone_name": "Asia/Kolkata"
        },
        headers=auth_headers
    )
    assert sched_resp.status_code == 200
    assert sched_resp.json()["status"] == "scheduled"

    # Query calendar
    cal_resp = await client.get("/api/calendar", headers=auth_headers)
    assert cal_resp.status_code == 200
    cal_items = cal_resp.json()
    assert any(item["title"] == "Scheduled Announcement" for item in cal_items)
