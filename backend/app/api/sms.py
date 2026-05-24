from fastapi import APIRouter, Form
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Route, Stop, Vehicle
from app.core.at_service import send_eta_sms
import httpx

router = APIRouter(prefix="/sms", tags=["sms"])

STOP_ALIASES = {
    "westlands": "Westlands", "town": "CBD", "cbd": "CBD",
    "kangemi": "Kangemi", "kikuyu": "Kikuyu", "kawangware": "Kawangware",
    "muthurwa": "Muthurwa", "gpao": "GPO", "gpo": "GPO"
}

@router.post("/incoming", response_class=PlainTextResponse)
async def incoming_sms(
    from_: str = Form(..., alias="from"),
    to: str = Form(...),
    text: str = Form(...),
    date: str = Form(...)
):
    keyword = text.strip().lower()
    stop_name = STOP_ALIASES.get(keyword)

    if not stop_name:
        return ""  # AT expects empty response for unhandled SMS

    # Call our own predict/eta endpoint
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "http://localhost:8000/predict/eta",
                json={"stop_name": stop_name, "hour": 8, "day_of_week": 1, "pax_count": 7}
            )
            data = resp.json()
            eta = data.get("eta_minutes", 5)
            seats = data.get("seats_available", 4)
        except Exception:
            eta, seats = 5, 4

    send_eta_sms(
        phone=from_,
        route_name="46 CBD-Westlands",
        stop_name=stop_name,
        eta_minutes=eta,
        seats=seats,
        fare=50.0
    )
    return ""
