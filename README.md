# SLOTU

SLOTU is an India-focused subscription slot-sharing marketplace with escrow, seller verification, and OTP-gated credential delivery.

## Repo layout

- `frontend/`: marketing site and legal pages
- `documentation/`: full backend and product specification
- `backend/`: FastAPI backend foundation aligned to the documented architecture

## Current backend status

The backend has been moved off the old MongoDB placeholder and onto the phase-1 FastAPI scaffold. The current implementation includes:

- `app.main:app` as the backend entrypoint
- `/api/health` for API, Postgres, and Redis health reporting
- settings, DB, Redis, Celery, and Alembic scaffolding
- Docker and local compose files
- initial backend tests

See `backend/README.md` for setup and run instructions.
