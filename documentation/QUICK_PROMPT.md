# Quick-paste prompt (single message version)

If you only want to give your backend AI ONE message instead of attaching all 16 files, paste this entire block. It contains the dense executive summary. For full detail, attach the rest of `/app/documentation/`.

---

```
You are building the backend for SLOTU — an Indian subscription-slot marketplace
with escrow payments. Stack: FastAPI + PostgreSQL + Redis + Celery + Cashfree
Payments + Cashfree Payouts + Resend email OTP + AES-256-GCM credential vault.

NON-NEGOTIABLES
1. Every endpoint prefixed /api.
2. Every endpoint has Pydantic v2 request + response models.
3. All money in integer paise. No floats.
4. Auth uses email OTP in the current v1 product flow.
5. Webhook signatures verified before any state change.
6. Order + escrow_transaction creation atomic.
7. Vault never returns plaintext outside OTP-gated reveal endpoint.
8. 24-hour auto-confirm via Celery Beat (not cron).
9. Idempotency keys on all payment/payout/refund operations.
10. Frame transactions as "slot sharing", never "account selling".

BUILD ORDER
Phase 1: skeleton + Alembic + Docker compose
Phase 2: DB migrations (13 tables)
Phase 3: Auth — Resend email OTP + JWT + role middleware
Phase 4: Users + seller onboarding (name, seller profile, payout UPI)
Phase 5: Listings CRUD
Phase 6: Orders + escrow state machine (no payments yet)
Phase 7: Cashfree Payments — create order + webhook
Phase 8: Credential vault (AES-256-GCM + OTP-gated reveal)
Phase 9: Cashfree Payouts — release to seller
Phase 10: Refunds + disputes
Phase 11: Reviews + trust score
Phase 12: Notifications (email + WebSocket + in-app)
Phase 13: Admin panel (/api/admin/*)
Phase 14: Celery Beat tasks (auto_confirm, expire_pending, retry_payouts, etc.)
Phase 15: Tests + load test + hardening

TABLES (PostgreSQL): users, otp_requests, seller_profiles, listings, orders,
escrow_transactions, credentials_vault, reviews, disputes, notifications,
payouts, audit_log, waitlist.

ORDER STATE MACHINE
pending → paid → delivered → confirmed → released
                              ↓
                          disputed → refunded | released | split
pending → cancelled | expired

KEY ENDPOINTS
POST /api/auth/otp/send
POST /api/auth/otp/verify
POST /api/auth/refresh
GET  /api/auth/me
POST /api/users/become-seller
POST /api/users/seller/upi
GET  /api/users/seller/:id/public
GET  /api/listings (filters + pagination)
POST /api/listings
PATCH /api/listings/:id
DELETE /api/listings/:id
GET  /api/listings/me
POST /api/orders (creates Cashfree session, decrements slots atomically)
GET  /api/orders/:id
GET  /api/orders/me?role=buyer|seller
POST /api/orders/:id/confirm
POST /api/orders/:id/cancel
POST /api/payments/webhook/cashfree (signature verified)
POST /api/payments/webhook/payouts (signature verified)
POST /api/vault/listings/:listing_id/credentials
POST /api/vault/orders/:order_id/reveal/request (OTP)
POST /api/vault/orders/:order_id/reveal/verify (returns plaintext ONCE)
POST /api/disputes
POST /api/admin/disputes/:id/resolve
POST /api/waitlist (public — name, email, intent)

CASHFREE PAYMENTS (sandbox: https://sandbox.cashfree.com/pg)
- Headers: x-client-id, x-client-secret, x-api-version: 2023-08-01
- POST /orders to create. Frontend uses payment_session_id with Cashfree JS SDK.
- Webhook signature: HMAC-SHA256(timestamp + raw_body, webhook_secret), base64.
- Events: PAYMENT_SUCCESS_WEBHOOK, PAYMENT_FAILED_WEBHOOK, PAYMENT_USER_DROPPED_WEBHOOK,
  REFUND_STATUS_WEBHOOK.

CASHFREE PAYOUTS (sandbox: https://sandbox.cashfree.com/payout)
- Add beneficiary once per seller (with VPA or bank).
- POST /transfers to pay out. Idempotent transfer_id = TRF-<order_id>.
- Webhook events: TRANSFER_SUCCESS, TRANSFER_FAILED, TRANSFER_REVERSED.
- POST /transfers/:id/cancel for in-flight cancellations on disputes.

VAULT
- AES-256-GCM. Key from VAULT_MASTER_KEY env (32 bytes base64).
- IV 12 bytes random, auth_tag 16 bytes, key_version for rotation.
- Reveal endpoint: OTP-gated, one-shot, never returns plaintext again.
- Decrement listings.slots_available at order creation, mark vault row consumed
  on reveal verify.

CELERY BEAT
- orders.auto_confirm every 5 min
- orders.expire_pending every 5 min
- payouts.retry_failed every 15 min
- trust.recompute_dirty every 30 min
- cleanup.otp_requests every 6 hours
- cleanup.audit_log daily 3 AM UTC

SECURITY
- Bcrypt for OTP hash, AES-256-GCM for vault.
- JWT HS256, access 15 min, refresh 7 days HttpOnly Secure SameSite=Lax cookie.
- Rate limit OTP send 3/min/email, 10/hour/email, 30/hour/IP.
- Email OTP values never stored in plaintext.
- Webhook replay protection via timestamp window 5 min.

LEGAL (must surface in code/copy)
- Slotu = intermediary under IT Act 2000 §79.
- Grievance officer endpoint published.
- Frame as "slot sharing" / "plan member addition".
- Service catalog allow-list: only ToS-permitted family/team plans.

DELIVERABLES PER PHASE
- Code with type hints + docstrings
- Alembic migration if schema change
- Pydantic models in app/schemas/
- Tests covering happy path + 3 failure modes
- README update
- .env.example update

For full detail on anything ambiguous, refer to the attached docs in
/app/documentation/.
```
