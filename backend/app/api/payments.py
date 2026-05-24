from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import Fare, Trip
from app.core.at_service import initiate_mpesa_payment, send_fare_receipt
import uuid

router = APIRouter(prefix="/payments", tags=["payments"])

class FareRequest(BaseModel):
    commuter_phone: str
    trip_id: str
    amount_kes: float
    plate: str

@router.post("/fare")
async def collect_fare(payload: FareRequest, db: AsyncSession = Depends(get_db)):
    mpesa_ref = f"MA3-{uuid.uuid4().hex[:8].upper()}"
    fare = Fare(
        trip_id=payload.trip_id,
        commuter_phone=payload.commuter_phone,
        amount_kes=payload.amount_kes,
        mpesa_ref=mpesa_ref
    )
    db.add(fare)
    await db.commit()
    initiate_mpesa_payment(payload.commuter_phone, payload.amount_kes)
    send_fare_receipt(payload.commuter_phone, payload.amount_kes, payload.plate, mpesa_ref)
    return {"status": "payment_initiated", "ref": mpesa_ref}
