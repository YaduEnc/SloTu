"""Initial SLOTU schema

Revision ID: 20250508_01
Revises:
Create Date: 2026-05-08 09:20:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20250508_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("phone", sa.String(length=15), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=True),
        sa.Column("email", sa.String(length=160), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=False, server_default=sa.text("'buyer'")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("TRUE")),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("role IN ('buyer','seller','admin')", name="ck_users_role"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("phone"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("idx_users_phone", "users", ["phone"], unique=False)
    op.create_index("idx_users_email", "users", ["email"], unique=False)

    op.create_table(
        "otp_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("phone", sa.String(length=15), nullable=False),
        sa.Column("otp_hash", sa.String(length=255), nullable=False),
        sa.Column("attempts", sa.SmallInteger(), nullable=False, server_default=sa.text("0")),
        sa.Column("consumed", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_otp_phone_created", "otp_requests", ["phone", sa.text("created_at DESC")], unique=False)

    op.create_table(
        "seller_profiles",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("upi_id", sa.String(length=60), nullable=True),
        sa.Column("upi_verified", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("aadhaar_verified", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("aadhaar_last4_hash", sa.String(length=255), nullable=True),
        sa.Column("pan_hash", sa.String(length=255), nullable=True),
        sa.Column("bank_account_last4", sa.String(length=4), nullable=True),
        sa.Column("bank_ifsc", sa.String(length=11), nullable=True),
        sa.Column("bank_beneficiary_id", sa.String(length=64), nullable=True),
        sa.Column("trust_score", sa.Numeric(3, 2), nullable=False, server_default=sa.text("0.0")),
        sa.Column("total_sales", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("total_disputes", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("kyc_status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("pro_plan_active", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("pro_plan_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("kyc_status IN ('pending','submitted','approved','rejected')", name="ck_seller_profiles_kyc_status"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index("idx_seller_kyc", "seller_profiles", ["kyc_status"], unique=False)
    op.create_index("idx_seller_trust", "seller_profiles", [sa.text("trust_score DESC")], unique=False)

    op.create_table(
        "listings",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service_name", sa.String(length=80), nullable=False),
        sa.Column("service_slug", sa.String(length=80), nullable=False),
        sa.Column("service_category", sa.String(length=40), nullable=False),
        sa.Column("price_paise", sa.Integer(), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("slots_total", sa.Integer(), nullable=False),
        sa.Column("slots_available", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'active'")),
        sa.Column("rating_avg", sa.Numeric(3, 2), nullable=False, server_default=sa.text("0.0")),
        sa.Column("rating_count", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("views", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_boosted", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint("price_paise > 0", name="ck_listings_price_paise_positive"),
        sa.CheckConstraint("duration_days > 0", name="ck_listings_duration_days_positive"),
        sa.CheckConstraint("slots_total >= 1 AND slots_total <= 10", name="ck_listings_slots_total_range"),
        sa.CheckConstraint("slots_available >= 0", name="ck_listings_slots_available_nonnegative"),
        sa.CheckConstraint("slots_available <= slots_total", name="ck_listings_slots_available_le_slots_total"),
        sa.CheckConstraint("status IN ('draft','active','paused','sold_out','removed')", name="ck_listings_status"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_listings_status_category", "listings", ["status", "service_category"], unique=False)
    op.create_index("idx_listings_seller", "listings", ["seller_id"], unique=False)
    op.create_index("idx_listings_price", "listings", ["price_paise"], unique=False)
    op.create_index("idx_listings_boosted", "listings", [sa.text("is_boosted DESC"), sa.text("created_at DESC")], unique=False)

    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_number", sa.String(length=20), nullable=False),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("platform_fee_paise", sa.Integer(), nullable=False),
        sa.Column("seller_payout_paise", sa.Integer(), nullable=False),
        sa.Column("fee_percent", sa.Numeric(4, 2), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("delivery_method", sa.String(length=30), nullable=True),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("cancelled_reason", sa.Text(), nullable=True),
        sa.Column("idempotency_key", sa.String(length=80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("amount_paise > 0", name="ck_orders_amount_positive"),
        sa.CheckConstraint("platform_fee_paise >= 0", name="ck_orders_platform_fee_nonnegative"),
        sa.CheckConstraint("seller_payout_paise > 0", name="ck_orders_seller_payout_positive"),
        sa.CheckConstraint("status IN ('pending','paid','delivered','confirmed','released','disputed','refunded','cancelled','expired')", name="ck_orders_status"),
        sa.CheckConstraint("amount_paise = platform_fee_paise + seller_payout_paise", name="ck_orders_amount_split"),
        sa.ForeignKeyConstraint(["listing_id"], ["listings.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_number"),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index("idx_orders_buyer", "orders", ["buyer_id", sa.text("created_at DESC")], unique=False)
    op.create_index("idx_orders_seller", "orders", ["seller_id", sa.text("created_at DESC")], unique=False)
    op.create_index("idx_orders_status_expires", "orders", ["status", "expires_at"], unique=False)

    op.create_table(
        "escrow_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cashfree_order_id", sa.String(length=64), nullable=True),
        sa.Column("cashfree_payment_id", sa.String(length=64), nullable=True),
        sa.Column("payment_method", sa.String(length=20), nullable=True),
        sa.Column("payment_status", sa.String(length=20), nullable=False, server_default=sa.text("'created'")),
        sa.Column("payout_status", sa.String(length=20), nullable=False, server_default=sa.text("'not_started'")),
        sa.Column("refund_status", sa.String(length=20), nullable=False, server_default=sa.text("'not_started'")),
        sa.Column("cashfree_payout_id", sa.String(length=64), nullable=True),
        sa.Column("cashfree_refund_id", sa.String(length=64), nullable=True),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("webhook_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("payment_status IN ('created','pending','success','failed','user_dropped')", name="ck_escrow_payment_status"),
        sa.CheckConstraint("payout_status IN ('not_started','queued','processing','success','failed','reversed')", name="ck_escrow_payout_status"),
        sa.CheckConstraint("refund_status IN ('not_started','queued','processing','success','failed')", name="ck_escrow_refund_status"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
        sa.UniqueConstraint("cashfree_order_id"),
    )
    op.create_index("idx_escrow_order", "escrow_transactions", ["order_id"], unique=False)
    op.create_index("idx_escrow_payment_status", "escrow_transactions", ["payment_status"], unique=False)

    op.create_table(
        "credentials_vault",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("credential_type", sa.String(length=30), nullable=False),
        sa.Column("encrypted_data", sa.LargeBinary(), nullable=False),
        sa.Column("iv", sa.LargeBinary(), nullable=False),
        sa.Column("auth_tag", sa.LargeBinary(), nullable=False),
        sa.Column("key_version", sa.SmallInteger(), nullable=False, server_default=sa.text("1")),
        sa.Column("consumed_by_order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("consumed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("credential_type IN ('login','family_invite_link','invite_email_target')", name="ck_credentials_vault_type"),
        sa.ForeignKeyConstraint(["listing_id"], ["listings.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["consumed_by_order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_vault_listing_unconsumed",
        "credentials_vault",
        ["listing_id"],
        unique=False,
        postgresql_where=sa.text("consumed_by_order_id IS NULL"),
    )

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("buyer_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("listing_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rating", sa.SmallInteger(), nullable=False),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("is_hidden", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["buyer_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["listing_id"], ["listings.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
    )
    op.create_index("idx_reviews_seller", "reviews", ["seller_id"], unique=False)
    op.create_index("idx_reviews_listing", "reviews", ["listing_id"], unique=False)

    op.create_table(
        "disputes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("raised_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reason_code", sa.String(length=40), nullable=False),
        sa.Column("reason_text", sa.Text(), nullable=True),
        sa.Column("evidence_urls", postgresql.ARRAY(sa.Text()), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'open'")),
        sa.Column("resolution_note", sa.Text(), nullable=True),
        sa.Column("resolved_by", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("reason_code IN ('access_not_working','seller_unresponsive','wrong_credentials','removed_from_plan','other')", name="ck_disputes_reason_code"),
        sa.CheckConstraint("status IN ('open','investigating','resolved_buyer','resolved_seller','withdrawn')", name="ck_disputes_status"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["raised_by"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["resolved_by"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("order_id"),
    )
    op.create_index("idx_disputes_status", "disputes", ["status"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("type", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("cta_url", sa.String(length=255), nullable=True),
        sa.Column("read", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")),
        sa.Column("channel", sa.String(length=20), nullable=False, server_default=sa.text("'in_app'")),
        sa.Column("meta", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("channel IN ('in_app','sms','email','ws')", name="ck_notifications_channel"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_notif_user_unread", "notifications", ["user_id", "read", sa.text("created_at DESC")], unique=False)

    op.create_table(
        "payouts",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("seller_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("order_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("amount_paise", sa.Integer(), nullable=False),
        sa.Column("upi_id", sa.String(length=60), nullable=True),
        sa.Column("beneficiary_id", sa.String(length=64), nullable=True),
        sa.Column("cashfree_transfer_id", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'queued'")),
        sa.Column("attempt_count", sa.SmallInteger(), nullable=False, server_default=sa.text("0")),
        sa.Column("failure_reason", sa.Text(), nullable=True),
        sa.Column("initiated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("settled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("idempotency_key", sa.String(length=80), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("amount_paise > 0", name="ck_payouts_amount_positive"),
        sa.CheckConstraint("status IN ('queued','processing','success','failed','reversed')", name="ck_payouts_status"),
        sa.ForeignKeyConstraint(["seller_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["order_id"], ["orders.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("cashfree_transfer_id"),
        sa.UniqueConstraint("idempotency_key"),
    )
    op.create_index("idx_payouts_seller", "payouts", ["seller_id"], unique=False)
    op.create_index("idx_payouts_status", "payouts", ["status"], unique=False)

    op.create_table(
        "audit_log",
        sa.Column("id", sa.BigInteger(), sa.Identity(), nullable=False),
        sa.Column("actor_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("actor_type", sa.String(length=20), nullable=False),
        sa.Column("entity_type", sa.String(length=40), nullable=False),
        sa.Column("entity_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("action", sa.String(length=60), nullable=False),
        sa.Column("before", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("after", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("actor_type IN ('user','system','admin','webhook')", name="ck_audit_actor_type"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_audit_entity", "audit_log", ["entity_type", "entity_id", sa.text("created_at DESC")], unique=False)
    op.create_index("idx_audit_actor", "audit_log", ["actor_id", sa.text("created_at DESC")], unique=False)

    op.create_table(
        "waitlist",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text("gen_random_uuid()")),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=160), nullable=False),
        sa.Column("intent", sa.String(length=20), nullable=False),
        sa.Column("source", sa.String(length=60), nullable=True),
        sa.Column("ip_address", postgresql.INET(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.CheckConstraint("intent IN ('buyer','seller')", name="ck_waitlist_intent"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )

    op.execute(
        """
        CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )

    for table_name in (
        "users",
        "seller_profiles",
        "listings",
        "orders",
        "escrow_transactions",
        "disputes",
        "payouts",
    ):
        op.execute(
            f"""
            CREATE TRIGGER trg_{table_name}_updated
            BEFORE UPDATE ON {table_name}
            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
            """
        )


