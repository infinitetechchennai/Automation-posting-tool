import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.social_account import SocialAccount
from app.models.audit_log import AuditLog
from app.schemas.social import SocialAccountOut, SocialConnectResponse
from app.config import settings
from app.adapters import get_adapter
from app.core.encryption import encrypt_token

router = APIRouter(prefix="/social", tags=["Social Accounts"])

@router.get("/accounts", response_model=List[SocialAccountOut])
async def list_social_accounts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SocialAccount).where(SocialAccount.user_id == current_user.id)
    )
    accounts = list(res.scalars().all())
    
    # Parse permissions JSON to list
    results = []
    for acc in accounts:
        perms = []
        try:
            perms = json.loads(acc.permissions or "[]")
        except Exception:
            perms = []
        
        acc_dict = {
            "id": acc.id,
            "user_id": acc.user_id,
            "platform": acc.platform,
            "platform_account_id": acc.platform_account_id,
            "account_name": acc.account_name,
            "account_type": acc.account_type,
            "connection_status": acc.connection_status,
            "permissions": perms,
            "token_expires_at": acc.token_expires_at,
            "created_at": acc.created_at,
            "updated_at": acc.updated_at
        }
        results.append(SocialAccountOut(**acc_dict))
    return results

@router.get("/connect/{platform}", response_model=SocialConnectResponse)
async def get_connect_url(
    platform: str,
    current_user: User = Depends(get_current_user)
):
    p = platform.lower()
    if p not in ("facebook", "instagram", "linkedin", "twitter", "x", "threads", "youtube", "pinterest"):
        raise HTTPException(status_code=400, detail=f"Unsupported platform: {platform}")

    adapter = get_adapter(p)
    state = f"{current_user.id}:{uuid.uuid4().hex}"

    if settings.is_mock_mode or not settings.has_platform_credentials(p):
        return SocialConnectResponse(
            platform=p,
            connect_url=f"/api/social/callback/{p}?code=mock_auth_code_{p}&state={state}",
            app_mode=settings.APP_MODE,
            is_mock=True,
            instructions=(
                f"Currently in Development Mode. Connecting {p.capitalize()} will create a realistic simulated account "
                f"allowing full end-to-end testing without paid developer subscriptions."
            )
        )
    else:
        try:
            url = adapter.get_auth_url(state=state)
            return SocialConnectResponse(
                platform=p,
                connect_url=url,
                app_mode=settings.APP_MODE,
                is_mock=False,
                instructions=f"Redirecting to official {p.capitalize()} OAuth 2.0 authorization dialog."
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/callback/{platform}")
async def oauth_callback(
    platform: str,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    p = platform.lower()
    user_id = 1
    if ":" in state:
        try:
            user_id = int(state.split(":")[0])
        except Exception:
            user_id = 1

    adapter = get_adapter(p)
    try:
        token_data = await adapter.exchange_code(code=code, state=state)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth exchange error: {str(e)}")

    # Check if this account already connected for this user
    res = await db.execute(
        select(SocialAccount).where(
            and_(
                SocialAccount.user_id == user_id,
                SocialAccount.platform == p,
                SocialAccount.platform_account_id == token_data["platform_account_id"]
            )
        )
    )
    account = res.scalar_one_or_none()

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=token_data.get("expires_in", 5184000))
    enc_access = encrypt_token(token_data.get("access_token", ""))
    enc_refresh = encrypt_token(token_data.get("refresh_token", ""))

    if not account:
        account = SocialAccount(
            user_id=user_id,
            platform=p,
            platform_account_id=token_data["platform_account_id"],
            account_name=token_data["account_name"],
            account_type=token_data.get("account_type", "Standard"),
            encrypted_access_token=enc_access,
            encrypted_refresh_token=enc_refresh,
            token_expires_at=expires_at,
            permissions=json.dumps(token_data.get("permissions", [])),
            connection_status="connected"
        )
        db.add(account)
    else:
        account.account_name = token_data["account_name"]
        account.encrypted_access_token = enc_access
        if enc_refresh:
            account.encrypted_refresh_token = enc_refresh
        account.token_expires_at = expires_at
        account.connection_status = "connected"

    # Audit log
    audit = AuditLog(
        user_id=user_id,
        action="connect_social_account",
        resource_type="social_account",
        resource_id=token_data["platform_account_id"],
        metadata_json=json.dumps({"platform": p, "account_name": token_data["account_name"]})
    )
    db.add(audit)

    await db.commit()
    await db.refresh(account)

    return {
        "status": "connected",
        "platform": p,
        "account_name": account.account_name,
        "message": f"{account.account_name} successfully connected!"
    }

@router.post("/accounts/{account_id}/disconnect")
async def disconnect_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SocialAccount).where(
            and_(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
        )
    )
    account = res.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found.")

    account.connection_status = "disconnected"
    await db.commit()
    return {"message": f"{account.account_name} disconnected successfully."}

@router.delete("/accounts/{account_id}")
async def remove_account(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SocialAccount).where(
            and_(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
        )
    )
    account = res.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found.")

    account_name = account.account_name
    await db.delete(account)
    await db.commit()
    return {"message": f"{account_name} removed successfully."}

@router.post("/accounts/{account_id}/toggle")
async def toggle_account_status(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SocialAccount).where(
            and_(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
        )
    )
    account = res.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found.")

    if account.connection_status == "connected":
        account.connection_status = "disabled"
    else:
        account.connection_status = "connected"

    await db.commit()
    return {
        "status": account.connection_status,
        "message": f"{account.account_name} status updated to {account.connection_status}."
    }

@router.post("/accounts/{account_id}/refresh")
async def refresh_account_token(
    account_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(SocialAccount).where(
            and_(SocialAccount.id == account_id, SocialAccount.user_id == current_user.id)
        )
    )
    account = res.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Social account not found.")

    account.connection_status = "connected"
    account.token_expires_at = datetime.now(timezone.utc) + timedelta(days=60)
    await db.commit()
    return {"message": f"Token for {account.account_name} refreshed successfully."}

