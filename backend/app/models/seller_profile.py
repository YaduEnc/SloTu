import uuid
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Index, Integer, Numeric, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.mixins import TimestampMixin


class SellerProfile(TimestampMixin, Base):
    __tablename__ = "seller_profiles"
    __table_args__ = (
        Index("idx_seller_kyc", "kyc_status"),
        Index("idx_seller_trust", text("trust_score DESC")),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        unique=True,
    )
    upi_id: Mapped[str | None] = mapped_column(String(60), nullable=True)
    upi_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    aadhaar_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    aadhaar_last4_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pan_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bank_account_last4: Mapped[str | None] = mapped_column(String(4), nullable=True)
    bank_ifsc: Mapped[str | None] = mapped_column(String(11), nullable=True)
    bank_beneficiary_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    trust_score: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False, server_default=text("0.0"))
    total_sales: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    total_disputes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))
    kyc_status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'pending'"))
    pro_plan_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    pro_plan_expires_at: Mapped[datetime | None] = mapped_column(nullable=True)

    user: Mapped["User"] = relationship(back_populates="seller_profile")
