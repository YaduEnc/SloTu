from datetime import datetime, timezone
import uuid

from sqlalchemy import and_, case, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.credentials_vault import CredentialVault
from app.models.listing import Listing
from app.models.order import Order
from app.models.review import Review
from app.models.seller_profile import SellerProfile
from app.models.user import User
from app.schemas.listing import (
    ListingCreateRequest,
    ListingDetailResponse,
    ListingResponse,
    ListingSellerSummaryResponse,
    ListingUpdateRequest,
    MyListingResponse,
    PaginatedListingsResponse,
    PaginatedMyListingsResponse,
    ReviewPreviewResponse,
    ServiceCatalogItemResponse,
)

SERVICE_CATALOG: tuple[dict[str, str | bool | None], ...] = (
    {"slug": "netflix-premium", "name": "Netflix Premium", "category": "video", "logo_url": None, "tos_sharing_allowed": True},
    {"slug": "spotify-family", "name": "Spotify Family", "category": "music", "logo_url": None, "tos_sharing_allowed": True},
    {"slug": "youtube-premium-family", "name": "YouTube Premium Family", "category": "video", "logo_url": None, "tos_sharing_allowed": True},
    {"slug": "canva-pro-teams", "name": "Canva Pro Teams", "category": "design", "logo_url": None, "tos_sharing_allowed": True},
    {"slug": "notion-plus-team", "name": "Notion Plus Team", "category": "productivity", "logo_url": None, "tos_sharing_allowed": True},
    {"slug": "figma-professional-team", "name": "Figma Professional Team", "category": "design", "logo_url": None, "tos_sharing_allowed": True},
    {"slug": "chatgpt-team", "name": "ChatGPT Team", "category": "ai", "logo_url": None, "tos_sharing_allowed": True},
    {"slug": "duolingo-family", "name": "Duolingo Family", "category": "learning", "logo_url": None, "tos_sharing_allowed": True},
)

SERVICE_CATALOG_BY_SLUG = {item["slug"]: item for item in SERVICE_CATALOG}
ACTIVE_ORDER_STATUSES = ("pending", "paid", "delivered", "disputed")
REVENUE_ORDER_STATUSES = ("confirmed", "released")


def _format_seller_name(name: str | None, email: str | None) -> str:
    base = (name or "").strip()
    if base:
        parts = [part for part in base.split() if part]
        if len(parts) == 1:
            return parts[0]
        return f"{parts[0]} {parts[-1][0].upper()}."
    if email:
        local = email.split("@", 1)[0]
        normalized = local.replace(".", " ").replace("_", " ").replace("-", " ").strip()
        parts = [part.capitalize() for part in normalized.split() if part]
        if not parts:
            return "Seller"
        if len(parts) == 1:
            return parts[0]
        return f"{parts[0]} {parts[-1][0].upper()}."
    return "Seller"


def _is_kyc_verified(profile: SellerProfile | None) -> bool:
    if profile is None:
        return False
    return profile.upi_verified or profile.kyc_status == "approved"


def _serialize_seller_summary(user: User, profile: SellerProfile | None) -> ListingSellerSummaryResponse:
    return ListingSellerSummaryResponse(
        id=user.id,
        name=_format_seller_name(user.name, user.email),
        trust_score=float(profile.trust_score) if profile and profile.trust_score is not None else 0.0,
        total_sales=profile.total_sales if profile else 0,
        kyc_verified=_is_kyc_verified(profile),
    )


def _serialize_listing(listing: Listing, user: User, profile: SellerProfile | None) -> ListingResponse:
    return ListingResponse(
        id=listing.id,
        service_name=listing.service_name,
        service_slug=listing.service_slug,
        service_category=listing.service_category,
        price_paise=listing.price_paise,
        duration_days=listing.duration_days,
        slots_total=listing.slots_total,
        slots_available=listing.slots_available,
        description=listing.description,
        status=listing.status,
        rating_avg=float(listing.rating_avg or 0),
        rating_count=listing.rating_count,
        is_boosted=listing.is_boosted,
        seller=_serialize_seller_summary(user, profile),
        created_at=listing.created_at,
    )


async def list_service_catalog() -> list[ServiceCatalogItemResponse]:
    return [ServiceCatalogItemResponse(**item) for item in SERVICE_CATALOG]


async def _get_seller_profile(db: AsyncSession, user: User) -> SellerProfile:
    profile = await db.scalar(select(SellerProfile).where(SellerProfile.user_id == user.id))
    if profile is None:
        raise AppError(403, "SELLER_PROFILE_REQUIRED", "Seller onboarding required")
    return profile


