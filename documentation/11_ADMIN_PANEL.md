# 11 — Admin Panel

Admin panel is a separate React frontend (or extended dashboard with `role=admin` gate). The backend exposes `/api/admin/*` endpoints, all requiring `role=admin`.

## Admin user creation

- No public sign-up. Create via CLI:
  ```bash
  python -m app.scripts.create_admin --phone +919999999999 --name "Founder"
  ```
- This script promotes existing user to admin OR creates new admin user.
- Audit log entry created.

## Endpoints

### Dashboard

`GET /api/admin/dashboard?range=7d|30d|90d|all`

Response:
```json
{
  "kpis": {
    "gmv_paise": 12500000,
    "platform_revenue_paise": 750000,
    "active_listings": 421,
    "active_sellers": 87,
    "active_buyers": 1532,
    "open_disputes": 12,
    "pending_kyc": 7,
    "queued_payouts": 3,
    "failed_payouts_last_24h": 1
  },
  "trend": {
    "gmv_daily": [{"date": "2026-01-01", "amount_paise": 320000}, ...],
    "orders_daily": [{"date": "2026-01-01", "count": 18}, ...]
  },
  "top_services": [
    { "service_slug": "netflix-premium", "orders": 240, "gmv_paise": 4200000 }
  ]
}
```

### Disputes

`GET /api/admin/disputes?status=open&page=1`
`GET /api/admin/disputes/:id` (full detail with order, evidence, history)
`POST /api/admin/disputes/:id/resolve`
```json
{
  "resolution": "buyer_refund" | "seller_release" | "split",
  "split_percent_to_seller": 50,
  "note": "Buyer's evidence shows family-plan removal within 12 hours of purchase. Full refund."
}
```
- For `split`: refund (100-split)% to buyer, payout (split)% to seller.
- Idempotent: re-resolving same dispute returns 409 unless `force=true`.

`POST /api/admin/disputes/:id/comment` (internal note)

### KYC review

`GET /api/admin/sellers/pending-kyc`
`GET /api/admin/sellers/:user_id/kyc/details`
`POST /api/admin/sellers/:user_id/kyc/approve`
`POST /api/admin/sellers/:user_id/kyc/reject`
```json
{ "reason": "ID document blurry, please reupload" }
```

### Listings moderation

`GET /api/admin/listings?status=...&service=...`
`POST /api/admin/listings/:id/takedown`
```json
{ "reason": "Service ToS prohibits sharing" }
```
- Sets `status='removed'`, notifies seller.

### Users

`GET /api/admin/users?q=phone_or_email_or_name`
`GET /api/admin/users/:id` (full profile, orders, disputes)
`POST /api/admin/users/:id/suspend`
```json
{ "reason": "Multiple disputes filed", "suspend_for_days": 30 }
```
`POST /api/admin/users/:id/unsuspend`

### Orders monitoring

`GET /api/admin/orders?status=...&seller_id=...&buyer_id=...&from=...&to=...`
`POST /api/admin/orders/:id/force-refund` (emergency only, requires reason + 2nd-admin confirmation token)
`POST /api/admin/orders/:id/force-release` (emergency only)

### Settings

`GET /api/admin/settings`
`PATCH /api/admin/settings`
- `default_fee_percent` (5–10)
- `pro_fee_percent` (3–6)
- `auto_confirm_hours` (default 24)
- `pending_order_expiry_minutes` (default 30)
- `service_catalog` (allow-list of services)
- `feature_flags`

### Audit log viewer

`GET /api/admin/audit?actor_id=...&entity_type=...&entity_id=...&from=...&to=...&page=...`

### Broadcast notifications

`POST /api/admin/broadcast`
```json
{
  "audience": "all_buyers" | "all_sellers" | "kyc_pending" | "user_ids:[uuid,uuid]",
  "title": "...",
  "message": "...",
  "channels": ["in_app", "email"]
}
```

## Two-person rule (high-risk actions)

For these actions, require a second admin to confirm via separate API call within 10 min:
- `force-refund`
- `force-release`
- `user.suspend > 30 days`
- `settings change` for fee_percent

Implementation: action creates a "pending_admin_action" with token; second admin confirms via `POST /api/admin/actions/:token/confirm`. Tokens expire 10 min.

## Admin frontend (suggested)

Separate React app at `admin.slotu.in` OR same frontend with `/admin` route gated by role. Build after primary buyer/seller dashboards.

Pages:
- `/admin` — Dashboard (KPIs, charts)
- `/admin/disputes` — Queue with filters, click to resolve
- `/admin/kyc` — Pending KYC queue
- `/admin/orders` — Order explorer
- `/admin/users` — User search + actions
- `/admin/listings` — Listing moderation
- `/admin/settings` — Platform settings
- `/admin/audit` — Audit log search
