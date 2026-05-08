import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Index, LargeBinary, SmallInteger, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.mixins import CreatedAtMixin


class CredentialVault(CreatedAtMixin, Base):
    __tablename__ = "credentials_vault"
    __table_args__ = (
        Index(
            "idx_vault_listing_unconsumed",
            "listing_id",
            postgresql_where=text("consumed_by_order_id IS NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="RESTRICT"),
        nullable=False,
    )
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    credential_type: Mapped[str] = mapped_column(String(30), nullable=False)
    encrypted_data: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    iv: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    auth_tag: Mapped[bytes] = mapped_column(LargeBinary, nullable=False)
    key_version: Mapped[int] = mapped_column(SmallInteger, nullable=False, server_default=text("1"))
    consumed_by_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="RESTRICT"),
        nullable=True,
    )
    consumed_at: Mapped[datetime | None] = mapped_column(nullable=True)
