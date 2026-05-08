import logging

import httpx

from app.config import settings
from app.core.exceptions import AppError

logger = logging.getLogger(__name__)


async def send_login_otp_email(email: str, otp: str) -> str:
    subject = "Your SLOTU login code"
    text = f"Your SLOTU login OTP is {otp}. It is valid for 5 minutes. Do not share it with anyone."
    html = (
        "<p>Your <strong>SLOTU</strong> login OTP is "
        f"<strong>{otp}</strong>.</p><p>It is valid for 5 minutes. Do not share it with anyone.</p>"
    )

    if settings.resend_api_key:
        headers = {
            "Authorization": f"Bearer {settings.resend_api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "from": f"{settings.sendgrid_from_name} <{settings.sendgrid_from_email}>",
            "to": [email],
            "subject": subject,
            "html": html,
            "text": text,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
        except httpx.HTTPError as exc:
            logger.error("Resend request failed for %s: %s", email, exc)
            raise AppError(503, "EMAIL_PROVIDER_DOWN", "Email service down, contact support") from exc
        if response.status_code in {200, 202}:
            return response.json().get("id", "")
        logger.error("Resend failed for %s: %s", email, response.text)
        raise AppError(503, "EMAIL_PROVIDER_DOWN", "Email service down, contact support")

    logger.warning("RESEND_API_KEY not set, using development email OTP flow for %s", email)
    logger.info("Development email OTP for %s: %s", email, otp)
    return f"dev-{email}"
