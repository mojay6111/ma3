from fastapi import APIRouter, Form, Request
from fastapi.responses import PlainTextResponse
from app.core.at_service import send_eta_sms
import httpx, logging

router = APIRouter(prefix="/sms", tags=["sms"])
logger = logging.getLogger(__name__)

STOP_ALIASES = {
    "westlands": "Westlands", "town": "CBD", "cbd": "CBD",
    "kangemi": "Kangemi", "kikuyu": "Kikuyu",
    "kawangware": "Kawangware", "muthurwa": "Muthurwa",
    "gpo": "GPO", "gpao": "GPO", "university": "University Way",
}

@router.post("/incoming", response_class=PlainTextResponse)
async def incoming_sms(request: Request):
    # Log raw body so we can see exactly what AT sends
    body = await request.body()
    logger.warning(f"SMS RAW BODY: {body}")

    form = await request.form()
    logger.warning(f"SMS FORM DATA: {dict(form)}")

    # AT sends: from, to, text, date, id, linkId
    from_number = form.get("from") or form.get("From") or ""
    text        = form.get("text") or form.get("Text") or form.get("message") or ""

    keyword = text.strip().lower()
    stop_name = STOP_ALIASES.get(keyword)

    if not stop_name or not from_number:
        return ""

    # Get ETA from ML model
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(
                "http://localhost:8000/predict/eta",
                json={
                    "stop_name": stop_name,
                    "hour": 8,
                    "day_of_week": 1,
                    "pax_count": 7,
                    "speed_kmh": 25,
                    "is_peak": 1,
                    "stop_sequence": 2
                },
                timeout=5
            )
            data = resp.json()
            eta   = data.get("eta_minutes", 5)
            seats = data.get("seats_available", 4)
        except Exception:
            eta, seats = 5, 4

    send_eta_sms(
        phone=from_number,
        route_name="46 CBD-Westlands",
        stop_name=stop_name,
        eta_minutes=int(eta),
        seats=seats,
        fare=50.0
    )
    return ""
