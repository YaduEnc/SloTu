# 03 — Database Schema (PostgreSQL 15+)

All amounts stored as **integer paise** (₹1 = 100 paise). All timestamps `TIMESTAMPTZ` in UTC.

## Conventions
- Primary keys: `UUID` v4 default `gen_random_uuid()`
- Foreign keys: `ON DELETE RESTRICT` unless stated
- Soft deletes via `deleted_at TIMESTAMPTZ NULL` where useful
- Every table has `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()` and `updated_at` updated by trigger

---

## 1. `users`

```sql
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(15) UNIQUE NOT NULL,        -- +91XXXXXXXXXX
  name            VARCHAR(120),
  email           VARCHAR(160) UNIQUE,
  role            VARCHAR(20) NOT NULL DEFAULT 'buyer'  -- 'buyer' | 'seller' | 'admin'
                  CHECK (role IN ('buyer','seller','admin')),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);
```

## 2. `otp_requests`

```sql
CREATE TABLE otp_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(15) NOT NULL,
  otp_hash        VARCHAR(255) NOT NULL,           -- bcrypt of 6-digit code
  attempts        SMALLINT NOT NULL DEFAULT 0,
  consumed        BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ NOT NULL,
  ip_address      INET,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_otp_phone_created ON otp_requests(phone, created_at DESC);
```

## 3. `seller_profiles`

```sql
CREATE TABLE seller_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID UNIQUE NOT NULL REFERENCES users(id),
  upi_id                  VARCHAR(60),                          -- xxx@upi
  upi_verified            BOOLEAN NOT NULL DEFAULT FALSE,
  aadhaar_verified        BOOLEAN NOT NULL DEFAULT FALSE,
  aadhaar_last4_hash      VARCHAR(255),                         -- one-way hash
  pan_hash                VARCHAR(255),                         -- if needed for >₹50k
  bank_account_last4      VARCHAR(4),
  bank_ifsc               VARCHAR(11),
  bank_beneficiary_id     VARCHAR(64),                          -- Cashfree Payouts beneficiary id
  trust_score             NUMERIC(3,2) NOT NULL DEFAULT 0.0,    -- 0.00 - 5.00
  total_sales             INT NOT NULL DEFAULT 0,
  total_disputes          INT NOT NULL DEFAULT 0,
  kyc_status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                           CHECK (kyc_status IN ('pending','submitted','approved','rejected')),
  pro_plan_active         BOOLEAN NOT NULL DEFAULT FALSE,
  pro_plan_expires_at     TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_seller_kyc ON seller_profiles(kyc_status);
CREATE INDEX idx_seller_trust ON seller_profiles(trust_score DESC);
```

## 4. `listings`

```sql
CREATE TABLE listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id         UUID NOT NULL REFERENCES users(id),
  service_name      VARCHAR(80) NOT NULL,         -- "Netflix Premium"
  service_slug      VARCHAR(80) NOT NULL,         -- "netflix-premium"
  service_category  VARCHAR(40) NOT NULL,         -- 'video','music','design','productivity','ai','learning','gaming','security'
  price_paise       INT NOT NULL CHECK (price_paise > 0),     -- per slot per duration
  duration_days     INT NOT NULL CHECK (duration_days > 0),
  slots_total       INT NOT NULL CHECK (slots_total >= 1 AND slots_total <= 10),
  slots_available   INT NOT NULL CHECK (slots_available >= 0),
  description       TEXT,
  status            VARCHAR(20) NOT NULL DEFAULT 'active'
                     CHECK (status IN ('draft','active','paused','sold_out','removed')),
  rating_avg        NUMERIC(3,2) NOT NULL DEFAULT 0.0,
  rating_count      INT NOT NULL DEFAULT 0,
  views             INT NOT NULL DEFAULT 0,
  is_boosted        BOOLEAN NOT NULL DEFAULT FALSE,        -- Pro plan
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  CHECK (slots_available <= slots_total)
);
CREATE INDEX idx_listings_status_category ON listings(status, service_category);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_price ON listings(price_paise);
CREATE INDEX idx_listings_boosted ON listings(is_boosted DESC, created_at DESC);
```