async def _get_listing_for_owner(db: AsyncSession, listing_id: uuid.UUID, user: User) -> Listing:
    listing = await db.get(Listing, listing_id)
    if listing is None or listing.deleted_at is not None:
        raise AppError(404, "LISTING_NOT_FOUND", "Listing not found")
    if listing.seller_id != user.id:
        raise AppError(404, "LISTING_NOT_FOUND", "Listing not found")
    return listing


async def list_public_listings(
    db: AsyncSession,
    *,
    category: str | None = None,
    service_slug: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    min_duration: int | None = None,
    max_duration: int | None = None,
    min_rating: float | None = None,
    sort: str = "boosted",
    page: int = 1,
    page_size: int = 20,
) -> PaginatedListingsResponse:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)

    conditions = [Listing.deleted_at.is_(None), Listing.status == "active"]
    if category:
        conditions.append(Listing.service_category == category)
    if service_slug:
        conditions.append(Listing.service_slug == service_slug)
    if min_price is not None:
        conditions.append(Listing.price_paise >= min_price)
    if max_price is not None:
        conditions.append(Listing.price_paise <= max_price)
    if min_duration is not None:
        conditions.append(Listing.duration_days >= min_duration)
    if max_duration is not None:
        conditions.append(Listing.duration_days <= max_duration)
    if min_rating is not None:
        conditions.append(Listing.rating_avg >= min_rating)

    stmt = (
        select(Listing, User, SellerProfile)
        .join(User, User.id == Listing.seller_id)
        .outerjoin(SellerProfile, SellerProfile.user_id == User.id)
        .where(*conditions)
    )

    if sort == "price_asc":
        stmt = stmt.order_by(Listing.price_paise.asc(), Listing.created_at.desc())
    elif sort == "price_desc":
        stmt = stmt.order_by(Listing.price_paise.desc(), Listing.created_at.desc())
    elif sort == "rating_desc":
        stmt = stmt.order_by(Listing.rating_avg.desc(), Listing.rating_count.desc(), Listing.created_at.desc())
    elif sort == "recent":
        stmt = stmt.order_by(Listing.created_at.desc())
    else:
        stmt = stmt.order_by(Listing.is_boosted.desc(), Listing.created_at.desc())

    total = await db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = (
        await db.execute(
            stmt.offset((page - 1) * page_size).limit(page_size)
        )
    ).all()

    return PaginatedListingsResponse(
        items=[_serialize_listing(listing, user, profile) for listing, user, profile in rows],
        total=total,
        page=page,
        page_size=page_size,
    )


async def get_listing_detail(db: AsyncSession, listing_id: uuid.UUID) -> ListingDetailResponse:
    row = (
        await db.execute(
            select(Listing, User, SellerProfile)
            .join(User, User.id == Listing.seller_id)
            .outerjoin(SellerProfile, SellerProfile.user_id == User.id)
            .where(
                Listing.id == listing_id,
                Listing.deleted_at.is_(None),
                Listing.status == "active",
            )
        )
    ).first()
    if row is None:
        raise AppError(404, "LISTING_NOT_FOUND", "Listing not found")

    listing, user, profile = row
    listing.views = (listing.views or 0) + 1
    reviews = (
        await db.execute(
            select(Review)
            .where(Review.listing_id == listing.id, Review.is_hidden.is_(False))
            .order_by(Review.created_at.desc())
            .limit(10)
        )
    ).scalars().all()
    await db.commit()
    await db.refresh(listing)

    base = _serialize_listing(listing, user, profile)
    return ListingDetailResponse(
        **base.model_dump(),
        recent_reviews=[ReviewPreviewResponse.model_validate(review) for review in reviews],
        views=listing.views,
    )


async def create_listing(db: AsyncSession, user: User, payload: ListingCreateRequest) -> ListingResponse:
    profile = await _get_seller_profile(db, user)
    if not profile.upi_id:
        raise AppError(403, "SELLER_ONBOARDING_INCOMPLETE", "Add payout UPI before creating a listing")

    catalog_item = SERVICE_CATALOG_BY_SLUG.get(payload.service_slug)
    if catalog_item is None or not catalog_item.get("tos_sharing_allowed", False):
        raise AppError(422, "INVALID_SERVICE", "Service is not allowed for listings", {"field": "service_slug"})

    listing = Listing(
        seller_id=user.id,
        service_name=str(catalog_item["name"]),
        service_slug=payload.service_slug,
        service_category=str(catalog_item["category"]),
        price_paise=payload.price_paise,
        duration_days=payload.duration_days,
        slots_total=payload.slots_total,
        slots_available=payload.slots_total,
        description=payload.description,
        status="draft",
        is_boosted=profile.pro_plan_active,
    )
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return _serialize_listing(listing, user, profile)


