import africastalking
from app.core.config import settings

africastalking.initialize(settings.AT_USERNAME, settings.AT_API_KEY)
sms_service = africastalking.SMS
payment_service = africastalking.Payment

def send_sms(phone: str, message: str) -> dict:
    try:
        return sms_service.send(message, [phone], settings.AT_SENDER_ID)
    except Exception as e:
        return {"error": str(e)}

def send_eta_sms(phone: str, route_name: str, stop_name: str, eta_minutes: int, seats: int, fare: float) -> dict:
    msg = (
        f"[Ma3] {route_name} inakuja {stop_name} in ~{eta_minutes} min. "
        f"Seats: {seats}. Fare: KSh {int(fare)}. Lipa: *384*1#"
    )
    return send_sms(phone, msg)

def send_driver_summary(phone: str, earnings: float, score: float) -> dict:
    msg = (
        f"[Ma3] Leo umepata KSh {int(earnings)}. "
        f"Driver score: {int(score)}/100. Hongera! Angalia wallet: *384*2#"
    )
    return send_sms(phone, msg)

def send_fare_receipt(phone: str, amount: float, plate: str, mpesa_ref: str) -> dict:
    msg = f"[Ma3] Umepay KSh {int(amount)} - {plate}. Ref: {mpesa_ref}. Asante!"
    return send_sms(phone, msg)

def initiate_mpesa_payment(phone: str, amount: float, product_name: str = "Ma3Fare") -> dict:
    try:
        return payment_service.mobile_checkout(
            product_name=product_name,
            phone_number=phone,
            currency_code="KES",
            amount=amount,
            metadata={"source": "ma3_fare"}
        )
    except Exception as e:
        return {"error": str(e)}
