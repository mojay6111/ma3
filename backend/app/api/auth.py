from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import random, string

from app.db.session import get_db
from app.db.models import ManagerAccount, SaccoProfile
from app.core.auth import (
    hash_password, verify_password,
    create_access_token, get_current_manager
)
from app.core.at_service import send_sms

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterIn(BaseModel):
    name: str
    email: str
    phone: str
    password: str

class SaccoRegisterIn(BaseModel):
    # Manager details
    manager_name: str
    email: str
    phone: str
    password: str
    # SACCO details
    sacco_name: str
    registration_no: str
    county: str
    sacco_phone: str
    sacco_email: str
    description: str = ""

def gen_otp(length=6):
    return "".join(random.choices(string.digits, k=length))

@router.post("/register")
async def register_sacco(payload: SaccoRegisterIn, db: AsyncSession = Depends(get_db)):
    # Check email not taken
    existing = (await db.execute(
        select(ManagerAccount).where(ManagerAccount.email == payload.email)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Check SACCO reg number not taken
    existing_sacco = (await db.execute(
        select(SaccoProfile).where(SaccoProfile.registration_no == payload.registration_no)
    )).scalar_one_or_none()
    if existing_sacco:
        raise HTTPException(status_code=400, detail="SACCO registration number already exists")

    # Create SACCO profile (pending approval)
    sacco = SaccoProfile(
        name=payload.sacco_name,
        registration_no=payload.registration_no,
        county=payload.county,
        phone=payload.sacco_phone,
        email=payload.sacco_email,
        description=payload.description,
        is_approved=False
    )
    db.add(sacco)
    await db.flush()

    # Create manager account
    manager = ManagerAccount(
        sacco_id=sacco.id,
        name=payload.manager_name,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role="sacco_admin",
        is_primary=True,
        is_active=True
    )
    db.add(manager)
    await db.commit()

    # Notify manager via SMS
    send_sms(
        payload.phone,
        f"[Ma3] Asante {payload.manager_name.split()[0]}! "
        f"Maombi ya {payload.sacco_name} yamepokelewa. "
        f"Tutakupigia simu baada ya ukaguzi. Muda: saa 24."
    )

    return {
        "status": "pending_approval",
        "message": "SACCO registered. Awaiting Ma3 admin approval.",
        "sacco_id": sacco.id
    }

@router.post("/login")
async def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    manager = (await db.execute(
        select(ManagerAccount).where(ManagerAccount.email == form.username)
    )).scalar_one_or_none()

    if not manager or not verify_password(form.password, manager.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not manager.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    # Check SACCO approval (skip for superadmin)
    if manager.role != "superadmin" and manager.sacco_id:
        sacco = (await db.execute(
            select(SaccoProfile).where(SaccoProfile.id == manager.sacco_id)
        )).scalar_one_or_none()
        if sacco and not sacco.is_approved:
            raise HTTPException(
                status_code=403,
                detail="SACCO pending approval. You will be notified via SMS."
            )

    token = create_access_token({"sub": manager.id, "role": manager.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": manager.role,
        "name": manager.name,
        "sacco_id": manager.sacco_id
    }

@router.get("/me")
async def me(current: ManagerAccount = Depends(get_current_manager)):
    return {
        "id": current.id,
        "name": current.name,
        "email": current.email,
        "phone": current.phone,
        "role": current.role,
        "sacco_id": current.sacco_id,
        "is_primary": current.is_primary
    }
