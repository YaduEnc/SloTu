# 15 — Testing Checklist & Acceptance Criteria

## Test stack

- pytest + pytest-asyncio
- httpx async client (no real network)
- factory_boy for fixtures
- testcontainers-python for ephemeral Postgres + Redis
- VCR.py for recorded Cashfree responses
- locust for load tests

## Coverage targets

| Area | Min coverage |
|------|--------------|
| Services (business logic) | 90% |
| API endpoints | 80% |
| State machine | 100% |
| Webhook signature verification | 100% |
| Vault encrypt/decrypt | 100% |

## Per-feature acceptance tests

### Auth

- [ ] OTP send returns 200 with request_id
- [ ] OTP send rate-limits 4th request in same minute → 429
- [ ] Invalid phone → 422 with `INVALID_PHONE`
- [ ] OTP verify happy path issues access + refresh
- [ ] Wrong OTP → 401 `OTP_INVALID`, attempts incremented
- [ ] After 5 failed attempts → request locked → 401 `OTP_TOO_MANY_ATTEMPTS`
- [ ] Expired OTP → 401 `OTP_EXPIRED`
- [ ] Refresh token rotation: old refresh blacklisted after use
- [ ] Logout blacklists JTI

### Listings

- [ ] Seller (KYC approved) can create listing → 201
- [ ] Seller without KYC → 403 `KYC_REQUIRED`
- [ ] Listing in `draft` until first vault credential added
- [ ] Public can list and detail without auth
- [ ] Filters work: category, price range, rating
- [ ] Slots can't go negative
- [ ] Cannot delete listing with active orders

### Orders + State machine

- [ ] Create order locks listing row, decrements slots_available
- [ ] Concurrent create with last slot: only one wins
- [ ] Create order returns Cashfree session
- [ ] Idempotency key: same key returns same order
- [ ] All transitions honoured per ALLOWED dict
- [ ] Invalid transition → 409 `INVALID_STATE_TRANSITION`
- [ ] Auto-expire pending after 30 min
- [ ] Auto-confirm after 24 hr (no dispute)
- [ ] Auto-confirm skipped if dispute open

### Payments webhooks

- [ ] Valid signature accepted
- [ ] Invalid signature → 401 (and no state change)
- [ ] Replay (same event_id) idempotent
- [ ] PAYMENT_SUCCESS transitions pending→paid
- [ ] PAYMENT_FAILED transitions pending→cancelled, restores slot
- [ ] PAYMENT_USER_DROPPED restores slot
- [ ] Webhook responds <3s

### Vault

- [ ] Encrypt round-trip: decrypt(encrypt(x)) == x
- [ ] Tampered ciphertext → InvalidTag exception
- [ ] Reveal request rate-limited 3/15min/order
- [ ] Reveal verify works once, second attempt → 410 `ALREADY_REVEALED`
- [ ] Wrong order owner → 403
- [ ] Wrong order status (e.g. pending) → 409
- [ ] After reveal: order paid→delivered, credential consumed

### Payouts

- [ ] On confirmed → enqueue transfer
- [ ] Idempotent transfer ID (TRF-<order_id>)
- [ ] TRANSFER_SUCCESS → released, total_sales++
- [ ] TRANSFER_FAILED → retry up to 3x
- [ ] After 3 fails → admin alert
- [ ] Beneficiary added once per seller

### Refunds

- [ ] Admin resolution buyer_refund triggers refund
- [ ] REFUND_STATUS_WEBHOOK success → order refunded
- [ ] Slot restored on refund

### Disputes

- [ ] Buyer can dispute paid/delivered/confirmed orders
- [ ] Cannot dispute released or twice
- [ ] Dispute halts auto-confirm
- [ ] Cancels pending payouts
- [ ] Admin resolve: buyer_refund / seller_release / split

### Reviews

- [ ] Buyer can review only released orders
- [ ] Within 30 days only
- [ ] One review per order
- [ ] Trust score recomputed (eventually consistent)

### Admin

- [ ] Non-admin → 403 on all /api/admin/*
- [ ] Two-person rule enforced on force actions
- [ ] Audit log entry on every admin action
- [ ] Broadcast hits correct audience

### Notifications

- [ ] In-app stored on every event
- [ ] SMS sent for OTP, paid, released, disputed
- [ ] Email sent for receipts
- [ ] WS pushes to connected user only
- [ ] WS auth: invalid token disconnects

### Background jobs

- [ ] Auto-confirm picks up exactly-once with FOR UPDATE SKIP LOCKED
- [ ] Expire pending picks correct rows
- [ ] Trust recompute job idempotent
- [ ] Cleanup jobs don't delete recent rows

### Security

- [ ] No vault data in logs ever
- [ ] CORS rejects unallowed origins
- [ ] HSTS header present in production
- [ ] CSRF: refresh cookie SameSite=Lax (no need for token because stateless JWT for mutating endpoints)
- [ ] SQL injection: parameterised queries verified
- [ ] File upload type/size enforced
- [ ] If optional Aadhaar KYC is used, Aadhaar number never persisted (test by reading DB after KYC verify)

## Load test targets

| Endpoint | Target |
|----------|--------|
| `GET /api/listings` (cached) | p95 < 100ms @ 200 RPS |
| `POST /api/auth/otp/send` | p95 < 500ms @ 50 RPS |
| `POST /api/orders` | p95 < 800ms @ 30 RPS |
| `POST /api/payments/webhook/cashfree` | p95 < 200ms @ 100 RPS |

## Smoke test script (post-deploy)

```bash
#!/usr/bin/env bash
set -e
BASE=$1
curl -sf $BASE/api/health | grep '"status":"ok"'
curl -sf -X POST $BASE/api/auth/otp/send -H "Content-Type: application/json" \
  -d '{"email":"smoke@example.com"}' | grep request_id
echo "Smoke ok"
```

## Pre-prod gate

Before promoting to production:
- [ ] All test suites green
- [ ] Cashfree sandbox end-to-end run (create order → pay → webhook → vault reveal → confirm → payout → release)
- [ ] Refund flow end-to-end
- [ ] Dispute resolution end-to-end (admin)
- [ ] Load test passed
- [ ] `pip-audit` clean
- [ ] Sentry empty for last 24h
- [ ] DB backup verified restore
- [ ] Runbook for: stuck payout, failed refund, OTP provider outage