def downgrade() -> None:
    for table_name in (
        "payouts",
        "disputes",
        "escrow_transactions",
        "orders",
        "listings",
        "seller_profiles",
        "users",
    ):
        op.execute(f"DROP TRIGGER IF EXISTS trg_{table_name}_updated ON {table_name}")

    op.execute("DROP FUNCTION IF EXISTS set_updated_at()")

    op.drop_table("waitlist")
    op.drop_index("idx_audit_actor", table_name="audit_log")
    op.drop_index("idx_audit_entity", table_name="audit_log")
    op.drop_table("audit_log")
    op.drop_index("idx_payouts_status", table_name="payouts")
    op.drop_index("idx_payouts_seller", table_name="payouts")
    op.drop_table("payouts")
    op.drop_index("idx_notif_user_unread", table_name="notifications")
    op.drop_table("notifications")
    op.drop_index("idx_disputes_status", table_name="disputes")
    op.drop_table("disputes")
    op.drop_index("idx_reviews_listing", table_name="reviews")
    op.drop_index("idx_reviews_seller", table_name="reviews")
    op.drop_table("reviews")
    op.drop_index("idx_vault_listing_unconsumed", table_name="credentials_vault")
    op.drop_table("credentials_vault")
    op.drop_index("idx_escrow_payment_status", table_name="escrow_transactions")
    op.drop_index("idx_escrow_order", table_name="escrow_transactions")
    op.drop_table("escrow_transactions")
    op.drop_index("idx_orders_status_expires", table_name="orders")
    op.drop_index("idx_orders_seller", table_name="orders")
    op.drop_index("idx_orders_buyer", table_name="orders")
    op.drop_table("orders")
    op.drop_index("idx_listings_boosted", table_name="listings")
    op.drop_index("idx_listings_price", table_name="listings")
    op.drop_index("idx_listings_seller", table_name="listings")
    op.drop_index("idx_listings_status_category", table_name="listings")
    op.drop_table("listings")
    op.drop_index("idx_seller_trust", table_name="seller_profiles")
    op.drop_index("idx_seller_kyc", table_name="seller_profiles")
    op.drop_table("seller_profiles")
    op.drop_index("idx_otp_phone_created", table_name="otp_requests")
    op.drop_table("otp_requests")
    op.drop_index("idx_users_email", table_name="users")
    op.drop_index("idx_users_phone", table_name="users")
    op.drop_table("users")
