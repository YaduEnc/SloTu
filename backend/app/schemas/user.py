from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SellerProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    upi_id: str | None
    upi_verified: bool
    aadhaar_verified: bool
    trust_score: float
    total_sales: int
    total_disputes: int
    kyc_status: str
    pro_plan_active: bool
    pro_plan_expires_at: datetime | None
    member_since: datetime = Field(validation_alias="created_at")


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    phone: str
    name: str | None
    email: str | None
    role: str
    is_active: bool
    created_at: datetime


class MeResponse(UserResponse):
    seller_profile: SellerProfileResponse | None = None


class UserUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        if not normalized:
            raise ValueError("Name cannot be blank")
        return normalized


class BecomeSellerResponse(BaseModel):
    seller_profile: SellerProfileResponse


class UpiSetRequest(BaseModel):
    upi_id: str = Field(min_length=3, max_length=60)

    @field_validator("upi_id")
    @classmethod
    def strip_upi_id(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("UPI ID cannot be blank")
        return normalized


class UpiSetResponse(BaseModel):
    upi_id: str
    upi_verified: bool
    verification_status: str


class AadhaarSendOtpRequest(BaseModel):
    aadhaar: str = Field(pattern=r"^\d{12}$")


class AadhaarSendOtpResponse(BaseModel):
    kyc_request_id: uuid.UUID


class AadhaarVerifyOtpRequest(BaseModel):
    kyc_request_id: uuid.UUID
    otp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")
