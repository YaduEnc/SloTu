import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import TimestampMixin


class Dispute(TimestampMixin, Base):
    __tablename__ = "disputes"
    __table_args__ = (Index("idx_disputes_status", "status"),)

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
    raised_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    reason_code: Mapped[str] = mapped_column(String(40), nullable=False)
    reason_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_urls: Mapped[list[str] | None] = mapped_column(ARRAY(String()), nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'open'"))
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=True,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(nullable=True)
