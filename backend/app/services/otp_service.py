import logging
import secrets

import httpx

from app.config import settings
from app.core.constants import OTP_LENGTH
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)


def generate_otp() -> str:
    digits = "".join(secrets.choice("0123456789") for _ in range(OTP_LENGTH))
    return digits


def mask_phone(phone: str) -> str:
    if len(phone) < 6:
        return phone
    return f"{phone[:4]}...{phone[-2:]}"


async def send_otp(phone: str, otp: str) -> str:
    if settings.fast2sms_api_key:
        payload = {
            "route": "otp",
            "variables_values": otp,
            "numbers": phone[-10:],
        }
        headers = {"authorization": settings.fast2sms_api_key}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "https://www.fast2sms.com/dev/bulkV2",
                    data=payload,
                    headers=headers,
                )
        except httpx.HTTPError as exc:
            logger.error("Fast2SMS request failed for %s: %s", mask_phone(phone), exc)
            raise AppError(503, "SMS_PROVIDER_DOWN", "SMS service down, contact support") from exc
        if response.status_code == 200 and response.json().get("return") is True:
            return response.json().get("request_id", "")

        logger.error("Fast2SMS failed for %s: %s", mask_phone(phone), response.text)
        raise AppError(503, "SMS_PROVIDER_DOWN", "SMS service down, contact support")

    logger.warning("FAST2SMS_API_KEY not set, using development OTP flow for %s", mask_phone(phone))
    logger.info("Development OTP for %s: %s", mask_phone(phone), otp)
    return f"dev-{phone[-4:]}"
