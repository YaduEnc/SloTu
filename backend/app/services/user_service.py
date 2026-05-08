import json
import re
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.constants import OTP_TTL_SECONDS
from app.core.exceptions import AppError
from app.core.security import hash_secret, verify_secret
from app.db import redis_client
from app.models.seller_profile import SellerProfile
from app.models.user import User
from app.schemas.user import (
    AadhaarSendOtpResponse,
    SellerProfileResponse,
    UpiSetResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.services.otp_service import generate_otp

UPI_ID_REGEX = re.compile(r"^[a-z0-9._-]{2,}@[a-z]{2,}$")


def _serialize_seller_profile(profile: SellerProfile) -> SellerProfileResponse:
    return SellerProfileResponse.model_validate(profile)


async def _get_seller_profile(db: AsyncSession, user: User) -> SellerProfile:
    seller_profile = await db.scalar(select(SellerProfile).where(SellerProfile.user_id == user.id))
    if seller_profile is None:
        raise AppError(403, "SELLER_PROFILE_REQUIRED", "Seller onboarding required")
    return seller_profile


async def update_me(db: AsyncSession, user: User, payload: UserUpdateRequest) -> UserResponse:
    updates = payload.model_dump(exclude_unset=True)
    if "name" in updates:
        user.name = updates["name"]

    if "email" in updates:
        email = updates["email"]
        if email and email != user.email:
            existing = await db.scalar(select(User).where(User.email == email, User.id != user.id))
            if existing is not None:
                raise AppError(409, "EMAIL_TAKEN", "Email already in use")
        user.email = email

    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)


async def become_seller(db: AsyncSession, user: User) -> SellerProfileResponse:
    seller_profile = await db.scalar(select(SellerProfile).where(SellerProfile.user_id == user.id))
    if seller_profile is None:
        seller_profile = SellerProfile(user_id=user.id)
        db.add(seller_profile)

    if user.role != "admin":
        user.role = "seller"

    await db.commit()
    await db.refresh(user)
    await db.refresh(seller_profile)
    return _serialize_seller_profile(seller_profile)


async def set_seller_upi(db: AsyncSession, user: User, upi_id: str) -> UpiSetResponse:
    if not UPI_ID_REGEX.fullmatch(upi_id):
        raise AppError(422, "INVALID_UPI_ID", "UPI ID must be valid", {"field": "upi_id"})

    seller_profile = await _get_seller_profile(db, user)
    seller_profile.upi_id = upi_id
    seller_profile.upi_verified = False
    if seller_profile.kyc_status == "pending":
        seller_profile.kyc_status = "submitted"
    await db.commit()
    await db.refresh(seller_profile)
    return UpiSetResponse(
        upi_id=seller_profile.upi_id or upi_id,
        upi_verified=seller_profile.upi_verified,
        verification_status="FORMAT_VALID",
    )


async def send_aadhaar_otp(db: AsyncSession, user: User, aadhaar: str) -> AadhaarSendOtpResponse:
    seller_profile = await _get_seller_profile(db, user)
    kyc_request_id = uuid.uuid4()
    otp = generate_otp()
    payload = {
        "user_id": str(user.id),
        "otp_hash": hash_secret(otp),
        "aadhaar_last4_hash": hash_secret(aadhaar[-4:]),
        "seller_profile_id": str(seller_profile.id),
    }

    if settings.app_env != "development" and not settings.karza_api_key:
        raise AppError(503, "KYC_PROVIDER_UNAVAILABLE", "KYC provider unavailable")

    await redis_client.set(f"kyc:aadhaar:{kyc_request_id}", json.dumps(payload), ex=OTP_TTL_SECONDS)
    return AadhaarSendOtpResponse(kyc_request_id=kyc_request_id)


async def verify_aadhaar_otp(
    db: AsyncSession,
    user: User,
    *,
    kyc_request_id: uuid.UUID,
    otp: str,
) -> SellerProfileResponse:
    seller_profile = await _get_seller_profile(db, user)
    key = f"kyc:aadhaar:{kyc_request_id}"
    raw_payload = await redis_client.get(key)
    if not raw_payload:
        raise AppError(401, "KYC_OTP_EXPIRED", "KYC OTP expired, resend")

    payload = json.loads(raw_payload)
    if payload.get("user_id") != str(user.id):
        raise AppError(403, "KYC_REQUEST_FORBIDDEN", "KYC request does not belong to user")
    if not verify_secret(otp, payload["otp_hash"]):
        raise AppError(401, "KYC_OTP_INVALID", "Wrong code, try again")

    seller_profile.aadhaar_verified = True
    seller_profile.kyc_status = "approved"
    seller_profile.aadhaar_last4_hash = payload["aadhaar_last4_hash"]

    await db.commit()
    await db.refresh(seller_profile)
    await redis_client.delete(key)
    return _serialize_seller_profile(seller_profile)
