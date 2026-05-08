# 14 — Environment Variables

Copy `.env.example` to `.env` and fill values. NEVER commit `.env`.

## Core

```bash
# App
APP_ENV=development                    # development | staging | production
APP_NAME=slotu
APP_VERSION=0.1.0
APP_BASE_URL=https://api.slotu.in       # without trailing slash
FRONTEND_BASE_URL=https://slotu.in
CORS_ORIGINS=https://slotu.in,https://admin.slotu.in
SENTRY_DSN=                              # optional but recommended

# Database
DATABASE_URL=postgresql+asyncpg://slotu:slotu@postgres:5432/slotu

# Redis
REDIS_URL=redis://:password@redis:6379/0

# JWT
JWT_SECRET=<32+ random bytes base64>     # openssl rand -base64 32
JWT_ALGORITHM=HS256
JWT_ACCESS_TTL_SECONDS=900              # 15 min
JWT_REFRESH_TTL_SECONDS=604800          # 7 days
REFRESH_COOKIE_NAME=slotu_rt
REFRESH_COOKIE_DOMAIN=.slotu.in         # blank in dev
```

## Cashfree Payments (accepting buyer money)

Get from: https://merchant.cashfree.com (sandbox) → Settings → API Keys

```bash
CASHFREE_PAYMENTS_ENV=sandbox            # sandbox | production
CASHFREE_PAYMENTS_APP_ID=
CASHFREE_PAYMENTS_SECRET_KEY=
CASHFREE_PAYMENTS_WEBHOOK_SECRET=
CASHFREE_PAYMENTS_API_VERSION=2023-08-01
```

**Where to get keys**:
1. Sign up at https://merchant.cashfree.com
2. Complete KYC (PAN + bank account verification)
3. Sandbox keys are available immediately; production keys after KYC approval (1–3 business days)

## Cashfree Payouts (paying sellers)

Get from: https://payout.cashfree.com → Developers → API Keys

```bash
CASHFREE_PAYOUTS_ENV=sandbox             # sandbox | production
CASHFREE_PAYOUTS_CLIENT_ID=
CASHFREE_PAYOUTS_CLIENT_SECRET=
CASHFREE_PAYOUTS_PUBLIC_KEY=             # only if using legacy v1 token signing
CASHFREE_PAYOUTS_WEBHOOK_SECRET=
CASHFREE_PAYOUTS_API_VERSION=2024-01-01
```

**Note**: Cashfree Payouts is a SEPARATE product from Payments — separate signup, separate KYC, separate billing. Apply at https://www.cashfree.com/payouts/.

## Email (Resend primary)

```bash
EMAIL_PROVIDER=resend
RESEND_API_KEY=
SENDGRID_FROM_EMAIL=login@yaduraj.me
SENDGRID_FROM_NAME=Slotu
```

## SMS (legacy / optional)

SMS is no longer the primary auth path in v1. Keep these only if SMS notifications or a future SMS login path is reintroduced.

```bash
SMS_PROVIDER=fast2sms                    # fast2sms | msg91
FAST2SMS_API_KEY=
FAST2SMS_SENDER_ID=SLOTUI
FAST2SMS_DLT_TEMPLATE_OTP=
MSG91_AUTH_KEY=
MSG91_SENDER_ID=SLOTUI
MSG91_TEMPLATE_OTP=
```

## Aadhaar verification (legacy optional KYC)

Pick one: Karza, IDfy, Sandbox, Signzy, AuthBridge.

```bash
KYC_PROVIDER=karza                       # or idfy | sandbox | signzy
KARZA_API_KEY=
KARZA_BASE_URL=https://api.karza.in
```

Aadhaar is not part of the primary frontend onboarding flow now.

## File storage (Cloudflare R2 — S3-compatible)

```bash
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_KYC=slotu-kyc
R2_BUCKET_DISPUTES=slotu-disputes
R2_PUBLIC_BASE=https://files.slotu.in    # custom domain on bucket
```

Get from: Cloudflare Dashboard → R2 → Manage API Tokens.

## Vault encryption

```bash
VAULT_MASTER_KEY=                        # openssl rand -base64 32
VAULT_KEY_VERSION=1
```

## Rate limiting

```bash
RATE_LIMIT_GLOBAL=600/minute
RATE_LIMIT_OTP_SEND_PER_EMAIL=3/minute,10/hour
RATE_LIMIT_OTP_SEND_PER_IP=30/hour
RATE_LIMIT_VAULT_REVEAL=3/15minutes
```

## Celery

```bash
CELERY_BROKER_URL=${REDIS_URL}
CELERY_RESULT_BACKEND=${REDIS_URL}
CELERY_WORKER_CONCURRENCY=4
FLOWER_USER=admin
FLOWER_PASS=                              # required in production
```

## Misc

```bash
ADMIN_BOOTSTRAP_EMAIL=admin@example.com
DEFAULT_FEE_PERCENT=6.0
PRO_FEE_PERCENT=4.0
ORDER_PENDING_EXPIRY_MINUTES=30
ORDER_AUTO_CONFIRM_HOURS=24
```

## .env.example

Backend AI must produce a `.env.example` mirror of all the above with empty values and inline comments. Never include real secrets.
