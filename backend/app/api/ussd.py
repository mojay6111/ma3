from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Driver, Route
from datetime import datetime
import logging

router = APIRouter(prefix="/ussd", tags=["ussd"])
logger = logging.getLogger(__name__)

@router.post("", response_class=PlainTextResponse)
@router.post("/", response_class=PlainTextResponse)
async def ussd_handler(
    sessionId:   str = Form(...),
    serviceCode: str = Form(...),
    phoneNumber: str = Form(...),
    text:        str = Form("")
):
    # AT sends cumulative text: "1", "1*2", "1*2*8"
    raw   = text.strip()
    parts = raw.split("*") if raw else []
    level = len(parts)

    logger.info(f"USSD | session={sessionId} phone={phoneNumber} text='{raw}' level={level}")

    async with AsyncSessionLocal() as db:
        driver = (await db.execute(
            select(Driver).where(Driver.phone == phoneNumber)
        )).scalar_one_or_none()

        routes_res = await db.execute(select(Route).order_by(Route.name))
        routes     = routes_res.scalars().all()

    # Route lookup helpers
    route_menu = "\n".join([f"{i+1}. {r.name} (KSh {int(r.fare_kes)})"
                            for i, r in enumerate(routes)])
    route_map  = {str(i+1): r for i, r in enumerate(routes)}

    # ── Level 0: Main menu ──────────────────────────────
    if level == 0:
        if not driver:
            return (
                "CON Karibu Ma3! 🚌\n"
                "1. Mimi ni dereva\n"
                "2. Pata ETA ya Ma3"
            )
        return (
            f"CON Karibu Ma3, {driver.name.split()[0]}!\n"
            "1. Check-in kwa route\n"
            "2. Angalia wallet\n"
            "3. Omba malipo"
        )

    # ── Level 1: Handle main menu choice ───────────────
    if level == 1:
        choice = parts[0]
        if choice == "1":
            if not driver:
                return "END Hujasajiliwa. Wasiliana na SACCO yako."
            if not routes:
                return "END Hakuna routes bado. Wasiliana na SACCO."
            return f"CON Chagua route yako:\n{route_menu}"
        elif choice == "2":
            if driver:
                score_label = (
                    "Hongera! 🌟" if driver.score >= 80
                    else "Jaribu zaidi 💪" if driver.score >= 50
                    else "Tahadhari ⚠️"
                )
                return (
                    f"END 💼 Wallet: KSh {int(driver.wallet_kes)}\n"
                    f"📊 Score: {int(driver.score)}/100\n"
                    f"{score_label}"
                )
            return "END Tuma nambari yako kwa SACCO kwanza."
        elif choice == "3":
            return "END ✓ Ombi limetumwa. Utapata SMS hivi karibuni."
        return "END Chaguo batili. Jaribu tena."

    # ── Level 2: Route selected → ask pax count ────────
    if level == 2 and parts[0] == "1":
        route = route_map.get(parts[1])
        if not route:
            return "END Route hiyo haipo. Jaribu tena."
        return (
            f"CON ✓ Route: {route.name}\n"
            f"   Fare: KSh {int(route.fare_kes)}\n\n"
            f"Ingiza idadi ya abiria:"
        )

    # ── Level 3: Pax count received → confirm check-in ─
    if level == 3 and parts[0] == "1":
        route = route_map.get(parts[1])
        pax   = parts[2] if len(parts) > 2 else "0"

        # Validate pax is a number
        if not pax.isdigit():
            return "END Idadi si sahihi. Jaribu tena."

        route_name = route.name       if route else "Unknown"
        fare       = int(route.fare_kes) if route else 0
        now        = datetime.now().strftime("%H:%M")

        return (
            f"END ✅ Check-in imefanikiwa!\n"
            f"🚌 Route: {route_name}\n"
            f"👥 Abiria: {pax}\n"
            f"💰 Fare: KSh {fare}\n"
            f"🕐 Saa: {now}\n"
            f"Salama barabarani!"
        )

    return "END Kuna tatizo. Jaribu tena. (*384*1281#)"
