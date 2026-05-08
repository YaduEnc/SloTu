import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, Integer, SmallInteger, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import TimestampMixin


class Payout(TimestampMixin, Base):
    __tablename__ = "payouts"
    __table_args__ = (
        Index("idx_payouts_seller", "seller_id"),
        Index("idx_payouts_status", "status"),
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
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
    )
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    upi_id: Mapped[str | None] = mapped_column(String(60), nullable=True)
    beneficiary_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cashfree_transfer_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'queued'"))
    attempt_count: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("0"))
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    initiated_at: Mapped[datetime | None] = mapped_column(nullable=True)
    settled_at: Mapped[datetime | None] = mapped_column(nullable=True)
    idempotency_key: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
