import re
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.constants import INDIAN_PHONE_REGEX, OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS
from app.core.exceptions import AppError
from app.core.security import create_token, decode_token, hash_secret, verify_secret
from app.db import redis_client
from app.models.otp_request import OTPRequest
from app.models.seller_profile import SellerProfile
from app.models.user import User
from app.schemas.auth import LoginResponse, OTPSendResponse, RefreshResponse
from app.schemas.user import MeResponse, SellerProfilePublic, UserResponse
from app.services.otp_service import generate_otp, send_otp


def normalize_phone(phone: str) -> str:
    normalized = re.sub(r"[\s-]", "", phone).strip()
    if normalized.startswith("0"):
        normalized = normalized.lstrip("0")
    if re.fullmatch(r"[6-9]\d{9}", normalized):
        normalized = f"+91{normalized}"
    if not re.fullmatch(INDIAN_PHONE_REGEX, normalized):
        raise AppError(422, "INVALID_PHONE", "Phone number must be a valid Indian mobile", {"field": "phone"})
    return normalized


async def _enforce_send_limits(db: AsyncSession, phone: str, ip_address: str | None) -> None:
    now = datetime.now(timezone.utc)
    per_minute_cutoff = now - timedelta(minutes=1)
    per_hour_cutoff = now - timedelta(hours=1)

    phone_minute = await db.scalar(
        select(func.count()).select_from(OTPRequest).where(
            OTPRequest.phone == phone,
            OTPRequest.created_at >= per_minute_cutoff,
        )
    )
    phone_hour = await db.scalar(
        select(func.count()).select_from(OTPRequest).where(
            OTPRequest.phone == phone,
            OTPRequest.created_at >= per_hour_cutoff,
        )
    )

    if phone_minute >= 3 or phone_hour >= 10:
        raise AppError(429, "RATE_LIMITED", "Too many attempts, try in 1 minute")

    if ip_address:
        ip_hour = await db.scalar(
            select(func.count()).select_from(OTPRequest).where(
                OTPRequest.ip_address == ip_address,
                OTPRequest.created_at >= per_hour_cutoff,
            )
        )
        if ip_hour >= 30:
            raise AppError(429, "RATE_LIMITED", "Too many attempts, try in 1 minute")


async def request_phone_otp(db: AsyncSession, phone: str, ip_address: str | None) -> OTPSendResponse:
    normalized_phone = normalize_phone(phone)
    await _enforce_send_limits(db, normalized_phone, ip_address)

    otp = generate_otp()
    otp_request = OTPRequest(
        phone=normalized_phone,
        otp_hash=hash_secret(otp),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS),
        ip_address=ip_address,
    )
    db.add(otp_request)
    await db.commit()
    await db.refresh(otp_request)

    provider_request_id = await send_otp(normalized_phone, otp)
    return OTPSendResponse(request_id=str(otp_request.id or provider_request_id), expires_in=OTP_TTL_SECONDS)


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=refresh_token,
        max_age=settings.jwt_refresh_ttl_seconds,
        httponly=True,
        secure=settings.app_env != "development",
        samesite="lax",
        domain=settings.refresh_cookie_domain,
        path="/",
    )


async def verify_phone_otp(
    db: AsyncSession,
    response: Response,
    *,
    request_id: uuid.UUID,
    phone: str,
    otp: str,
) -> LoginResponse:
    normalized_phone = normalize_phone(phone)
    otp_row = await db.get(OTPRequest, request_id)
    if otp_row is None or otp_row.phone != normalized_phone:
        raise AppError(401, "OTP_INVALID", "Wrong code, try again")

    now = datetime.now(timezone.utc)
    if otp_row.consumed or otp_row.expires_at < now:
        raise AppError(401, "OTP_EXPIRED", "Code expired, resend")

    if otp_row.attempts >= OTP_MAX_ATTEMPTS:
        raise AppError(401, "OTP_TOO_MANY_ATTEMPTS", "Too many invalid attempts")

    if not verify_secret(otp, otp_row.otp_hash):
        otp_row.attempts += 1
        await db.commit()
        if otp_row.attempts >= OTP_MAX_ATTEMPTS:
            raise AppError(401, "OTP_TOO_MANY_ATTEMPTS", "Too many invalid attempts")
        raise AppError(401, "OTP_INVALID", "Wrong code, try again")

    otp_row.consumed = True

    user = await db.scalar(select(User).where(User.phone == normalized_phone))
    is_new_user = user is None
    if user is None:
        user = User(phone=normalized_phone)
        db.add(user)
        await db.flush()

    user.last_login_at = now

    access_token, _, _ = create_token(
        subject=str(user.id),
        phone=user.phone,
        role=user.role,
        token_type="access",
        ttl_seconds=settings.jwt_access_ttl_seconds,
    )
    refresh_token, _, _ = create_token(
        subject=str(user.id),
        phone=user.phone,
        role=user.role,
        token_type="refresh",
        ttl_seconds=settings.jwt_refresh_ttl_seconds,
    )
    _set_refresh_cookie(response, refresh_token)
    await db.commit()
    await db.refresh(user)

    return LoginResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_ttl_seconds,
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user,
    )


async def refresh_access_token(response: Response, refresh_token: str | None) -> RefreshResponse:
    if not refresh_token:
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")

    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")

    if await redis_client.get(f"blacklist:{payload['jti']}"):
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")

    ttl = max(payload["exp"] - int(datetime.now(timezone.utc).timestamp()), 1)
    await redis_client.set(f"blacklist:{payload['jti']}", "1", ex=ttl)

    access_token, _, _ = create_token(
        subject=payload["sub"],
        phone=payload["phone"],
        role=payload["role"],
        token_type="access",
        ttl_seconds=settings.jwt_access_ttl_seconds,
    )
    new_refresh_token, _, _ = create_token(
        subject=payload["sub"],
        phone=payload["phone"],
        role=payload["role"],
        token_type="refresh",
        ttl_seconds=settings.jwt_refresh_ttl_seconds,
    )
    _set_refresh_cookie(response, new_refresh_token)

    return RefreshResponse(access_token=access_token, expires_in=settings.jwt_access_ttl_seconds)


async def logout(response: Response, refresh_token: str | None) -> None:
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            ttl = max(payload["exp"] - int(datetime.now(timezone.utc).timestamp()), 1)
            await redis_client.set(f"blacklist:{payload['jti']}", "1", ex=ttl)
        except Exception:
            pass

    response.delete_cookie(
        key=settings.refresh_cookie_name,
        domain=settings.refresh_cookie_domain,
        path="/",
    )


async def get_current_user_from_token(db: AsyncSession, token: str) -> User:
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")

    if await redis_client.get(f"blacklist:{payload['jti']}"):
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None or not user.is_active:
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")
    return user


async def get_me(db: AsyncSession, user: User) -> MeResponse:
    seller_profile = await db.scalar(select(SellerProfile).where(SellerProfile.user_id == user.id))
    return MeResponse(
        **UserResponse.model_validate(user).model_dump(),
        seller_profile=SellerProfilePublic.model_validate(seller_profile) if seller_profile else None,
    )
