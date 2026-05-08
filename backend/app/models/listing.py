import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Index, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import TimestampMixin


class Listing(TimestampMixin, Base):
    __tablename__ = "listings"
    __table_args__ = (
        Index("idx_listings_status_category", "status", "service_category"),
        Index("idx_listings_seller", "seller_id"),
        Index("idx_listings_price", "price_paise"),
        Index("idx_listings_boosted", text("is_boosted DESC"), text("created_at DESC")),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    service_name: Mapped[str] = mapped_column(String(80), nullable=False)
    service_slug: Mapped[str] = mapped_column(String(80), nullable=False)
    service_category: Mapped[str] = mapped_column(String(40), nullable=False)
    price_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    slots_total: Mapped[int] = mapped_column(Integer, nullable=False)
    slots_available: Mapped[int] = mapped_column(Integer, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'active'"))
    rating_avg: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False, server_default=text("0.0"))
    rating_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    views: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    is_boosted: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)