## 5. `orders`

```sql
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        VARCHAR(20) UNIQUE NOT NULL,           -- human-readable: SLOT-2026-000123
  listing_id          UUID NOT NULL REFERENCES listings(id),
  buyer_id            UUID NOT NULL REFERENCES users(id),
  seller_id           UUID NOT NULL REFERENCES users(id),
  amount_paise        INT NOT NULL CHECK (amount_paise > 0),
  platform_fee_paise  INT NOT NULL CHECK (platform_fee_paise >= 0),
  seller_payout_paise INT NOT NULL CHECK (seller_payout_paise > 0),
  fee_percent         NUMERIC(4,2) NOT NULL,                  -- 5.00 .. 8.00
  duration_days       INT NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','paid','delivered','confirmed','released','disputed','refunded','cancelled','expired')),
  delivery_method     VARCHAR(30),                            -- 'credentials' | 'family_invite'
  delivered_at        TIMESTAMPTZ,
  confirmed_at        TIMESTAMPTZ,
  released_at         TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ NOT NULL,                   -- buyer must confirm by this time
  cancelled_reason    TEXT,
  idempotency_key     VARCHAR(80) UNIQUE,                     -- enforce single-create
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (amount_paise = platform_fee_paise + seller_payout_paise)
);
CREATE INDEX idx_orders_buyer ON orders(buyer_id, created_at DESC);
CREATE INDEX idx_orders_seller ON orders(seller_id, created_at DESC);
CREATE INDEX idx_orders_status_expires ON orders(status, expires_at);
```

## 6. `escrow_transactions`

```sql
CREATE TABLE escrow_transactions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id              UUID UNIQUE NOT NULL REFERENCES orders(id),
  cashfree_order_id     VARCHAR(64) UNIQUE,
  cashfree_payment_id   VARCHAR(64),
  payment_method        VARCHAR(20),                          -- 'upi','card','netbanking'
  payment_status        VARCHAR(20) NOT NULL DEFAULT 'created'
                          CHECK (payment_status IN ('created','pending','success','failed','user_dropped')),
  payout_status         VARCHAR(20) NOT NULL DEFAULT 'not_started'
                          CHECK (payout_status IN ('not_started','queued','processing','success','failed','reversed')),
  refund_status         VARCHAR(20) NOT NULL DEFAULT 'not_started'
                          CHECK (refund_status IN ('not_started','queued','processing','success','failed')),
  cashfree_payout_id    VARCHAR(64),
  cashfree_refund_id    VARCHAR(64),
  amount_paise          INT NOT NULL,
  webhook_payload       JSONB,                                -- last verified webhook
  failure_reason        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_escrow_order ON escrow_transactions(order_id);
CREATE INDEX idx_escrow_payment_status ON escrow_transactions(payment_status);
```

## 7. `credentials_vault`

```sql
CREATE TABLE credentials_vault (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id            UUID NOT NULL REFERENCES listings(id),
  seller_id             UUID NOT NULL REFERENCES users(id),
  credential_type       VARCHAR(30) NOT NULL                  -- 'login' | 'family_invite_link' | 'invite_email_target'
                          CHECK (credential_type IN ('login','family_invite_link','invite_email_target')),
  encrypted_data        BYTEA NOT NULL,                       -- AES-256-GCM ciphertext
  iv                    BYTEA NOT NULL,                       -- 12 bytes
  auth_tag              BYTEA NOT NULL,                       -- 16 bytes
  key_version           SMALLINT NOT NULL DEFAULT 1,          -- for key rotation
  consumed_by_order_id  UUID REFERENCES orders(id),
  consumed_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_vault_listing_unconsumed ON credentials_vault(listing_id) WHERE consumed_by_order_id IS NULL;
```

