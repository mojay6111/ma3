from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets

from app.db.session import get_db
from app.db.models import ManagerAccount, TransferRequest, SaccoProfile
from app.core.auth import get_current_manager, require_superadmin
from app.core.at_service import send_sms

router = APIRouter(prefix="/transfer", tags=["transfer"])

class TransferIn(BaseModel):
    to_email: str
    to_phone: str
    to_name: str

@router.post("/request")
async def request_transfer(
    payload: TransferIn,
    db: AsyncSession = Depends(get_db),
    current: ManagerAccount = Depends(get_current_manager)
):
    if not current.is_primary:
        raise HTTPException(status_code=403, detail="Only primary admin can transfer")

    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=48)

    transfer = TransferRequest(
        sacco_id=current.sacco_id,
        from_manager_id=current.id,
        to_email=payload.to_email,
        token=token,
        expires_at=expires
    )
    db.add(transfer)
    await db.commit()

    # Notify new admin via SMS
    send_sms(
        payload.to_phone,
        f"[Ma3] Habari {payload.to_name.split()[0]}, "
        f"umepewa usimamizi wa SACCO. "
        f"Thibitisha: ma3.co.ke/transfer/{token} "
        f"(saa 48 tu)"
    )

    # Notify Ma3 superadmin
    superadmin = (await db.execute(
        select(ManagerAccount).where(ManagerAccount.role == "superadmin")
    )).scalar_one_or_none()
    if superadmin:
        send_sms(
            superadmin.phone,
            f"[Ma3] Transfer request: SACCO {current.sacco_id[:8]} "
            f"from {current.email} to {payload.to_email}"
        )

    return {"status": "transfer_initiated", "expires_hours": 48}

@router.post("/accept/{token}")
async def accept_transfer(
    token: str,
    payload: TransferIn,
    db: AsyncSession = Depends(get_db)
):
    transfer = (await db.execute(
        select(TransferRequest).where(
            TransferRequest.token == token,
            TransferRequest.is_completed == False
        )
    )).scalar_one_or_none()

    if not transfer:
        raise HTTPException(status_code=404, detail="Invalid or expired transfer link")
    if transfer.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Transfer link expired")

    from app.core.auth import hash_password
    # Deactivate old primary admin
    old_manager = (await db.execute(
        select(ManagerAccount).where(ManagerAccount.id == transfer.from_manager_id)
    )).scalar_one_or_none()
    if old_manager:
        old_manager.is_primary = False

    # Create new primary admin
    new_manager = ManagerAccount(
        sacco_id=transfer.sacco_id,
        name=payload.to_name,
        email=payload.to_email,
        phone=payload.to_phone,
        hashed_password=hash_password(secrets.token_urlsafe(16)),
        role="sacco_admin",
        is_primary=True,
        is_active=True
    )
    db.add(new_manager)
    transfer.is_completed = True
    await db.commit()

    send_sms(
        payload.to_phone,
        f"[Ma3] {payload.to_name.split()[0]}, umekuwa admin wa SACCO. "
        f"Weka password mpya: ma3.co.ke/login"
    )
    return {"status": "transfer_complete"}

@router.post("/force-transfer/{sacco_id}")
async def force_transfer(
    sacco_id: str,
    payload: TransferIn,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin)
):
    """Emergency transfer by Ma3 superadmin."""
    old_primary = (await db.execute(
        select(ManagerAccount).where(
            ManagerAccount.sacco_id == sacco_id,
            ManagerAccount.is_primary == True
        )
    )).scalar_one_or_none()
    if old_primary:
        old_primary.is_primary = False
        old_primary.is_active = False

    from app.core.auth import hash_password
    new_manager = ManagerAccount(
        sacco_id=sacco_id,
        name=payload.to_name,
        email=payload.to_email,
        phone=payload.to_phone,
        hashed_password=hash_password(secrets.token_urlsafe(16)),
        role="sacco_admin",
        is_primary=True,
        is_active=True
    )
    db.add(new_manager)
    await db.commit()

    send_sms(
        payload.to_phone,
        f"[Ma3] {payload.to_name.split()[0]}, umepewa usimamizi wa dharura. "
        f"Wasiliana na Ma3: support@ma3.co.ke"
    )
    return {"status": "force_transfer_complete"}
