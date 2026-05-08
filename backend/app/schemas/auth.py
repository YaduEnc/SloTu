import uuid

from pydantic import BaseModel, Field

from app.schemas.user import MeResponse, UserResponse


class OTPSendRequest(BaseModel):
    phone: str


class OTPSendResponse(BaseModel):
    request_id: str
    expires_in: int


class OTPVerifyRequest(BaseModel):
    request_id: uuid.UUID
    phone: str
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "Bearer"
    expires_in: int
    user: UserResponse
    is_new_user: bool


class RefreshResponse(BaseModel):
    access_token: str
    expires_in: int


class LogoutResponse(BaseModel):
    pass
