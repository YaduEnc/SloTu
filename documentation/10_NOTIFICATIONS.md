# 10 — Notifications (SMS / Email / WebSocket / In-App)

## Channels

| Channel | When used | Provider |
|---------|-----------|----------|
| SMS | OTPs, critical order events (paid/delivered/refunded), payout success | Fast2SMS (primary), MSG91 (fallback) |
| Email | Receipts, monthly summaries, dispute updates | SendGrid (primary), Resend (fallback) |
| WebSocket | Real-time UI updates while user is logged in | Native FastAPI WS |
| In-App | All notifications stored in DB | `notifications` table |

## Notification taxonomy

| `type` | Triggered by | Channels | Recipient |
|--------|--------------|----------|-----------|
| `auth.otp_sent` | OTP send | SMS | self |
| `order.created` | Order created (pending) | in_app, ws | buyer, seller |
| `order.paid` | Cashfree PAYMENT_SUCCESS | SMS, email, in_app, ws | buyer, seller |
| `order.delivered` | Vault reveal verify | in_app, ws, email | buyer, seller |
| `order.confirmed` | buyer confirmed or auto | in_app, ws | seller |
| `order.released` | Cashfree TRANSFER_SUCCESS | SMS, in_app, ws | seller |
| `order.cancelled` | failed/dropped/cancelled | email, in_app | buyer |
| `order.expired` | timer | email, in_app | buyer |
| `order.disputed` | dispute opened | SMS (counterparty), in_app | counterparty + admin |
| `dispute.resolved` | admin resolves | email, in_app | both parties |
| `kyc.approved` | admin approves | SMS, email, in_app | seller |
| `kyc.rejected` | admin rejects | SMS, email, in_app | seller |
| `payout.failed` | retry exhausted | SMS, email, in_app | seller + admin |
| `review.received` | review posted | in_app, ws | seller |

## Templates (Indian phone-friendly, < 160 chars for SMS)

### SMS templates

```
auth.otp_sent
─► Your Slotu code is {otp}. Valid for 5 min. Don't share with anyone. -SLOTU

order.paid (to seller)
─► New order ₹{amt} for {service}. Buyer paid. Funds in escrow. Open Slotu app to deliver. -SLOTU

order.released (to seller)
─► Payout ₹{amt} sent to your UPI. Order {ord}. Thanks for selling on Slotu! -SLOTU

order.disputed (to counterparty)
─► Dispute opened on order {ord}. Reply with proof in 24hr. Open Slotu to respond. -SLOTU

kyc.approved
─► Slotu seller verification approved. You can now list slots. Welcome aboard! -SLOTU
```

### Email templates (HTML, branded)

Stored in `app/templates/email/` as Jinja2 templates. Use SendGrid's `mail/send` API.

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

## DLT (DLT registration for Indian SMS — required by TRAI)

- Register all SMS templates with the DLT operator (Jio/Airtel).
- Use DLT-approved sender IDs: `SLOTUI` or similar 6-char.
- Each template has a DLT template ID — store in env: `DLT_TEMPLATE_OTP`, `DLT_TEMPLATE_ORDER_PAID`, etc.
- Without DLT, SMS will fail in production.

## Rate limits per user

- Max 100 in-app notifications/day (older auto-archived).
- Max 30 SMS notifications/day.
- Max 50 emails/day.
- WS unlimited (in-memory bound by connection count).