## 8. `reviews`

```sql
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        UUID UNIQUE NOT NULL REFERENCES orders(id),
  buyer_id        UUID NOT NULL REFERENCES users(id),
  seller_id       UUID NOT NULL REFERENCES users(id),
  listing_id      UUID NOT NULL REFERENCES listings(id),
  rating          SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  is_hidden       BOOLEAN NOT NULL DEFAULT FALSE,             -- moderation
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_listing ON reviews(listing_id);
```

## 9. `disputes`

```sql
CREATE TABLE disputes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID UNIQUE NOT NULL REFERENCES orders(id),
  raised_by         UUID NOT NULL REFERENCES users(id),
  reason_code       VARCHAR(40) NOT NULL                       -- 'access_not_working','seller_unresponsive','wrong_credentials','removed_from_plan','other'
                     CHECK (reason_code IN ('access_not_working','seller_unresponsive','wrong_credentials','removed_from_plan','other')),
  reason_text       TEXT,
  evidence_urls     TEXT[],                                    -- R2 URLs
  status            VARCHAR(20) NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','investigating','resolved_buyer','resolved_seller','withdrawn')),
  resolution_note   TEXT,
  resolved_by       UUID REFERENCES users(id),                 -- admin
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_disputes_status ON disputes(status);
```

## 10. `notifications`

```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id),
  type          VARCHAR(40) NOT NULL,                          -- 'order_paid','order_delivered','dispute_opened',...
  title         VARCHAR(160) NOT NULL,
  message       TEXT NOT NULL,
  cta_url       VARCHAR(255),
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  channel       VARCHAR(20) NOT NULL DEFAULT 'in_app'          -- 'in_app','sms','email','ws'
                 CHECK (channel IN ('in_app','sms','email','ws')),
  meta          JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_user_unread ON notifications(user_id, read, created_at DESC);
```

## 11. `payouts`

```sql
CREATE TABLE payouts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id               UUID NOT NULL REFERENCES users(id),
  order_id                UUID NOT NULL REFERENCES orders(id),
  amount_paise            INT NOT NULL CHECK (amount_paise > 0),
  upi_id                  VARCHAR(60),
  beneficiary_id          VARCHAR(64),                         -- Cashfree beneficiary
  cashfree_transfer_id    VARCHAR(64) UNIQUE,
  status                  VARCHAR(20) NOT NULL DEFAULT 'queued'
                           CHECK (status IN ('queued','processing','success','failed','reversed')),
  attempt_count           SMALLINT NOT NULL DEFAULT 0,
  failure_reason          TEXT,
  initiated_at            TIMESTAMPTZ,
  settled_at              TIMESTAMPTZ,
  idempotency_key         VARCHAR(80) UNIQUE NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payouts_seller ON payouts(seller_id);
CREATE INDEX idx_payouts_status ON payouts(status);
```

## 12. `audit_log`

```sql
CREATE TABLE audit_log (
  id            BIGSERIAL PRIMARY KEY,
  actor_id      UUID,                                  -- nullable: system actions
  actor_type    VARCHAR(20) NOT NULL                   -- 'user','system','admin','webhook'
                 CHECK (actor_type IN ('user','system','admin','webhook')),
  entity_type   VARCHAR(40) NOT NULL,                  -- 'order','listing','user','dispute',...
  entity_id     UUID,
  action        VARCHAR(60) NOT NULL,                  -- 'order.created','order.released','dispute.resolved'
  before        JSONB,
  after         JSONB,
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_id, created_at DESC);
```

## 13. `waitlist` (for landing page form)

```sql
CREATE TABLE waitlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(160) UNIQUE NOT NULL,
  intent      VARCHAR(20) NOT NULL CHECK (intent IN ('buyer','seller')),
  source      VARCHAR(60),
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Triggers

```sql
-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table with updated_at
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.columns
           WHERE column_name='updated_at' AND table_schema='public'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;
```
