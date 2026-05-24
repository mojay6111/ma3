import asyncio, httpx, random
from datetime import datetime

API_URL = "http://localhost:8000/telemetry/"

WAYPOINTS = [
    {"stop_name": "CBD",            "lat": -1.2841, "lng": 36.8155},
    {"stop_name": "Kencom",         "lat": -1.2833, "lng": 36.8148},
    {"stop_name": "University Way", "lat": -1.2800, "lng": 36.8140},
    {"stop_name": "Museum Hill",    "lat": -1.2760, "lng": 36.8120},
    {"stop_name": "Westlands",      "lat": -1.2673, "lng": 36.8062},
]

VEHICLES = [
    "5bdce35b-45ec-46b8-b4e9-ae71e601d2ce",
    "9d9d8d6a-e2d2-4422-90e0-733106853f23",
    "06e6a42d-d36e-4742-a8f6-69912044ce49",
]

async def ping(client, vehicle_id, wp, pax):
    payload = {
        "vehicle_id": vehicle_id,
        "lat": wp["lat"] + random.uniform(-0.0005, 0.0005),
        "lng": wp["lng"] + random.uniform(-0.0005, 0.0005),
        "speed_kmh": random.uniform(15, 55),
        "heading": random.uniform(0, 360),
        "stop_name": wp["stop_name"],
        "pax_count": pax,
    }
    try:
        r = await client.post(API_URL, json=payload, timeout=5)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {vehicle_id[:8]}.. @ {wp['stop_name']} → {r.status_code}")
    except Exception as e:
        print(f"Error: {e}")

async def simulate_vehicle(vehicle_id, offset=0):
    await asyncio.sleep(offset)
    async with httpx.AsyncClient() as client:
        while True:
            pax = random.randint(3, 14)
            for wp in WAYPOINTS:
                await ping(client, vehicle_id, wp, pax)
                pax = max(0, pax + random.randint(-3, 3))
                await asyncio.sleep(5)
            await asyncio.sleep(15)

async def main():
    tasks = [simulate_vehicle(vid, i*3) for i, vid in enumerate(VEHICLES)]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
