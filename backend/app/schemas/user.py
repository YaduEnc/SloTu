from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict


class SellerProfilePublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    upi_verified: bool
    aadhaar_verified: bool
    trust_score: float
    total_sales: int
    total_disputes: int
    kyc_status: str
    pro_plan_active: bool
    pro_plan_expires_at: datetime | None
    created_at: datetime
    updated_at: datetime


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    phone: str
    name: str | None
    email: str | None
    role: str
    created_at: datetime


class MeResponse(UserResponse):
    seller_profile: SellerProfilePublic | None = None
