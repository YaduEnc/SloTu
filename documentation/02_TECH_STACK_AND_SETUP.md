# 02 — Tech Stack & Setup

## Versions (pin these)

```
python==3.11.x
fastapi==0.115.x
uvicorn[standard]==0.32.x
sqlalchemy==2.0.x
alembic==1.13.x
asyncpg==0.30.x
psycopg2-binary==2.9.x
pydantic==2.9.x
pydantic-settings==2.6.x
redis==5.2.x
celery==5.4.x
flower==2.0.x          # Celery monitoring
PyJWT==2.10.x
passlib[bcrypt]==1.7.x
cryptography==43.x      # AES-GCM
httpx==0.28.x
python-multipart==0.0.x
boto3==1.35.x           # for Cloudflare R2
slowapi==0.1.x          # rate limiting
sentry-sdk[fastapi]==2.x
```

## Project structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app, mounts routers, CORS, middleware
│   ├── config.py                # pydantic-settings: env vars
│   ├── deps.py                  # dependency injection: get_db, get_current_user
│   ├── db.py                    # SQLAlchemy engine + session factory
│   ├── celery_app.py            # Celery instance + beat schedule
│   │
│   ├── api/
│   │   ├── auth.py              # /api/auth/*
│   │   ├── users.py             # /api/users/*
│   │   ├── listings.py          # /api/listings/*
│   │   ├── orders.py            # /api/orders/*
│   │   ├── payments.py          # /api/payments/* + webhooks
│   │   ├── vault.py             # /api/vault/*
│   │   ├── reviews.py           # /api/reviews/*
│   │   ├── disputes.py          # /api/disputes/*
│   │   ├── notifications.py     # /api/notifications/*
│   │   └── admin.py             # /api/admin/*
│   │
│   ├── models/                  # SQLAlchemy ORM models (one file per table)
│   │   ├── user.py
│   │   ├── seller_profile.py
│   │   ├── listing.py
│   │   ├── order.py
│   │   ├── escrow_transaction.py
│   │   ├── credentials_vault.py
│   │   ├── review.py
│   │   ├── dispute.py
│   │   ├── notification.py
│   │   ├── payout.py
│   │   └── audit_log.py
│   │
│   ├── schemas/                 # Pydantic v2 models (request + response)
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── listing.py
│   │   ├── order.py
│   │   ├── ...
│   │
│   ├── services/                # Business logic (no FastAPI imports here)
│   │   ├── auth_service.py
│   │   ├── email_service.py      # Resend wrapper for OTP delivery
│   │   ├── cashfree_service.py   # Payments + Payouts
│   │   ├── escrow_service.py     # State machine
│   │   ├── vault_service.py      # AES encrypt/decrypt
│   │   ├── notification_service.py
│   │   ├── trust_score.py
│   │   └── webhook_verify.py
│   │
│   ├── tasks/                   # Celery tasks
│   │   ├── auto_confirm.py      # 24h auto-release
│   │   ├── payout_retry.py
│   │   ├── notify_async.py
│   │   └── cleanup.py
│   │
│   ├── core/
│   │   ├── security.py          # JWT issue/verify, bcrypt
│   │   ├── crypto.py            # AES-GCM helpers
│   │   ├── rate_limit.py
│   │   ├── exceptions.py
│   │   └── constants.py         # enums, error codes
│   │
│   └── middleware/
│       ├── logging.py
│       ├── request_id.py
│       └── auth.py              # role checking decorator
│
├── alembic/
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_listings.py
│   ├── test_orders.py
│   ├── test_payments.py
│   ├── test_vault.py
│   └── test_escrow_state.py
│
├── alembic.ini
├── pyproject.toml
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## docker-compose.yml (services)

- `api` — FastAPI on :8001
- `worker` — Celery worker
- `beat` — Celery Beat
- `flower` — :5555 (Celery monitoring)
- `postgres` — :5432
- `redis` — :6379

## How to run locally

```bash
cp .env.example .env
# fill in keys
docker compose up -d postgres redis
alembic upgrade head
uvicorn app.main:app --reload --port 8001
# in 2nd terminal
celery -A app.celery_app worker --loglevel=info
# in 3rd terminal
celery -A app.celery_app beat --loglevel=info
```

## Health check

`GET /api/health` → `{"status": "ok", "version": "x.y.z", "db": "ok", "redis": "ok"}`
