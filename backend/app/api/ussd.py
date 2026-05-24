from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Driver, Vehicle, Route, Trip
from datetime import datetime

router = APIRouter(prefix="/ussd", tags=["ussd"])

@router.post("/", response_class=PlainTextResponse)
async def ussd_handler(
    sessionId: str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...),
    text: str = Form("")
):
    parts = text.strip().split("*")
    level = len(parts) if text else 0

    async with AsyncSessionLocal() as db:
        driver = (await db.execute(
            select(Driver).where(Driver.phone == phoneNumber)
        )).scalar_one_or_none()

    # Level 0 — main menu
    if level == 0:
        if not driver:
            return "END Hujasajiliwa. Wasiliana na SACCO yako."
        return (
            f"CON Karibu Ma3, {driver.name.split()[0]}!\n"
            "1. Check-in kwa route\n"
            "2. Angalia wallet\n"
            "3. Omba malipo"
        )

    # Level 1 — menu choice
    if level == 1:
        choice = parts[0]
        if choice == "1":
            return (
                "CON Chagua route yako:\n"
                "1. 46 CBD-Westlands\n"
                "2. 34 CBD-Kangemi\n"
                "3. 58 CBD-Kikuyu"
            )
        elif choice == "2":
            async with AsyncSessionLocal() as db:
                d = (await db.execute(select(Driver).where(Driver.phone == phoneNumber))).scalar_one_or_none()
            bal = d.wallet_kes if d else 0
            score = d.score if d else 0
            return f"END Wallet: KSh {int(bal)}\nDriver Score: {int(score)}/100"
        elif choice == "3":
            return "END Ombi limetumwa. Utapata SMS hivi karibuni."
        return "END Chaguo batili."

    # Level 2 — route selected, ask pax count
    if level == 2 and parts[0] == "1":
        routes = {"1": "46 CBD-Westlands", "2": "34 CBD-Kangemi", "3": "58 CBD-Kikuyu"}
        route_name = routes.get(parts[1], "Unknown")
        return f"CON Route: {route_name}\nAingiza idadi ya abiria:"

    # Level 3 — pax count received, confirm check-in
    if level == 3 and parts[0] == "1":
        pax = parts[2] if len(parts) > 2 else "0"
        routes = {"1": "46 CBD-Westlands", "2": "34 CBD-Kangemi", "3": "58 CBD-Kikuyu"}
        route_name = routes.get(parts[1], "Unknown")
        return (
            f"END Check-in imefanikiwa!\n"
            f"Route: {route_name}\n"
            f"Abiria: {pax}\n"
            f"Salama barabarani!"
        )

    return "END Kuna tatizo. Jaribu tena."
