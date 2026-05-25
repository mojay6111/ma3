from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from app.db.session import AsyncSessionLocal
from app.db.models import Driver
from sqlalchemy import select

router = APIRouter(prefix="/ussd", tags=["ussd"])

@router.post("", response_class=PlainTextResponse)
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

    if level == 0:
        if not driver:
            return "CON Karibu Ma3!\nChagua:\n1. Mimi ni dereva\n2. ETA ya ma3"
        return (
            f"CON Karibu Ma3, {driver.name.split()[0]}!\n"
            "1. Check-in kwa route\n"
            "2. Angalia wallet\n"
            "3. Omba malipo"
        )

    if level == 1:
        choice = parts[0]
        if choice == "1":
            if not driver:
                return "END Hujasajiliwa. Wasiliana na SACCO yako."
            return (
                "CON Chagua route yako:\n"
                "1. 46 CBD-Westlands\n"
                "2. 34 CBD-Kangemi\n"
                "3. 58 CBD-Kikuyu"
            )
        elif choice == "2":
            if driver:
                return f"END Wallet: KSh {int(driver.wallet_kes)}\nDriver Score: {int(driver.score)}/100"
            return "END Tuma nambari yako kwa SACCO."
        elif choice == "3":
            return "END Ombi limetumwa. Utapata SMS hivi karibuni."
        elif choice == "2" and not driver:
            return (
                "CON Tuma neno kwa SMS kupata ETA:\n"
                "Mfano: WESTLANDS\n"
                "kwa nambari yetu"
            )
        return "END Chaguo batili."

    if level == 2 and parts[0] == "1":
        routes = {"1": "46 CBD-Westlands", "2": "34 CBD-Kangemi", "3": "58 CBD-Kikuyu"}
        route_name = routes.get(parts[1], "Unknown")
        return f"CON Route: {route_name}\nIngiza idadi ya abiria:"

    if level == 3 and parts[0] == "1":
        routes = {"1": "46 CBD-Westlands", "2": "34 CBD-Kangemi", "3": "58 CBD-Kikuyu"}
        route_name = routes.get(parts[1], "Unknown")
        pax = parts[2] if len(parts) > 2 else "0"
        return (
            f"END Check-in imefanikiwa!\n"
            f"Route: {route_name}\n"
            f"Abiria: {pax}\n"
            f"Salama barabarani! 🚌"
        )

    return "END Kuna tatizo. Jaribu tena."
