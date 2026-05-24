from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.db.session import get_db
from app.db.models import Telemetry, Vehicle
from app.core.ws_manager import manager

router = APIRouter(prefix="/telemetry", tags=["telemetry"])

class TelemetryIn(BaseModel):
    vehicle_id: str
    lat: float
    lng: float
    speed_kmh: float = 0.0
    heading: float = 0.0
    stop_name: Optional[str] = None
    pax_count: int = 0

@router.post("/")
async def ingest(payload: TelemetryIn, db: AsyncSession = Depends(get_db)):
    t = Telemetry(**payload.model_dump())
    db.add(t)
    await db.execute(
        update(Vehicle).where(Vehicle.id == payload.vehicle_id).values(
            last_lat=payload.lat, last_lng=payload.lng,
            last_stop=payload.stop_name, last_seen=datetime.utcnow()
        )
    )
    await db.commit()
    await manager.broadcast({
        "event": "telemetry",
        **payload.model_dump(),
        "ts": datetime.utcnow().isoformat()
    })
    return {"status": "ok"}

@router.get("/live")
async def live(db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(Vehicle)
        .options(selectinload(Vehicle.driver))
        .where(Vehicle.is_active == True)
    )
    vehicles = res.scalars().all()
    return [
        {
            "id": v.id,
            "plate": v.plate,
            "lat": v.last_lat,
            "lng": v.last_lng,
            "stop": v.last_stop,
            "last_seen": v.last_seen.isoformat() if v.last_seen else None,
            "score": v.driver.score if v.driver else None
        }
        for v in vehicles
    ]
