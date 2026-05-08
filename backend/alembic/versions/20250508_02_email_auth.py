"""Switch auth records to email OTP

Revision ID: 20250508_02
Revises: 20250508_01
Create Date: 2026-05-08 17:10:00
"""

from alembic import op
import sqlalchemy as sa


revision = "20250508_02"
down_revision = "20250508_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("users", "phone", existing_type=sa.String(length=15), nullable=True)
    op.add_column("otp_requests", sa.Column("email", sa.String(length=160), nullable=True))

    op.execute(
        """
        UPDATE otp_requests
        SET email = CONCAT(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '@legacy.slotu.local')
        WHERE email IS NULL
        """
    )

    op.alter_column("otp_requests", "email", existing_type=sa.String(length=160), nullable=False)
    op.drop_index("idx_otp_phone_created", table_name="otp_requests")
    op.drop_column("otp_requests", "phone")
    op.create_index("idx_otp_email_created", "otp_requests", ["email", sa.text("created_at DESC")], unique=False)


def downgrade() -> None:
    op.add_column("otp_requests", sa.Column("phone", sa.String(length=15), nullable=True))
    op.execute(
        """
        UPDATE otp_requests
        SET phone = NULL
        WHERE phone IS NULL
        """
    )
    op.alter_column("otp_requests", "phone", existing_type=sa.String(length=15), nullable=False)
    op.drop_index("idx_otp_email_created", table_name="otp_requests")
    op.drop_column("otp_requests", "email")
    op.create_index("idx_otp_phone_created", "otp_requests", ["phone", sa.text("created_at DESC")], unique=False)
    op.alter_column("users", "phone", existing_type=sa.String(length=15), nullable=False)
