# 12 — Frontend API Contract

> The frontend is built and deployed. Backend MUST conform to these contracts exactly.
> If you must change a contract, update this file AND coordinate with the frontend agent.

## Base URL

- Frontend reads `process.env.REACT_APP_BACKEND_URL`
- All calls prefixed with `/api`
- Example call: `${REACT_APP_BACKEND_URL}/api/listings?page=1`

## Auth header

After login, frontend stores `access_token` in memory and sends `Authorization: Bearer <token>` on every request.

Refresh cookie `slotu_rt` is set HttpOnly by backend on `otp/verify` and used automatically by browser.

## Response envelopes

### Success (always JSON)
- 200/201/204 — body is the payload directly (no envelope)
- For lists: `{ "items": [...], "total": N, "page": P, "page_size": S }`

### Error
```json
{
  "error": {
    "code": "INVALID_PHONE",
    "message": "Phone number must be a valid Indian mobile",
    "details": { "field": "phone" }
  }
}
```

Frontend looks at `error.code` first, falls back to `error.message`.

## Error codes the frontend handles specifically

| Code | Frontend behaviour |
|------|--------------------|
| `OTP_INVALID` | Show "Wrong code, try again" |
| `OTP_EXPIRED` | Show "Code expired, resend" |
| `RATE_LIMITED` | Show "Too many attempts, try in 1 minute" |
| `SMS_PROVIDER_DOWN` | Show "SMS service down, contact support" |
| `INSUFFICIENT_ROLE` | Redirect to login |
| `KYC_REQUIRED` | Redirect to KYC page |
| `LISTING_SOLD_OUT` | Show "Last slot just bought — try another" |
| `PAYMENT_FAILED` | Show retry button |
| `INVALID_STATE_TRANSITION` | Show "Action not available in current order state" |
| `IDEMPOTENCY_CONFLICT` | Silently use existing record |

## Date/time format

- All timestamps: ISO 8601 UTC with `Z` suffix → `2026-01-01T12:34:56Z`.
- Frontend converts to IST display.

## Money format

- Backend ALWAYS returns paise integer (`amount_paise`, `price_paise`, `platform_fee_paise`, `seller_payout_paise`).
- Frontend divides by 100 for display.
- NEVER use floats anywhere.

## Pagination

- Query params: `page` (1-indexed), `page_size` (max 50, default 20).
- Response: `{ "items": [...], "total": N, "page": P, "page_size": S }`.

## File upload

- Frontend gets presigned R2 URL via `POST /api/disputes/uploads/presign`.
- PUTs file directly to R2 with the URL.
- Sends final URL back in `evidence_urls` array.

## WebSocket

- URL: `${REACT_APP_BACKEND_URL.replace('http','ws')}/api/ws/notifications?token=<jwt>`
- Auto-reconnect with exponential backoff (1s, 2s, 5s, 10s, 30s).
- Heartbeat: pong every 30s.

## Specific contracts that frontend depends on

### Login response (`POST /api/auth/otp/verify`)

```typescript
interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;          // seconds
  user: {
    id: string;
    phone: string;             // +91...
    name: string | null;
    email: string | null;
    role: "buyer" | "seller" | "admin";
    created_at: string;        // ISO
  };
  is_new_user: boolean;
}
```

### Listing item (in lists and detail)

```typescript
interface Listing {
  id: string;
  service_name: string;
  service_slug: string;
  service_category: "video" | "music" | "design" | "productivity" | "ai" | "learning" | "gaming" | "security";
  price_paise: number;
  duration_days: number;
  slots_total: number;
  slots_available: number;
  description: string | null;
  rating_avg: number;          // 0–5
  rating_count: number;
  is_boosted: boolean;
  seller: {
    id: string;
    name: string;              // first name + initial
    trust_score: number;       // 0–5
    total_sales: number;
    kyc_verified: boolean;
  };
  created_at: string;
}
```

### Order

```typescript
interface Order {
  id: string;
  order_number: string;        // SLOT-2026-000123
  listing_id: string;
  listing_snapshot: {
    service_name: string;
    service_slug: string;
    duration_days: number;
  };
  buyer_id: string;
  seller_id: string;
  amount_paise: number;
  platform_fee_paise: number;
  seller_payout_paise: number;
  status: "pending"|"paid"|"delivered"|"confirmed"|"released"|"disputed"|"refunded"|"cancelled"|"expired";
  expires_at: string;
  delivered_at: string | null;
  confirmed_at: string | null;
  released_at: string | null;
  created_at: string;
  payment_session_id?: string; // only present on creation response
  cashfree_order_id?: string;
}
```

### Buyer dashboard fetch

`GET /api/orders/me?role=buyer&status=active`
- `status=active` is sugar for `status IN ('pending','paid','delivered','disputed')`
- `status=completed` for `status IN ('released','refunded')`

### Seller dashboard fetch

`GET /api/listings/me`
`GET /api/orders/me?role=seller&status=active`
`GET /api/payouts/me`

### Waitlist (already on landing page, currently static)

Backend must accept:
```typescript
POST /api/waitlist
Body: { name: string; email: string; intent: "buyer" | "seller" }
Response 201: { ok: true; position: number }
```

When backend is ready, frontend will swap from local-state to this endpoint.

## Frontend feature flags (server-driven)

`GET /api/config/public` returns:
```json
{
  "features": {
    "waitlist_enabled": true,
    "checkout_enabled": false,
    "pro_plan_enabled": false
  },
  "fee": {
    "default_percent": 6,
    "pro_percent": 4
  },
  "service_catalog": [
    { "slug": "netflix-premium", "name": "Netflix Premium", "category": "video" }
  ]
}
```

Frontend caches for 5 min. Lets you launch features without redeploying frontend.
