import asyncio
from app.db.session import AsyncSessionLocal, init_db
from app.db.models import Route, Stop, Driver, Vehicle

ROUTES = [
    {"name": "46 CBD-Westlands", "sacco": "City Shuttle Sacco", "fare_kes": 50.0,
     "stops": [
        {"name": "CBD", "sequence": 1, "lat": -1.2841, "lng": 36.8155},
        {"name": "University Way", "sequence": 2, "lat": -1.2800, "lng": 36.8140},
        {"name": "Westlands", "sequence": 3, "lat": -1.2673, "lng": 36.8062},
     ]},
    {"name": "34 CBD-Kangemi", "sacco": "Kangemi Express", "fare_kes": 60.0,
     "stops": [
        {"name": "CBD", "sequence": 1, "lat": -1.2841, "lng": 36.8155},
        {"name": "Kawangware", "sequence": 2, "lat": -1.2800, "lng": 36.7700},
        {"name": "Kangemi", "sequence": 3, "lat": -1.2690, "lng": 36.7450},
     ]},
]

DRIVERS = [
    {"name": "James Mwangi", "phone": "+254700000001", "license_no": "DL001"},
    {"name": "Peter Otieno", "phone": "+254700000002", "license_no": "DL002"},
    {"name": "Grace Njeri",  "phone": "+254700000003", "license_no": "DL003"},
]

VEHICLES = [
    {"plate": "KDA 123A"}, {"plate": "KDB 456B"}, {"plate": "KDC 789C"},
]

async def seed():
    await init_db()
    async with AsyncSessionLocal() as db:
        routes = []
        for r in ROUTES:
            route = Route(name=r["name"], sacco=r["sacco"], fare_kes=r["fare_kes"])
            db.add(route)
            await db.flush()
            for s in r["stops"]:
                db.add(Stop(route_id=route.id, **s))
            routes.append(route)

        drivers = []
        for d in DRIVERS:
            driver = Driver(**d)
            db.add(driver)
            await db.flush()
            drivers.append(driver)

        for i, v in enumerate(VEHICLES):
            vehicle = Vehicle(
                plate=v["plate"],
                driver_id=drivers[i].id,
                route_id=routes[i % len(routes)].id
            )
            db.add(vehicle)

        await db.commit()
        print("Seed complete ✓")

if __name__ == "__main__":
    asyncio.run(seed())
