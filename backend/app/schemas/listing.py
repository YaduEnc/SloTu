from datetime import datetime
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ListingSellerSummaryResponse(BaseModel):
    id: uuid.UUID
    name: str
    trust_score: float
    total_sales: int
    kyc_verified: bool


class ReviewPreviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    rating: int
    comment: str | None
    created_at: datetime


class ListingResponse(BaseModel):
    id: uuid.UUID
    service_name: str
    service_slug: str
    service_category: str
    price_paise: int
    duration_days: int
    slots_total: int
    slots_available: int
    description: str | None
    status: str
    rating_avg: float
    rating_count: int
    is_boosted: bool
    seller: ListingSellerSummaryResponse
    created_at: datetime


class ListingDetailResponse(ListingResponse):
    recent_reviews: list[ReviewPreviewResponse]
    views: int


class MyListingResponse(ListingResponse):
    total_revenue_paise: int
    active_orders: int
    has_credentials: bool


class PaginatedListingsResponse(BaseModel):
    items: list[ListingResponse]
    total: int
    page: int
    page_size: int


class PaginatedMyListingsResponse(BaseModel):
    items: list[MyListingResponse]
    total: int
    page: int
    page_size: int


class ListingCreateRequest(BaseModel):
    service_slug: str = Field(min_length=3, max_length=80)
    price_paise: int = Field(ge=1900, le=199900)
    duration_days: int = Field(ge=1, le=365)
    slots_total: int = Field(ge=1, le=10)
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("service_slug")
    @classmethod
    def normalize_slug(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("Service slug cannot be blank")
        return normalized

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None


class ListingUpdateRequest(BaseModel):
    price_paise: int | None = Field(default=None, ge=1900, le=199900)
    slots_total: int | None = Field(default=None, ge=1, le=10)
    description: str | None = Field(default=None, max_length=2000)
    status: str | None = Field(default=None, pattern=r"^(active|paused|draft)$")

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return value
        normalized = value.strip()
        return normalized or None


class ServiceCatalogItemResponse(BaseModel):
    slug: str
    name: str
    category: str
    logo_url: str | None
    tos_sharing_allowed: bool
