# 04 — API Endpoints (Full Reference)

Every endpoint is prefixed `/api`. All requests use JSON unless noted. All responses use JSON.

**Auth header**: `Authorization: Bearer <jwt>` for protected endpoints.

**Common error envelope**:
```json
{ "error": { "code": "STRING_CODE", "message": "Human readable", "details": {} } }
```

---

## §Health

### `GET /api/health`
- Public. No auth.
- Response 200: `{ "status": "ok", "version": "1.0.0", "db": "ok", "redis": "ok" }`

---

## §Auth

### `POST /api/auth/otp/send`
Request:
```json
{ "email": "aman@example.com" }
```
- Validations: valid email address.
- Rate limit: 3/min/email, 10/hour/email, 30/hour/IP.
- Sends 6-digit OTP via email. Stores `otp_hash`. TTL 5 min.
- Response 200: `{ "request_id": "uuid", "expires_in": 300 }`
- Errors: `INVALID_EMAIL`, `RATE_LIMITED`, `EMAIL_PROVIDER_DOWN`.

### `POST /api/auth/otp/verify`
Request:
```json
{ "request_id": "uuid", "email": "aman@example.com", "otp": "123456" }
```
- Verifies bcrypt hash. Max 5 attempts.
- Creates user if first time (role default `buyer`).
- Issues JWT (15 min) + refresh cookie (7 days, HttpOnly Secure SameSite=Lax).
- Response 200:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": {
    "id": "uuid",
    "phone": null,
    "name": null,
    "email": "aman@example.com",
    "role": "buyer",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "is_new_user": true
}
```
- Errors: `OTP_INVALID`, `OTP_EXPIRED`, `OTP_TOO_MANY_ATTEMPTS`.

### `POST /api/auth/refresh`
- Reads refresh cookie. Issues new access token.
- Response 200: `{ "access_token": "...", "expires_in": 900 }`

### `POST /api/auth/logout`
- Clears refresh cookie. Adds JTI to Redis blacklist.
- Response 204.

### `GET /api/auth/me`
- Auth required.
- Response 200: full user object (same as `otp/verify` `.user` plus seller_profile if exists).

---

## §Users

### `PATCH /api/users/me`
Request:
```json
{ "name": "Aman Kumar", "email": "aman@example.com" }
```
- Email uniqueness checked. Returns updated user.

### `POST /api/users/become-seller`
- Auth: any role. Promotes user to `seller` after seller_profile creation.
- Creates seller_profile in `kyc_status=pending`.
- Response 201: `{ "seller_profile": {...} }`

### `POST /api/users/seller/upi`
Request: `{ "upi_id": "aman@okhdfcbank" }`
- Temporary v1 capture flow.
- Validates only the UPI ID format.
- Saves the UPI ID to the seller profile.
- Leaves `upi_verified=false`.
- Moves `kyc_status` from `pending` to `submitted` if no stronger verification has been completed yet.
- Response 200 includes a lightweight status summary.

### `POST /api/users/seller/aadhaar/send-otp`
Request: `{ "aadhaar": "123456789012" }`
- Optional flow in current v1 direction.
- Calls KYC provider (Karza / Sandbox / IDfy). Provider issues OTP to Aadhaar-linked mobile.
- DO NOT store Aadhaar number. Store only one-way hash of last 4 digits.
- Response 200: `{ "kyc_request_id": "..." }`

### `POST /api/users/seller/aadhaar/verify-otp`
Request: `{ "kyc_request_id": "...", "otp": "123456" }`
- Optional flow in current v1 direction.
- On success: `aadhaar_verified=true`, `kyc_status=approved`.
- Response 200: full seller_profile.

### `GET /api/users/seller/:user_id/public`
- Public. Returns seller's public profile (name, trust_score, total_sales, kyc_verified, member_since). NEVER PII.

---

## §Listings

### `GET /api/listings`
Query params: `category`, `service_slug`, `min_price`, `max_price`, `min_duration`, `max_duration`, `min_rating`, `sort` (`price_asc`,`price_desc`,`rating_desc`,`recent`,`boosted`), `page`, `page_size` (max 50).

Response 200:
```json
{
  "items": [
    {
      "id": "uuid",
      "service_name": "Netflix Premium",
      "service_slug": "netflix-premium",
      "service_category": "video",
      "price_paise": 17900,
      "duration_days": 30,
      "slots_total": 4,
      "slots_available": 2,
      "description": "...",
      "rating_avg": 4.8,
      "rating_count": 132,
      "is_boosted": true,
      "seller": {
        "id": "uuid",
        "name": "Aman K.",
        "trust_score": 4.9,
        "total_sales": 240,
        "kyc_verified": true
      },
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 421,
  "page": 1,
  "page_size": 20
}
```

### `GET /api/listings/:id`
- Public. Increments `views` (rate-limited per IP per listing per minute).
- Response: same as item above + last 10 reviews.

### `POST /api/listings`
- Auth: seller, KYC approved.
- Request:
```json
{
  "service_slug": "netflix-premium",
  "price_paise": 17900,
  "duration_days": 30,
  "slots_total": 2,
  "description": "Family plan, India region, 4K UHD"
}
```
- Validations: service_slug must be in allow-list constant. Price between ₹19 and ₹1999.
- Creates listing in `status=draft` until vault has at least 1 credential entry — then auto `active`.
- Response 201: full listing.

### `PATCH /api/listings/:id`
- Auth: seller (owner only).
- Editable: `price_paise`, `slots_total`, `description`, `status` (only between `active` ↔ `paused`).
- Response 200: updated listing.

### `DELETE /api/listings/:id`
- Auth: seller (owner). Sets `status='removed'` and `deleted_at`.
- Cannot remove if any active orders exist (status in pending/paid/delivered).
- Response 204.

### `GET /api/listings/me`
- Auth: seller. Returns own listings with sales count + revenue.

### `GET /api/listings/services/catalog`
- Public. Returns supported services list (slug, name, category, logo_url, ToS allows sharing? bool).

---

## §Orders

### `POST /api/orders`
- Auth: buyer (any role except admin).
- Request:
```json
{
  "listing_id": "uuid",
  "idempotency_key": "client-generated-uuid"
}
```
- Logic (atomic transaction):
  1. Lock listing row, decrement `slots_available` (FAIL if 0).
  2. Compute `platform_fee_paise = round(price_paise * fee_percent / 100)` (fee_percent 6 default, 4 for Pro sellers).
  3. Insert `orders` row with `status='pending'`, `expires_at = NOW() + 24 hours` (post-payment).
  4. Insert `escrow_transactions` row.
  5. Call Cashfree Create Order → store `cashfree_order_id`, `payment_session_id`.
- Response 201:
```json
{
  "order_id": "uuid",
  "order_number": "SLOT-2026-000123",
  "amount_paise": 17900,
  "cashfree_order_id": "order_xyz",
  "payment_session_id": "session_abc",
  "expires_at": "2026-01-01T00:00:00Z"
}
```

### `GET /api/orders/:id`
- Auth: buyer or seller of order.
- Returns full order + escrow_transaction summary + listing snapshot.

### `GET /api/orders/me`
- Auth: any.
- Query: `role=buyer|seller`, `status`, `page`, `page_size`.
- Returns paginated orders.

### `POST /api/orders/:id/confirm`
- Auth: buyer of this order.
- Only valid when `status='delivered'`.
- Transitions `status` → `'confirmed'`, sets `confirmed_at=NOW()`.
- Triggers async Celery `payout_to_seller_task(order_id)`.
- Response 200: updated order.

### `POST /api/orders/:id/cancel`
- Auth: buyer (only while `status='pending'` and within 5 min of creation).
- Cancels Cashfree order, releases listing slot.
- Response 200.

### `POST /api/orders/:id/dispute`
- See `/api/disputes` below.

---

## §Payments (Cashfree)

### `POST /api/payments/create-session`
Internally called by `POST /api/orders` — exposed only if frontend needs to retry session.
- Auth: buyer.
- Request: `{ "order_id": "uuid" }`
- Response 200: `{ "payment_session_id": "...", "cashfree_order_id": "..." }`

### `POST /api/payments/webhook/cashfree`
- Public endpoint (called by Cashfree).
- **Verify signature** via `x-webhook-signature` and `x-webhook-timestamp` (HMAC-SHA256 of timestamp+payload using webhook secret).
- Idempotent: dedupe via `cf_payment_id` + event type.
- Events handled:
  - `PAYMENT_SUCCESS_WEBHOOK` → order `pending` → `paid`. Trigger credential auto-deliver task.
  - `PAYMENT_FAILED_WEBHOOK` → order `pending` → `cancelled`. Restore slot.
  - `PAYMENT_USER_DROPPED_WEBHOOK` → order `pending` → `cancelled`. Restore slot.
  - `REFUND_STATUS_WEBHOOK` → update `escrow_transactions.refund_status`.
- Always respond 200 quickly (<3s); offload work to Celery.

### `POST /api/payments/webhook/payouts`
- Same pattern. Events: `TRANSFER_SUCCESS`, `TRANSFER_FAILED`, `TRANSFER_REVERSED`.

### `GET /api/payments/order-status/:order_id`
- Auth: buyer/seller of order.
- Returns `{ payment_status, payout_status, refund_status }` from escrow_transaction.

---

## §Vault

### `POST /api/vault/listings/:listing_id/credentials`
- Auth: seller (owner).
- Request:
```json
{
  "credential_type": "login",
  "data": {
    "email": "share@example.com",
    "password": "Sup3rS3cret!",
    "notes": "PIN: 1234"
  }
}
```
or for invite link:
```json
{
  "credential_type": "family_invite_link",
  "data": { "invite_url": "https://netflix.com/invite/abc" }
}
```
- Encrypts `data` (JSON-serialised) with AES-256-GCM. Stores `encrypted_data`, `iv`, `auth_tag`, `key_version`.
- Listing auto-promotes from `draft` to `active` when first credential added.
- Response 201: `{ "id": "uuid", "credential_type": "...", "created_at": "..." }` (NEVER raw data).

### `DELETE /api/vault/credentials/:id`
- Auth: seller. Cannot delete if `consumed_by_order_id` is set.
- Response 204.

### `POST /api/vault/orders/:order_id/reveal/request`
- Auth: buyer of order.
- Only when order `status` in (`paid`, `delivered`).
- Sends 6-digit OTP to buyer's phone.
- Response 200: `{ "request_id": "uuid", "expires_in": 300 }`.
- Rate limit: 3/15min/order.

### `POST /api/vault/orders/:order_id/reveal/verify`
- Auth: buyer.
- Request: `{ "request_id": "uuid", "otp": "123456" }`
- On success:
  - Marks credential `consumed_by_order_id`.
  - Transitions order `paid` → `delivered`.
  - Returns DECRYPTED data **once** (no caching).
- Response 200:
```json
{
  "credential_type": "login",
  "data": { "email": "...", "password": "...", "notes": "..." },
  "delivered_at": "..."
}
```
- After this call, frontend MUST display once and never store.

---

## §Reviews

### `POST /api/reviews`
- Auth: buyer.
- Only valid when order `status` in (`released`, `confirmed`) AND `created_at` within last 30 days AND no review yet.
- Request: `{ "order_id": "uuid", "rating": 5, "comment": "..." }`
- Recomputes seller `trust_score` (weighted avg) async.
- Response 201: review object.

### `GET /api/reviews/seller/:user_id`
- Public. Paginated reviews.

### `GET /api/reviews/listing/:listing_id`
- Public.

---

## §Disputes

### `POST /api/disputes`
- Auth: buyer or seller of order.
- Request:
```json
{
  "order_id": "uuid",
  "reason_code": "access_not_working",
  "reason_text": "Login is failing with 'Invalid password'",
  "evidence_urls": ["https://r2.../proof1.png"]
}
```
- Only valid when order `status` in (`paid`, `delivered`, `confirmed`) and not `released`.
- Transitions order `status` → `'disputed'`.
- Holds escrow.
- Response 201: dispute object.

### `GET /api/disputes/me`
- Auth: any. Returns disputes where user is `raised_by` or order owner.

### `POST /api/disputes/:id/withdraw`
- Auth: `raised_by` only.
- Returns order to previous status. Sets dispute `status='withdrawn'`.

### `POST /api/disputes/uploads/presign`
- Auth: any.
- Request: `{ "filename": "...", "content_type": "image/png", "size_bytes": 1234567 }`
- Returns presigned R2 URL valid 5 min.

---

## §Notifications

### `GET /api/notifications`
- Auth. Returns last 50 unread + last 50 read.

### `POST /api/notifications/:id/read`
- Auth.

### `POST /api/notifications/read-all`
- Auth.

### `WS /api/ws/notifications`
- WebSocket. Auth via JWT in query string `?token=`.
- Server pushes `{ "type": "notification.new", "data": {...} }` events.

---

## §Admin

All require `role=admin`.

### `GET /api/admin/dashboard`
- KPIs: GMV (last 7/30 days), active listings, active sellers, open disputes, payouts queued, refunds pending.

### `GET /api/admin/disputes?status=open`
- Paginated dispute list.

### `POST /api/admin/disputes/:id/resolve`
- Request:
```json
{
  "resolution": "buyer_refund" | "seller_release" | "split",
  "split_percent_to_seller": 50,
  "note": "..."
}
```
- Triggers refund and/or payout accordingly.

### `GET /api/admin/sellers/pending-kyc`
### `POST /api/admin/sellers/:user_id/kyc/approve`
### `POST /api/admin/sellers/:user_id/kyc/reject`
- Body: `{ "reason": "..." }`

### `GET /api/admin/orders?status=...`
### `GET /api/admin/users?q=...`
### `POST /api/admin/listings/:id/takedown`
- Body: `{ "reason": "..." }`

---

## §Waitlist (public)

### `POST /api/waitlist`
Request:
```json
{ "name": "Aman", "email": "aman@example.com", "intent": "buyer" }
```
- Idempotent on email.
- Response 201: `{ "ok": true, "position": 1247 }`

### `GET /api/waitlist/count`
Response: `{ "total": 1247 }`
