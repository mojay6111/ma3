import africastalking
import logging
from app.core.config import settings

africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
sms_service     = africastalking.SMS
payment_service = africastalking.Payment

logger = logging.getLogger(__name__)

def send_sms(phone: str, message: str) -> dict:
    try:
        response = sms_service.send(message, [phone], settings.AT_SENDER_ID)
        # Log 406 blacklist errors
        recipients = response.get("SMSMessageData", {}).get("Recipients", [])
        for r in recipients:
            status = r.get("status", "")
            if "406" in str(r.get("statusCode", "")) or "UserInBlacklist" in status:
                logger.warning(
                    f"SMS BLACKLISTED: {phone} | "
                    f"Status: {status} | "
                    f"Fix: Dial *456# → 9 → 5 to re-enable"
                )
            elif r.get("statusCode") == 101:
                logger.info(f"SMS SENT: {phone} | Cost: {r.get('cost')}")
            else:
                logger.warning(f"SMS ISSUE: {phone} | {r}")
        return response
    except Exception as e:
        logger.error(f"SMS ERROR: {phone} | {e}")
        return {"error": str(e)}

def send_eta_sms(phone: str, route_name: str, stop_name: str,
                 eta_minutes: int, seats: int, fare: float) -> dict:
    msg = (
        f"[Ma3] {route_name} inakuja {stop_name} "
        f"in ~{eta_minutes} min. "
        f"Seats: {seats}. Fare: KSh {int(fare)}. "
        f"Lipa: *384*1281#"
    )
    return send_sms(phone, msg)

def send_driver_welcome(phone: str, name: str) -> dict:
    msg = (
        f"[Ma3] Karibu {name.split()[0]}! "
        f"Umesajiliwa kama dereva. "
        f"Piga *384*1281# kuanza. "
        f"Salama barabarani! 🚌"
    )
    return send_sms(phone, msg)

def send_driver_summary(phone: str, earnings: float, score: float) -> dict:
    label = "Hongera! 🌟" if score >= 80 else "Jaribu zaidi 💪"
    msg = (
        f"[Ma3] Leo umepata KSh {int(earnings)}. "
        f"Score: {int(score)}/100. {label} "
        f"Angalia: *384*1281#"
    )
    return send_sms(phone, msg)

def send_sacco_approved(phone: str, name: str, sacco_name: str) -> dict:
    msg = (
        f"[Ma3] Hongera {name.split()[0]}! "
        f"{sacco_name} imeidhinishwa. "
        f"Ingia: ma3.co.ke/login"
    )
    return send_sms(phone, msg)

def send_sacco_rejected(phone: str, name: str, sacco_name: str) -> dict:
    msg = (
        f"[Ma3] Samahani {name.split()[0]}, "
        f"{sacco_name} haikuidhinishwa. "
        f"Wasiliana: support@ma3.co.ke"
    )
    return send_sms(phone, msg)

def send_vehicle_assigned(phone: str, driver_name: str, plate: str) -> dict:
    msg = (
        f"[Ma3] {driver_name.split()[0]}, "
        f"umepewa gari {plate}. "
        f"Piga *384*1281# kuanza. Salama! 🚌"
    )
    return send_sms(phone, msg)

def send_fare_receipt(phone: str, amount: float,
                      plate: str, mpesa_ref: str) -> dict:
    msg = (
        f"[Ma3] Umepay KSh {int(amount)} - {plate}. "
        f"Ref: {mpesa_ref}. Asante!"
    )
    return send_sms(phone, msg)

def initiate_mpesa_payment(phone: str, amount: float,
                           product_name: str = "Ma3Fare") -> dict:
    try:
        return payment_service.mobile_checkout(
            product_name=product_name,
            phone_number=phone,
            currency_code="KES",
            amount=amount,
            metadata={"source": "ma3_fare"}
        )
    except Exception as e:
        logger.error(f"MPESA ERROR: {phone} | {e}")
        return {"error": str(e)}
