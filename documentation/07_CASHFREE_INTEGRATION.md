# 07 — Cashfree Integration (Payments + Payouts + Refunds)

> **Cashfree has 2 separate products with separate APIs and credentials**:
> 1. **Cashfree Payments** — accepts money from buyers (UPI/cards/netbanking)
> 2. **Cashfree Payouts** — sends money to sellers (UPI / bank transfer)
>
> They are billed and credentialed separately. You need accounts + keys for both.

---

## §Payments — Accepting buyer money

### Credentials needed
- `CASHFREE_PAYMENTS_APP_ID`
- `CASHFREE_PAYMENTS_SECRET_KEY`
- `CASHFREE_PAYMENTS_WEBHOOK_SECRET`
- `CASHFREE_PAYMENTS_ENV` = `sandbox` | `production`

Base URL:
- Sandbox: `https://sandbox.cashfree.com/pg`
- Production: `https://api.cashfree.com/pg`

### 1. Create Order

`POST {base}/orders`

Headers:
```
x-client-id: <APP_ID>
x-client-secret: <SECRET_KEY>
x-api-version: 2023-08-01
Content-Type: application/json
```

Body:
```json
{
  "order_id": "SLOT-2026-000123",
  "order_amount": 179.00,
  "order_currency": "INR",
  "customer_details": {
    "customer_id": "<user_uuid>",
    "customer_phone": "9876543210",
    "customer_email": "buyer@example.com",
    "customer_name": "Aman K."
  },
  "order_meta": {
    "return_url": "https://slotu.in/orders/<order_id>?status={order_status}",
    "notify_url": "https://api.slotu.in/api/payments/webhook/cashfree"
  },
  "order_note": "Slot purchase: Netflix Premium"
}
```

Response (201):
```json
{
  "cf_order_id": 12345678,
  "order_id": "SLOT-2026-000123",
  "payment_session_id": "session_abc123",
  "order_status": "ACTIVE",
  "order_amount": 179.00,
  "order_currency": "INR"
}
```

Frontend uses `payment_session_id` with the Cashfree Web SDK to launch checkout (UPI / cards / netbanking).

### 2. Webhook handling

Cashfree POSTs to `notify_url` on payment events.

**Verify signature** (mandatory):
```python
import hmac, hashlib, base64

def verify_cashfree_signature(timestamp: str, raw_body: bytes, signature: str, secret: str) -> bool:
    payload = (timestamp + raw_body.decode()).encode()
    expected = base64.b64encode(hmac.new(secret.encode(), payload, hashlib.sha256).digest()).decode()
    return hmac.compare_digest(expected, signature)
```

Headers to read: `x-webhook-signature`, `x-webhook-timestamp`.

**Idempotency**: dedupe by `data.payment.cf_payment_id` + event type. Use Redis SET NX with TTL 24h.

Events:

| Event | Action |
|-------|--------|
| `PAYMENT_SUCCESS_WEBHOOK` | Order `pending → paid`. Call `escrow_service.mark_paid(order_id, cf_payment_id)`. |
| `PAYMENT_FAILED_WEBHOOK` | Order `pending → cancelled`. Restore listing slot. |
| `PAYMENT_USER_DROPPED_WEBHOOK` | Order `pending → cancelled`. Restore listing slot. |
| `REFUND_STATUS_WEBHOOK` | Update `escrow_transactions.refund_status`. If success and order in `disputed` → `refunded`. |

Always respond `200 OK` quickly. Heavy work goes to Celery.

### 3. Order status verification (defensive)

Call `GET {base}/orders/{order_id}/payments` to verify before any state change. Webhook can be replayed/spoofed.

### 4. Refunds

`POST {base}/orders/{order_id}/refunds`
```json
{
  "refund_amount": 179.00,
  "refund_id": "REF-<order_id>-<unix_ts>",
  "refund_note": "Buyer favoured by admin",
  "refund_speed": "STANDARD"
}
```

Response: refund will be processed and webhook will fire.

---

## §Payouts — Sending money to sellers

### Credentials needed
- `CASHFREE_PAYOUTS_CLIENT_ID`
- `CASHFREE_PAYOUTS_CLIENT_SECRET`
- `CASHFREE_PAYOUTS_PUBLIC_KEY` (for token signing in older API)
- `CASHFREE_PAYOUTS_WEBHOOK_SECRET`
- `CASHFREE_PAYOUTS_ENV` = `sandbox` | `production`

