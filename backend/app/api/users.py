import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.user import (
    AadhaarSendOtpRequest,
    AadhaarSendOtpResponse,
    AadhaarVerifyOtpRequest,
    BecomeSellerResponse,
    PublicSellerProfileResponse,
    SellerProfileResponse,
    UpiSetRequest,
    UpiSetResponse,
    UserResponse,
    UserUpdateRequest,
)
from app.services.user_service import (
    become_seller,
    get_public_seller_profile,
    send_aadhaar_otp,
    set_seller_upi,
    update_me,
    verify_aadhaar_otp,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.patch("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_current_user(
    payload: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    return await update_me(db, current_user, payload)


@router.get("/seller/{user_id}/public", response_model=PublicSellerProfileResponse, status_code=status.HTTP_200_OK)
async def get_seller_public_profile(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> PublicSellerProfileResponse:
    return await get_public_seller_profile(db, user_id)


@router.post("/become-seller", response_model=BecomeSellerResponse, status_code=status.HTTP_201_CREATED)
async def become_current_user_seller(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> BecomeSellerResponse:
    seller_profile = await become_seller(db, current_user)
    return BecomeSellerResponse(seller_profile=seller_profile)


@router.post("/seller/upi", response_model=UpiSetResponse, status_code=status.HTTP_200_OK)
async def set_current_seller_upi(
    payload: UpiSetRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UpiSetResponse:
    return await set_seller_upi(db, current_user, payload.upi_id)


@router.post("/seller/aadhaar/send-otp", response_model=AadhaarSendOtpResponse, status_code=status.HTTP_200_OK)
async def send_current_seller_aadhaar_otp(
    payload: AadhaarSendOtpRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AadhaarSendOtpResponse:
    return await send_aadhaar_otp(db, current_user, payload.aadhaar)


@router.post("/seller/aadhaar/verify-otp", response_model=SellerProfileResponse, status_code=status.HTTP_200_OK)
async def verify_current_seller_aadhaar_otp(
    payload: AadhaarVerifyOtpRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SellerProfileResponse:
    return await verify_aadhaar_otp(db, current_user, kyc_request_id=payload.kyc_request_id, otp=payload.otp)
