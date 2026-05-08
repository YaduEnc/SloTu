from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = Field(default="development", alias="APP_ENV")
    app_name: str = Field(default="slotu", alias="APP_NAME")
    app_version: str = Field(default="0.1.0", alias="APP_VERSION")
    app_base_url: str = Field(default="http://localhost:8001", alias="APP_BASE_URL")
    frontend_base_url: str = Field(default="http://localhost:3000", alias="FRONTEND_BASE_URL")
    cors_origins: str = Field(
        default="http://localhost:3000",
        alias="CORS_ORIGINS",
    )
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")

    database_url: str = Field(
        default="postgresql+asyncpg://slotu:slotu@localhost:5432/slotu",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://:password@localhost:6379/0", alias="REDIS_URL")

    jwt_secret: str = Field(default="change-me", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_ttl_seconds: int = Field(default=900, alias="JWT_ACCESS_TTL_SECONDS")
    jwt_refresh_ttl_seconds: int = Field(default=604800, alias="JWT_REFRESH_TTL_SECONDS")
    refresh_cookie_name: str = Field(default="slotu_rt", alias="REFRESH_COOKIE_NAME")
    refresh_cookie_domain: str | None = Field(default=None, alias="REFRESH_COOKIE_DOMAIN")

    cashfree_payments_env: str = Field(default="sandbox", alias="CASHFREE_PAYMENTS_ENV")
    cashfree_payments_app_id: str = Field(default="", alias="CASHFREE_PAYMENTS_APP_ID")
    cashfree_payments_secret_key: str = Field(default="", alias="CASHFREE_PAYMENTS_SECRET_KEY")
    cashfree_payments_webhook_secret: str = Field(
        default="",
        alias="CASHFREE_PAYMENTS_WEBHOOK_SECRET",
    )
    cashfree_payments_api_version: str = Field(
        default="2023-08-01",
        alias="CASHFREE_PAYMENTS_API_VERSION",
    )

    cashfree_payouts_env: str = Field(default="sandbox", alias="CASHFREE_PAYOUTS_ENV")
    cashfree_payouts_client_id: str = Field(default="", alias="CASHFREE_PAYOUTS_CLIENT_ID")
    cashfree_payouts_client_secret: str = Field(
        default="",
        alias="CASHFREE_PAYOUTS_CLIENT_SECRET",
    )
    cashfree_payouts_public_key: str = Field(default="", alias="CASHFREE_PAYOUTS_PUBLIC_KEY")
    cashfree_payouts_webhook_secret: str = Field(
        default="",
        alias="CASHFREE_PAYOUTS_WEBHOOK_SECRET",
    )
    cashfree_payouts_api_version: str = Field(
        default="2024-01-01",
        alias="CASHFREE_PAYOUTS_API_VERSION",
    )
    sms_provider: str = Field(default="fast2sms", alias="SMS_PROVIDER")
    fast2sms_api_key: str = Field(default="", alias="FAST2SMS_API_KEY")
    fast2sms_sender_id: str = Field(default="SLOTUI", alias="FAST2SMS_SENDER_ID")
    fast2sms_dlt_template_otp: str = Field(default="", alias="FAST2SMS_DLT_TEMPLATE_OTP")
    fast2sms_dlt_template_order_paid: str = Field(
        default="",
        alias="FAST2SMS_DLT_TEMPLATE_ORDER_PAID",
    )
    fast2sms_dlt_template_order_released: str = Field(
        default="",
        alias="FAST2SMS_DLT_TEMPLATE_ORDER_RELEASED",
    )
    fast2sms_dlt_template_order_disputed: str = Field(
        default="",
        alias="FAST2SMS_DLT_TEMPLATE_ORDER_DISPUTED",
    )
    fast2sms_dlt_template_kyc_approved: str = Field(
        default="",
        alias="FAST2SMS_DLT_TEMPLATE_KYC_APPROVED",
    )
    sms_fallback_enabled: bool = Field(default=True, alias="SMS_FALLBACK_ENABLED")
    msg91_auth_key: str = Field(default="", alias="MSG91_AUTH_KEY")
    msg91_sender_id: str = Field(default="SLOTUI", alias="MSG91_SENDER_ID")
    msg91_template_otp: str = Field(default="", alias="MSG91_TEMPLATE_OTP")

    email_provider: str = Field(default="sendgrid", alias="EMAIL_PROVIDER")
    sendgrid_api_key: str = Field(default="", alias="SENDGRID_API_KEY")
    sendgrid_from_email: str = Field(default="hello@slotu.in", alias="SENDGRID_FROM_EMAIL")
    sendgrid_from_name: str = Field(default="Slotu", alias="SENDGRID_FROM_NAME")
    email_fallback_enabled: bool = Field(default=False, alias="EMAIL_FALLBACK_ENABLED")
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")

    kyc_provider: str = Field(default="karza", alias="KYC_PROVIDER")
    karza_api_key: str = Field(default="", alias="KARZA_API_KEY")
    karza_base_url: str = Field(default="https://api.karza.in", alias="KARZA_BASE_URL")

    r2_endpoint: str = Field(default="", alias="R2_ENDPOINT")
    r2_access_key_id: str = Field(default="", alias="R2_ACCESS_KEY_ID")
    r2_secret_access_key: str = Field(default="", alias="R2_SECRET_ACCESS_KEY")
    r2_bucket_kyc: str = Field(default="slotu-kyc", alias="R2_BUCKET_KYC")
    r2_bucket_disputes: str = Field(default="slotu-disputes", alias="R2_BUCKET_DISPUTES")
    r2_public_base: str = Field(default="", alias="R2_PUBLIC_BASE")

    vault_master_key: str = Field(default="", alias="VAULT_MASTER_KEY")
    vault_key_version: int = Field(default=1, alias="VAULT_KEY_VERSION")

    rate_limit_global: str = Field(default="600/minute", alias="RATE_LIMIT_GLOBAL")
    rate_limit_otp_send_per_phone: str = Field(
        default="3/minute,10/hour",
        alias="RATE_LIMIT_OTP_SEND_PER_PHONE",
    )
    rate_limit_otp_send_per_ip: str = Field(default="30/hour", alias="RATE_LIMIT_OTP_SEND_PER_IP")
    rate_limit_vault_reveal: str = Field(default="3/15minutes", alias="RATE_LIMIT_VAULT_REVEAL")

    celery_broker_url: str = Field(default="", alias="CELERY_BROKER_URL")
    celery_result_backend: str = Field(default="", alias="CELERY_RESULT_BACKEND")
    celery_worker_concurrency: int = Field(default=4, alias="CELERY_WORKER_CONCURRENCY")
    flower_user: str = Field(default="admin", alias="FLOWER_USER")
    flower_pass: str = Field(default="", alias="FLOWER_PASS")

    admin_bootstrap_phone: str = Field(default="+919999999999", alias="ADMIN_BOOTSTRAP_PHONE")
    default_fee_percent: float = Field(default=6.0, alias="DEFAULT_FEE_PERCENT")
    pro_fee_percent: float = Field(default=4.0, alias="PRO_FEE_PERCENT")
    order_pending_expiry_minutes: int = Field(default=30, alias="ORDER_PENDING_EXPIRY_MINUTES")
    order_auto_confirm_hours: int = Field(default=24, alias="ORDER_AUTO_CONFIRM_HOURS")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    @field_validator("celery_broker_url", "celery_result_backend", mode="before")
    @classmethod
    def default_celery_urls(cls, value: str, info) -> str:
        if value:
            return value
        redis_url = info.data.get("redis_url")
        return redis_url or "redis://:password@localhost:6379/0"

    @property
    def cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
