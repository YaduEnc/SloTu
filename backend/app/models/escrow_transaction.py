import uuid
from typing import Any

from sqlalchemy import ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import TimestampMixin


class EscrowTransaction(TimestampMixin, Base):
    __tablename__ = "escrow_transactions"
    __table_args__ = (
        Index("idx_escrow_order", "order_id"),
        Index("idx_escrow_payment_status", "payment_status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    cashfree_order_id: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True)
    cashfree_payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)
    payment_status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'created'"))
    payout_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'not_started'"),
    )
    refund_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        server_default=text("'not_started'"),
    )
    cashfree_payout_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    cashfree_refund_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    amount_paise: Mapped[int] = mapped_column(Integer, nullable=False)
    webhook_payload: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
