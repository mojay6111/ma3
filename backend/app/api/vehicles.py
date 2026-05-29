from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update as sql_update
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.db.models import Vehicle, Driver, Route
from app.core.at_service import send_sms

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

class VehicleIn(BaseModel):
    plate: str
    driver_id: Optional[str] = None
    route_id:  Optional[str] = None
    capacity:  int = 14

class AssignIn(BaseModel):
    driver_id: Optional[str] = None
    route_id:  Optional[str] = None

@router.post("/")
async def create_vehicle(payload: VehicleIn, db: AsyncSession = Depends(get_db)):
    v = Vehicle(**payload.model_dump())
    db.add(v)
    await db.commit()
    await db.refresh(v)
    return {"id": v.id, "plate": v.plate}

@router.get("/")
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Vehicle)
        .options(selectinload(Vehicle.driver), selectinload(Vehicle.route))
    )
    vehicles = res.scalars().all()
    return [
        {
            "id":        v.id,
            "plate":     v.plate,
            "capacity":  v.capacity,
            "is_active": v.is_active,
            "driver_id": v.driver_id,
            "route_id":  v.route_id,
            "driver_name": v.driver.name if v.driver else None,
            "route_name":  v.route.name  if v.route  else None,
            "active":    v.is_active,
        }
        for v in vehicles
    ]

@router.patch("/{vehicle_id}/assign")
async def assign_vehicle(
    vehicle_id: str,
    payload: AssignIn,
    db: AsyncSession = Depends(get_db)
):
    await db.execute(
        sql_update(Vehicle)
        .where(Vehicle.id == vehicle_id)
        .values(driver_id=payload.driver_id, route_id=payload.route_id)
    )
    await db.commit()

    # Notify driver via SMS
    if payload.driver_id:
        v_res = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
        v = v_res.scalar_one_or_none()
        d_res = await db.execute(select(Driver).where(Driver.id == payload.driver_id))
        d = d_res.scalar_one_or_none()
        if d and v:
            send_sms(
                d.phone,
                f"[Ma3] {d.name.split()[0]}, umepewa gari {v.plate}. "
                f"Piga *384*1281# kuanza safari. Salama! 🚌"
            )

    return {"status": "assigned", "vehicle_id": vehicle_id}