async def update_listing(
    db: AsyncSession,
    user: User,
    listing_id: uuid.UUID,
    payload: ListingUpdateRequest,
) -> ListingResponse:
    listing = await _get_listing_for_owner(db, listing_id, user)
    profile = await _get_seller_profile(db, user)
    updates = payload.model_dump(exclude_unset=True)

    if "price_paise" in updates:
        listing.price_paise = updates["price_paise"]

    if "description" in updates:
        listing.description = updates["description"]

    if "slots_total" in updates:
        sold_slots = max(listing.slots_total - listing.slots_available, 0)
        if updates["slots_total"] < sold_slots:
            raise AppError(422, "LISTING_SLOT_CONFLICT", "Slots total cannot be lower than already allocated slots")
        listing.slots_total = updates["slots_total"]
        listing.slots_available = updates["slots_total"] - sold_slots

    if "status" in updates:
        if updates["status"] not in {"draft", "active", "paused"}:
            raise AppError(422, "INVALID_LISTING_STATUS", "Listing status is invalid")
        listing.status = updates["status"]

    await db.commit()
    await db.refresh(listing)
    return _serialize_listing(listing, user, profile)


async def delete_listing(db: AsyncSession, user: User, listing_id: uuid.UUID) -> None:
    listing = await _get_listing_for_owner(db, listing_id, user)
    active_orders = await db.scalar(
        select(func.count())
        .select_from(Order)
        .where(Order.listing_id == listing.id, Order.status.in_(ACTIVE_ORDER_STATUSES))
    ) or 0
    if active_orders:
        raise AppError(409, "ACTIVE_ORDERS_EXIST", "Cannot remove a listing with active orders")

    listing.status = "removed"
    listing.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await db.commit()


async def list_my_listings(
    db: AsyncSession,
    user: User,
    *,
    page: int = 1,
    page_size: int = 20,
) -> PaginatedMyListingsResponse:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)
    profile = await _get_seller_profile(db, user)

    order_summary = (
        select(
            Order.listing_id.label("listing_id"),
            func.coalesce(
                func.sum(
                    case(
                        (Order.status.in_(REVENUE_ORDER_STATUSES), Order.seller_payout_paise),
                        else_=0,
                    )
                ),
                0,
            ).label("total_revenue_paise"),
            func.coalesce(
                func.sum(case((Order.status.in_(ACTIVE_ORDER_STATUSES), 1), else_=0)),
                0,
            ).label("active_orders"),
        )
        .where(Order.seller_id == user.id)
        .group_by(Order.listing_id)
        .subquery()
    )

    credential_summary = (
        select(
            CredentialVault.listing_id.label("listing_id"),
            func.count().label("credential_count"),
        )
        .where(CredentialVault.seller_id == user.id, CredentialVault.consumed_by_order_id.is_(None))
        .group_by(CredentialVault.listing_id)
        .subquery()
    )

    stmt = (
        select(
            Listing,
            func.coalesce(order_summary.c.total_revenue_paise, 0),
            func.coalesce(order_summary.c.active_orders, 0),
            func.coalesce(credential_summary.c.credential_count, 0),
        )
        .outerjoin(order_summary, order_summary.c.listing_id == Listing.id)
        .outerjoin(credential_summary, credential_summary.c.listing_id == Listing.id)
        .where(Listing.seller_id == user.id, Listing.deleted_at.is_(None))
        .order_by(Listing.created_at.desc())
    )
    total = await db.scalar(select(func.count()).select_from(stmt.order_by(None).subquery())) or 0
    rows = (await db.execute(stmt.offset((page - 1) * page_size).limit(page_size))).all()

    items = []
    for listing, total_revenue_paise, active_orders, credential_count in rows:
        base = _serialize_listing(listing, user, profile)
        items.append(
            MyListingResponse(
                **base.model_dump(),
                total_revenue_paise=int(total_revenue_paise or 0),
                active_orders=int(active_orders or 0),
                has_credentials=bool(credential_count),
            )
        )

    return PaginatedMyListingsResponse(items=items, total=total, page=page, page_size=page_size)
