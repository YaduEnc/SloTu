import ipaddress

from fastapi import APIRouter, Depends, Header, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.exceptions import AppError
from app.db import get_db
from app.schemas.auth import (
    LoginResponse,
    OTPSendRequest,
    OTPSendResponse,
    OTPVerifyRequest,
    RefreshResponse,
)
from app.schemas.user import MeResponse
from app.services.auth_service import (
    get_current_user_from_token,
    get_me,
    logout,
    refresh_access_token,
    request_phone_otp,
    verify_phone_otp,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def extract_client_ip(request: Request) -> str | None:
    candidates = []
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        candidates.append(forwarded_for.split(",")[0].strip())
    if request.client and request.client.host:
        candidates.append(request.client.host)

    for candidate in candidates:
        try:
            return str(ipaddress.ip_address(candidate))
        except ValueError:
            continue
    return None


@router.post("/otp/send", response_model=OTPSendResponse, status_code=status.HTTP_200_OK)
async def send_otp_code(
    payload: OTPSendRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> OTPSendResponse:
    ip_address = extract_client_ip(request)
    return await request_phone_otp(db, payload.phone, ip_address)


@router.post("/otp/verify", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def verify_otp_code(
    payload: OTPVerifyRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    return await verify_phone_otp(
        db,
        response,
        request_id=payload.request_id,
        phone=payload.phone,
        otp=payload.otp,
    )


@router.post("/refresh", response_model=RefreshResponse, status_code=status.HTTP_200_OK)
async def refresh_token(response: Response, request: Request) -> RefreshResponse:
    refresh_token_cookie = request.cookies.get(settings.refresh_cookie_name)
    return await refresh_access_token(response, refresh_token_cookie)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_user(response: Response, request: Request) -> Response:
    refresh_token_cookie = request.cookies.get(settings.refresh_cookie_name)
    await logout(response, refresh_token_cookie)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=MeResponse, status_code=status.HTTP_200_OK)
async def get_current_me(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> MeResponse:
    if not authorization or not authorization.startswith("Bearer "):
        raise AppError(401, "UNAUTHENTICATED", "Authentication required")
    user = await get_current_user_from_token(db, authorization.removeprefix("Bearer ").strip())
    return await get_me(db, user)
