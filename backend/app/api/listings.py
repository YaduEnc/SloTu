import uuid

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.listing import (
    ListingCreateRequest,
    ListingDetailResponse,
    ListingResponse,
    ListingUpdateRequest,
    PaginatedListingsResponse,
    PaginatedMyListingsResponse,
    ServiceCatalogItemResponse,
)
from app.services.listings_service import (
    create_listing,
    delete_listing,
    get_listing_detail,
    list_my_listings,
    list_public_listings,
    list_service_catalog,
    update_listing,
)

router = APIRouter(prefix="/listings", tags=["listings"])


@router.get("", response_model=PaginatedListingsResponse, status_code=status.HTTP_200_OK)
async def get_listings(
    category: str | None = Query(default=None),
    service_slug: str | None = Query(default=None),
    min_price: int | None = Query(default=None, ge=0),
    max_price: int | None = Query(default=None, ge=0),
    min_duration: int | None = Query(default=None, ge=1),
    max_duration: int | None = Query(default=None, ge=1),
    min_rating: float | None = Query(default=None, ge=0, le=5),
    sort: str = Query(default="boosted"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> PaginatedListingsResponse:
    return await list_public_listings(
        db,
        category=category,
        service_slug=service_slug,
        min_price=min_price,
        max_price=max_price,
        min_duration=min_duration,
        max_duration=max_duration,
        min_rating=min_rating,
        sort=sort,
        page=page,
        page_size=page_size,
    )


@router.get("/services/catalog", response_model=list[ServiceCatalogItemResponse], status_code=status.HTTP_200_OK)
async def get_service_catalog() -> list[ServiceCatalogItemResponse]:
    return await list_service_catalog()


@router.get("/me", response_model=PaginatedMyListingsResponse, status_code=status.HTTP_200_OK)
async def get_my_listings(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PaginatedMyListingsResponse:
    return await list_my_listings(db, current_user, page=page, page_size=page_size)


@router.get("/{listing_id}", response_model=ListingDetailResponse, status_code=status.HTTP_200_OK)
async def get_listing(
    listing_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> ListingDetailResponse:
    return await get_listing_detail(db, listing_id)


@router.post("", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_current_user_listing(
    payload: ListingCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ListingResponse:
    return await create_listing(db, current_user, payload)


@router.patch("/{listing_id}", response_model=ListingResponse, status_code=status.HTTP_200_OK)
async def update_current_user_listing(
    listing_id: uuid.UUID,
    payload: ListingUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ListingResponse:
    return await update_listing(db, current_user, listing_id, payload)


@router.delete("/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    await delete_listing(db, current_user, listing_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
