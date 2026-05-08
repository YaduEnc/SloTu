import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import TimestampMixin


class Order(TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        Index("idx_orders_buyer", "buyer_id", text("created_at DESC")),
        Index("idx_orders_seller", "seller_id", text("created_at DESC")),
        Index("idx_orders_status_expires", "status", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="RESTRICT"),
        nullable=False,
    )
    buyer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    platform_fee_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    seller_payout_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    fee_percent: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'pending'"))
    delivery_method: Mapped[str | None] = mapped_column(String(30), nullable=True)
    delivered_at: Mapped[datetime | None] = mapped_column(nullable=True)
    confirmed_at: Mapped[datetime | None] = mapped_column(nullable=True)
    released_at: Mapped[datetime | None] = mapped_column(nullable=True)
    expires_at: Mapped[datetime] = mapped_column(nullable=False)
    cancelled_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
