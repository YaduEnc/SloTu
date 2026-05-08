# 10 — Notifications (Email / WebSocket / In-App)

## Channels

| Channel | When used | Provider |
|---------|-----------|----------|
| Email | OTPs, receipts, dispute updates, summaries | Resend |
| WebSocket | Real-time UI updates while user is logged in | Native FastAPI WS |
| In-App | All notifications stored in DB | `notifications` table |

## Notification taxonomy

| `type` | Triggered by | Channels | Recipient |
|--------|--------------|----------|-----------|
| `auth.otp_sent` | OTP send | email | self |
| `order.created` | Order created (pending) | in_app, ws | buyer, seller |
| `order.paid` | Cashfree PAYMENT_SUCCESS | email, in_app, ws | buyer, seller |
| `order.delivered` | Vault reveal verify | in_app, ws, email | buyer, seller |
| `order.confirmed` | buyer confirmed or auto | in_app, ws | seller |
| `order.released` | Cashfree TRANSFER_SUCCESS | email, in_app, ws | seller |
| `order.cancelled` | failed/dropped/cancelled | email, in_app | buyer |
| `order.expired` | timer | email, in_app | buyer |
| `order.disputed` | dispute opened | email, in_app | counterparty + admin |
| `dispute.resolved` | admin resolves | email, in_app | both parties |
| `kyc.approved` | admin approves | email, in_app | seller |
| `kyc.rejected` | admin rejects | email, in_app | seller |
| `payout.failed` | retry exhausted | email, in_app | seller + admin |
| `review.received` | review posted | in_app, ws | seller |

### Email templates (HTML, branded)

Stored in `app/templates/email/` as Jinja2 templates. Use Resend's email API.

Required emails:
- `payment_receipt.html` (to buyer on `order.paid`)
- `delivery_confirmation.html` (on `order.delivered`)
- `payout_summary.html` (to seller weekly)
- `dispute_opened.html`
- `dispute_resolved.html`
- `monthly_seller_report.html`

Branding: emerald-500 accent on dark hero, follows landing page design system.

## WebSocket protocol

`WS /api/ws/notifications?token=<jwt>`

Server → client message:
```json
{
  "type": "notification.new",
  "data": {
    "id": "uuid",
    "type": "order.paid",
    "title": "Payment received",
    "message": "Buyer paid ₹179. Deliver access now.",
    "cta_url": "/seller/orders/abc",
    "created_at": "..."
  }
}
```

Server → client also pushes order state updates while user is on order detail page:
```json
{ "type": "order.state", "data": { "order_id": "...", "status": "delivered" } }
```

Heartbeat: server sends `{ "type": "ping" }` every 30s. Client responds `{ "type": "pong" }`. Disconnect after 90s no pong.

Auth: validate JWT on connection. Drop on invalid/expired. Map `user_id → ws_connection` in Redis pubsub for multi-instance.

## Rate limits per user

- Max 100 in-app notifications/day (older auto-archived).
- Max 50 emails/day.
- WS unlimited (in-memory bound by connection count).
