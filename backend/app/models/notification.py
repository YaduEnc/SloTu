import uuid
from typing import Any

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import CreatedAtMixin


class Notification(CreatedAtMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("idx_notif_user_unread", "user_id", "read", text("created_at DESC")),
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
    )
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    cta_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("FALSE"))
    channel: Mapped[str] = mapped_column(String(20), nullable=False, server_default=text("'in_app'"))
    meta: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
