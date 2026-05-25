from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import SaccoProfile, ManagerAccount
from app.core.auth import require_superadmin, hash_password
from app.core.at_service import send_sms

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/pending-saccos")
async def pending_saccos(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin)
):
    result = await db.execute(
        select(SaccoProfile).where(SaccoProfile.is_approved == False)
    )
    saccos = result.scalars().all()
    return [
        {
            "id": s.id, "name": s.name,
            "registration_no": s.registration_no,
            "county": s.county, "phone": s.phone,
            "email": s.email, "created_at": s.created_at.isoformat()
        }
        for s in saccos
    ]

@router.post("/approve-sacco/{sacco_id}")
async def approve_sacco(
    sacco_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin)
):
    sacco = (await db.execute(
        select(SaccoProfile).where(SaccoProfile.id == sacco_id)
    )).scalar_one_or_none()
    if not sacco:
        raise HTTPException(status_code=404, detail="SACCO not found")

    sacco.is_approved = True
    await db.commit()

    # Get primary manager
    manager = (await db.execute(
        select(ManagerAccount).where(
            ManagerAccount.sacco_id == sacco_id,
            ManagerAccount.is_primary == True
        )
    )).scalar_one_or_none()

    if manager:
        send_sms(
            manager.phone,
            f"[Ma3] Hongera {manager.name.split()[0]}! "
            f"{sacco.name} imeidhinishwa. "
            f"Ingia sasa: ma3.co.ke/login"
        )

    return {"status": "approved", "sacco": sacco.name}

@router.post("/reject-sacco/{sacco_id}")
async def reject_sacco(
    sacco_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin)
):
    sacco = (await db.execute(
        select(SaccoProfile).where(SaccoProfile.id == sacco_id)
    )).scalar_one_or_none()
    if not sacco:
        raise HTTPException(status_code=404, detail="SACCO not found")

    manager = (await db.execute(
        select(ManagerAccount).where(
            ManagerAccount.sacco_id == sacco_id,
            ManagerAccount.is_primary == True
        )
    )).scalar_one_or_none()

    if manager:
        send_sms(
            manager.phone,
            f"[Ma3] Samahani {manager.name.split()[0]}, "
            f"maombi ya {sacco.name} hayakuidhinishwa. "
            f"Wasiliana: support@ma3.co.ke"
        )
        # Deactivate manager account
        manager.is_active = False

    sacco.is_active = False
    await db.commit()
    return {"status": "rejected"}

@router.get("/all-saccos")
async def all_saccos(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_superadmin)
):
    result = await db.execute(select(SaccoProfile))
    saccos = result.scalars().all()
    return [
        {
            "id": s.id, "name": s.name,
            "county": s.county,
            "is_approved": s.is_approved,
            "is_active": s.is_active,
            "created_at": s.created_at.isoformat()
        }
        for s in saccos
    ]

class CreateSuperAdminIn(BaseModel):
    name: str
    email: str
    phone: str
    password: str
    secret: str  # one-time bootstrap secret

@router.post("/create-superadmin")
async def create_superadmin(
    payload: CreateSuperAdminIn,
    db: AsyncSession = Depends(get_db)
):
    # Bootstrap secret — change this after first use
    if payload.secret != "MA3_SUPER_2026":
        raise HTTPException(status_code=403, detail="Invalid secret")

    existing = (await db.execute(
        select(ManagerAccount).where(ManagerAccount.email == payload.email)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email taken")

    superadmin = ManagerAccount(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role="superadmin",
        is_primary=True,
        is_active=True,
        sacco_id=None
    )
    db.add(superadmin)
    await db.commit()
    return {"status": "superadmin created", "email": payload.email}
