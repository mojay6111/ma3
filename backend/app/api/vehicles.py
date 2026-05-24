from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.db.models import Vehicle, Driver, Route

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

class VehicleIn(BaseModel):
    plate: str
    driver_id: Optional[str] = None
    route_id: Optional[str] = None
    capacity: int = 14

@router.post("/")
async def create_vehicle(payload: VehicleIn, db: AsyncSession = Depends(get_db)):
    v = Vehicle(**payload.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return {"id": v.id, "plate": v.plate}

@router.get("/")
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Vehicle))
    return [{"id": v.id, "plate": v.plate, "active": v.is_active} for v in res.scalars().all()]