Base URL:
- Sandbox: `https://sandbox.cashfree.com/payout`
- Production: `https://api.cashfree.com/payout`

### 1. Authenticate (token-based for v1) or v2 with x-client headers

Modern Payouts v2 uses same header pattern as Payments:
```
x-client-id: <CLIENT_ID>
x-client-secret: <CLIENT_SECRET>
x-api-version: 2024-01-01
```

### 2. Add Beneficiary (one-time per seller)

`POST {base}/beneficiary`
```json
{
  "beneficiary_id": "BENEF_<seller_user_uuid>",
  "beneficiary_name": "Aman Kumar",
  "beneficiary_instrument_details": {
    "vpa": "aman@okhdfcbank"
  },
  "beneficiary_contact_details": {
    "beneficiary_phone": "9876543210",
    "beneficiary_email": "seller@example.com"
  }
}
```

For bank transfer, use:
```json
{
  "beneficiary_instrument_details": {
    "bank_account_number": "1234567890",
    "bank_ifsc": "HDFC0001234"
  }
}
```

Store `beneficiary_id` in `seller_profiles.bank_beneficiary_id`.

### 3. Verify VPA / Bank (recommended before save)

`POST {base}/verification/upi` for VPA validation.

### 4. Create Transfer (the actual payout)

`POST {base}/transfers`
```json
{
  "transfer_id": "TRF-<order_id>",
  "transfer_amount": 169.26,
  "transfer_currency": "INR",
  "transfer_mode": "upi",
  "beneficiary_details": {
    "beneficiary_id": "BENEF_<seller_user_uuid>"
  },
  "transfer_remarks": "Slotu order SLOT-2026-000123"
}
```

Idempotent on `transfer_id`. Use `TRF-<order_id>` so same order can never double-pay.

Response 200:
```json
{
  "transfer_id": "TRF-...",
  "cf_transfer_id": "...",
  "status": "RECEIVED",
  "status_description": "Transfer received"
}
```

### 5. Payout webhook

Endpoint: `/api/payments/webhook/payouts`

Events:
| Event | Action |
|-------|--------|
| `TRANSFER_SUCCESS` | Order `confirmed → released`. `payouts.status='success'`. `seller_profiles.total_sales++`. |
| `TRANSFER_FAILED` | `payouts.status='failed'`. Schedule retry (max 3, exponential backoff). After 3 fails → admin alert. |
| `TRANSFER_REVERSED` | `payouts.status='reversed'`. Admin alert + recompute. |

### 6. Cancel Transfer (used in disputes)

`POST {base}/transfers/{transfer_id}/cancel` — only works if not yet processed.

---

## Fee calculation

```python
DEFAULT_FEE_PERCENT = Decimal("6.0")
PRO_FEE_PERCENT = Decimal("4.0")

def calculate_fee(amount_paise: int, is_pro: bool) -> tuple[int, int, Decimal]:
    """Returns (platform_fee_paise, seller_payout_paise, fee_percent_applied)"""
    fee_pct = PRO_FEE_PERCENT if is_pro else DEFAULT_FEE_PERCENT
    fee = int(round(amount_paise * fee_pct / 100))
    payout = amount_paise - fee
    return fee, payout, fee_pct
```

**Rule**: Round fee to nearest paise (banker's round acceptable). `payout = amount - fee` always.

**On Cashfree fee**: Cashfree itself charges ~2% to merchant — that comes out of your platform fee, not the seller payout. Plan accordingly.

---

## Idempotency keys

| Operation | Key format |
|-----------|-----------|
| Create order | `IDEM-CREATE-<client_uuid>` (from frontend) |
| Cashfree order | `order_id` (your `order_number`) |
| Refund | `REF-<order_id>` |
| Transfer | `TRF-<order_id>` |

Use these in the `idempotency_key` columns. Re-attempts return existing record without side effects.

---

## Error handling

| HTTP from Cashfree | Action |
|--------------------|--------|
| 400 | Validation error — surface to admin/log, don't retry |
| 401/403 | Credential issue — Sentry critical alert, fail loudly |
| 409 | Idempotency conflict — fetch existing |
| 429 | Rate limited — exponential backoff |
| 5xx | Retry with backoff (max 3) |

All Cashfree calls wrapped in `httpx.AsyncClient` with timeout 10s.
