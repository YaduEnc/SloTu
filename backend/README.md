# SLOTU Backend

This directory contains the phase-1 backend foundation for SLOTU. The old MongoDB placeholder app has been removed and replaced with the FastAPI package layout described in the project specification.

## What is implemented

- FastAPI app entrypoint at `app.main:app`
- Global `/api` router with `GET /api/health`
- Settings management through `pydantic-settings`
- Async SQLAlchemy engine and Redis client wiring
- Celery app with beat schedule scaffold
- Alembic environment scaffold
- Dockerfile and `docker-compose.yml` for local infra and app processes
- Basic tests for the health endpoint

## Current project structure

```text
backend/
├── app/
│   ├── api/
│   ├── core/
│   ├── middleware/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── tasks/
│   ├── celery_app.py
│   ├── config.py
│   ├── db.py
│   ├── deps.py
│   └── main.py
├── alembic/
│   └── versions/
├── tests/
├── .env.example
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
└── requirements.txt
```

## Local setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
docker compose up -d postgres redis
uvicorn app.main:app --reload --port 8001
```

Health check:

```bash
curl http://localhost:8001/api/health
```

Expected response shape:

```json
{
  "status": "ok",
  "version": "0.1.0",
  "db": "ok",
  "redis": "ok"
}
```

If Postgres or Redis is unavailable, the endpoint currently reports `degraded` and marks the failing dependency as `down`.

## Next phases

1. Add SQLAlchemy models and the first Alembic migration for the documented schema.
2. Implement auth (`/api/auth/*`) with OTP and JWT.
3. Add users, seller onboarding, and listing CRUD.
