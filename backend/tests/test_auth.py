import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login_flow(client: AsyncClient):
    # 1. Register a new user
    reg_resp = await client.post(
        "/api/auth/register",
        json={
            "name": "Jane Growth",
            "email": "jane@growthlab.io",
            "password": "SecurePassword99"
        }
    )
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "jane@growthlab.io"

    # 2. Duplicate registration should fail
    dup_resp = await client.post(
        "/api/auth/register",
        json={
            "name": "Jane Growth",
            "email": "jane@growthlab.io",
            "password": "SecurePassword99"
        }
    )
    assert dup_resp.status_code == 400

    # 3. Login with correct credentials
    login_resp = await client.post(
        "/api/auth/login",
        json={
            "email": "jane@growthlab.io",
            "password": "SecurePassword99"
        }
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]

    # 4. Verify /api/auth/me
    me_resp = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["name"] == "Jane Growth"

    # 5. Invalid password
    bad_login = await client.post(
        "/api/auth/login",
        json={
            "email": "jane@growthlab.io",
            "password": "WrongPassword"
        }
    )
    assert bad_login.status_code == 401
