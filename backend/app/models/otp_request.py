import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Index, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import INET, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import CreatedAtMixin


class OTPRequest(CreatedAtMixin, Base):
    __tablename__ = "otp_requests"
    __table_args__ = (
        Index("idx_otp_email_created", "email", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(String(160), nullable=False)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    attempts: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("0"))
    consumed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
