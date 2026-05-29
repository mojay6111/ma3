from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import List, Optional
from app.db.session import get_db
from app.db.models import Route, Stop

router = APIRouter(prefix="/routes", tags=["routes"])

class StopIn(BaseModel):
    name: str
    sequence: int
    lat: float
    lng: float

class RouteIn(BaseModel):
    name: str
    sacco: str
    fare_kes: float
    stops: Optional[List[StopIn]] = []

@router.get("/")
async def list_routes(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Route))
    return [
        {"id": r.id, "name": r.name, "sacco": r.sacco, "fare_kes": r.fare_kes}
        for r in res.scalars().all()
    ]

@router.post("/")
async def create_route(payload: RouteIn, db: AsyncSession = Depends(get_db)):
    route = Route(
        name=payload.name,
        sacco=payload.sacco,
        fare_kes=payload.fare_kes
    )
    db.add(route)
    await db.flush()

    for s in payload.stops:
        stop = Stop(
            route_id=route.id,
            name=s.name,
            sequence=s.sequence,
            lat=s.lat,
            lng=s.lng
        )
        db.add(stop)

    await db.commit()
    await db.refresh(route)
    return {"id": route.id, "name": route.name, "fare_kes": route.fare_kes}

@router.delete("/{route_id}")
async def delete_route(route_id: str, db: AsyncSession = Depends(get_db)):
    route = (await db.execute(
        select(Route).where(Route.id == route_id)
    )).scalar_one_or_none()
    if route:
        await db.delete(route)
        await db.commit()
    return {"status": "deleted"}
