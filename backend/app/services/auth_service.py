import ipaddress
import uuid
from datetime import datetime, timedelta, timezone

from email_validator import EmailNotValidError, validate_email
from fastapi import Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.constants import OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS
from app.core.exceptions import AppError
from app.core.security import create_token, decode_token, hash_secret, verify_secret
from app.db import redis_client
from app.models.otp_request import OTPRequest
from app.models.seller_profile import SellerProfile
from app.models.user import User
from app.schemas.auth import LoginResponse, OTPSendResponse, RefreshResponse
from app.schemas.user import MeResponse, SellerProfileResponse, UserResponse
from app.services.email_service import send_login_otp_email
from app.services.otp_service import generate_otp


def normalize_email(email: str) -> str:
    try:
        normalized = validate_email(email, check_deliverability=False).normalized
    except EmailNotValidError as exc:
        raise AppError(422, "INVALID_EMAIL", "Email address must be valid", {"field": "email"}) from exc
    return normalized.lower()


async def _enforce_send_limits(db: AsyncSession, email: str, ip_address: str | None) -> None:
    now = datetime.now(timezone.utc)
    per_minute_cutoff = now - timedelta(minutes=1)
    per_hour_cutoff = now - timedelta(hours=1)
    ip_value = ipaddress.ip_address(ip_address) if ip_address else None

    email_minute = await db.scalar(
        select(func.count()).select_from(OTPRequest).where(
            OTPRequest.email == email,
            OTPRequest.created_at >= per_minute_cutoff,
        )
    )
    email_hour = await db.scalar(
        select(func.count()).select_from(OTPRequest).where(
            OTPRequest.email == email,
            OTPRequest.created_at >= per_hour_cutoff,
        )
    )

    if email_minute >= 3 or email_hour >= 10:
        raise AppError(429, "RATE_LIMITED", "Too many attempts, try in 1 minute")

    if ip_value:
        ip_hour = await db.scalar(
            select(func.count()).select_from(OTPRequest).where(
                OTPRequest.ip_address == ip_value,
                OTPRequest.created_at >= per_hour_cutoff,
            )
        )
        if ip_hour >= 30:
            raise AppError(429, "RATE_LIMITED", "Too many attempts, try in 1 minute")


async def request_email_otp(db: AsyncSession, email: str, ip_address: str | None) -> OTPSendResponse:
    normalized_email = normalize_email(email)
    await _enforce_send_limits(db, normalized_email, ip_address)
    ip_value = ipaddress.ip_address(ip_address) if ip_address else None

    otp = generate_otp()
    otp_request = OTPRequest(
        email=normalized_email,
        otp_hash=hash_secret(otp),
        expires_at=datetime.now(timezone.utc) + timedelta(seconds=OTP_TTL_SECONDS),
        ip_address=ip_value,
    )
    db.add(otp_request)
    await db.commit()
    await db.refresh(otp_request)

    provider_request_id = await send_login_otp_email(normalized_email, otp)
    return OTPSendResponse(request_id=str(otp_request.id or provider_request_id), expires_in=OTP_TTL_SECONDS)


async def _get_or_create_user(db: AsyncSession, normalized_email: str) -> tuple[User, bool]:
    user = await db.scalar(select(User).where(User.email == normalized_email))
    is_new_user = user is None
    if user is None:
        user = User(email=normalized_email)
        db.add(user)
        await db.flush()
    elif user.email != normalized_email:
        user.email = normalized_email
    return user, is_new_user


def _build_login_response(response: Response, user: User, is_new_user: bool) -> LoginResponse:
    access_token, _, _ = create_token(
        subject=str(user.id),
        phone=user.phone,
        email=user.email,
        role=user.role,
        token_type="access",
        ttl_seconds=settings.jwt_access_ttl_seconds,
    )
    refresh_token, _, _ = create_token(
        subject=str(user.id),
        phone=user.phone,
        email=user.email,
        role=user.role,
        token_type="refresh",
        ttl_seconds=settings.jwt_refresh_ttl_seconds,
    )
    _set_refresh_cookie(response, refresh_token)
    return LoginResponse(
        access_token=access_token,
        expires_in=settings.jwt_access_ttl_seconds,
        user=UserResponse.model_validate(user),
        is_new_user=is_new_user,
    )


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


async def verify_email_otp(
    db: AsyncSession,
    response: Response,
    *,
    request_id: uuid.UUID,
    email: str,
    otp: str,
) -> LoginResponse:
    normalized_email = normalize_email(email)
    otp_row = await db.get(OTPRequest, request_id)
    if otp_row is None or otp_row.email != normalized_email:
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
    user, is_new_user = await _get_or_create_user(db, normalized_email)
    user.last_login_at = now
    await db.commit()
    await db.refresh(user)
    return _build_login_response(response, user, is_new_user)


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
        phone=payload.get("phone"),
        email=payload.get("email"),
        role=payload["role"],
        token_type="access",
        ttl_seconds=settings.jwt_access_ttl_seconds,
    )
    new_refresh_token, _, _ = create_token(
        subject=payload["sub"],
        phone=payload.get("phone"),
        email=payload.get("email"),
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
        seller_profile=SellerProfileResponse.model_validate(seller_profile) if seller_profile else None,
    )
