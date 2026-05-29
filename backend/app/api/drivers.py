from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Driver
from app.core.at_service import send_sms

router = APIRouter(prefix="/drivers", tags=["drivers"])

class DriverIn(BaseModel):
    name: str
    phone: str
    license_no: str

@router.post("/")
async def create_driver(payload: DriverIn, db: AsyncSession = Depends(get_db)):
    d = Driver(**payload.model_dump())
    db.add(d)
    await db.commit()
    await db.refresh(d)
    # Welcome SMS
    send_sms(
        payload.phone,
        f"[Ma3] Karibu {payload.name.split()[0]}! "
        f"Umesajiliwa kama dereva. "
        f"Piga *384*1281# kuanza. Salama barabarani! 🚌"
    )
    return {"id": d.id, "name": d.name}

@router.get("/")
async def list_drivers(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Driver))
    return [
        {"id": d.id, "name": d.name, "phone": d.phone,
         "license_no": d.license_no, "score": d.score, "wallet_kes": d.wallet_kes}
        for d in res.scalars().all()
    ]

@router.get("/leaderboard")
async def leaderboard(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Driver).order_by(Driver.score.desc()).limit(10))
    return [
        {"rank": i+1, "name": d.name, "score": d.score, "wallet": d.wallet_kes}
        for i, d in enumerate(res.scalars().all())
    ]
