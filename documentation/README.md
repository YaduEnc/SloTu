# SLOTU — Backend Build Documentation

This folder contains everything a backend AI (or human engineer) needs to build the SLOTU backend from scratch. Read files in order.

## How to use this with an AI agent

1. Paste `01_MASTER_BUILD_PROMPT.md` as the main system/instruction prompt to your backend AI.
2. Attach the rest of the files as context. The AI should read them in this order:

| # | File | What it covers |
|---|------|----------------|
| 00 | `00_PROJECT_CONTEXT.md` | What SLOTU is, the problem, business model, legal position |
| 01 | `01_MASTER_BUILD_PROMPT.md` | The single prompt you give to your backend AI |
| 02 | `02_TECH_STACK_AND_SETUP.md` | Stack, project structure, how to run locally |
| 03 | `03_DATABASE_SCHEMA.md` | Full PostgreSQL schema with every table, column, index |
| 04 | `04_API_ENDPOINTS.md` | Every endpoint, request body, response, status codes |
| 05 | `05_AUTH_PHONE_OTP.md` | Phone OTP flow (Fast2SMS) + JWT |
| 06 | `06_ESCROW_STATE_MACHINE.md` | Full order lifecycle, all states, all transitions |
| 07 | `07_CASHFREE_INTEGRATION.md` | Payments orders, webhooks, Payouts API, refunds |
| 08 | `08_CREDENTIAL_VAULT.md` | AES-256 encrypted vault + OTP-gated reveal |
| 09 | `09_BACKGROUND_JOBS.md` | Celery beat tasks (24h auto-confirm, payouts, retries) |
| 10 | `10_NOTIFICATIONS.md` | SMS / Email / WebSocket notifications |
| 11 | `11_ADMIN_PANEL.md` | Admin endpoints + dispute resolution |
| 12 | `12_FRONTEND_API_CONTRACT.md` | The exact JSON the React frontend expects (do not change) |
| 13 | `13_SECURITY_LEGAL.md` | Rate limits, IT Act 2000 §79 compliance, ToS framing |
| 14 | `14_ENV_VARS.md` | Every env variable required, where to get it |
| 15 | `15_TESTING_CHECKLIST.md` | Acceptance tests per feature |

## TL;DR for your backend AI

> Build a FastAPI + PostgreSQL + Redis backend for SLOTU, an Indian subscription-slot marketplace with **escrow payments via Cashfree**, **phone OTP login via Fast2SMS**, **AES-256 encrypted credential vault**, and **Celery-driven 24-hour auto-confirm timers**. Every endpoint must be prefixed `/api`. Every financial amount stored as integer paise. Every order + escrow_transaction creation must be atomic. Webhook signature verification is mandatory — never trust frontend payment confirmations.

## Build order (strict)

1. Project skeleton + DB migrations
2. Auth (OTP + JWT + role middleware)
3. Users + seller verification
4. Listings CRUD
5. Orders (no payments yet — just state machine + DB)
6. Cashfree Payments integration (create order + webhook)
7. Credential Vault (encrypt + OTP-gated reveal)
8. Cashfree Payouts (release funds to seller)
9. Refunds + Disputes
10. Reviews + Trust score
11. Notifications (SMS + Email + WS)
12. Admin panel
13. Background jobs (Celery beat)
14. Tests + hardening
