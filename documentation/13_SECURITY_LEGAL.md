# 13 — Security & Legal

## Security checklist

### Transport
- [ ] HTTPS only (HSTS preload)
- [ ] TLS 1.2+ minimum
- [ ] Secure + HttpOnly + SameSite=Lax cookies

### Authentication
- [ ] OTP brute-force: max 5 verify per request, max 10 sends/hour/phone
- [ ] JWT short access (15 min)
- [ ] Refresh token rotation (issue new on each use, blacklist old in Redis)
- [ ] Logout adds JTI to blacklist
- [ ] Session fixation: regenerate JTI on role change

### Authorization
- [ ] Role middleware on every protected endpoint
- [ ] Object-level checks (buyer can only fetch own orders, etc.)
- [ ] Admin endpoints double-gated with IP allowlist (configurable)

### Input
- [ ] Pydantic validation on every endpoint
- [ ] SQL via ORM only — no string concatenation
- [ ] File upload size limit (5 MB for evidence, 10 MB for KYC)
- [ ] File type whitelist (image/png|jpeg|webp, application/pdf)
- [ ] Phone E.164 normalised + regex
- [ ] Email RFC-validated

### Output
- [ ] No PII in URLs (no `?email=` etc.)
- [ ] No JWT/secret in error messages
- [ ] No DB error details leaked (catch + map to generic)
- [ ] No raw vault data outside reveal endpoint

### Storage
- [ ] Bcrypt (cost 10) for OTP hash
- [ ] AES-256-GCM for vault
- [ ] Aadhaar number NEVER stored
- [ ] PII fields encrypted at rest where possible (postgres `pgcrypto`)
- [ ] DB backups encrypted

### Rate limiting
- [ ] Per-IP global: 600 req/min
- [ ] OTP send: 3/min/phone, 10/hour/phone, 30/hour/IP
- [ ] Vault reveal: 3/15min/order
- [ ] Webhook endpoints: NOT rate-limited (Cashfree IPs whitelisted instead)

### Webhooks
- [ ] HMAC signature verification before any state change
- [ ] Replay protection via timestamp check (reject if older than 5 min)
- [ ] Idempotency on webhook event id

### Logging
- [ ] Phone numbers masked in logs (`+91XX...XX10`)
- [ ] No passwords/tokens/credentials in logs
- [ ] Request ID on every log line for correlation
- [ ] Sentry for unhandled exceptions
- [ ] Structured JSON logs (loguru / structlog)

### Dependencies
- [ ] `pip-audit` in CI
- [ ] Dependabot enabled
- [ ] Pinned versions

### Infra
- [ ] Container images scanned (Trivy)
- [ ] Non-root user in Dockerfile
- [ ] Resource limits in k8s/compose
- [ ] DB on private network only
- [ ] Redis password-protected

---

## Legal compliance (India)

### IT Act 2000 §79 — intermediary safe harbour

Slotu is an intermediary, not a service provider. To maintain safe-harbour:

1. **No active role in transactions** — Slotu does not own, modify, or initiate the content of listings beyond moderation.
2. **Notice-and-takedown** — when notified of unlawful content, must remove within 36 hours.
3. **Due diligence** — publish:
   - Terms of Service
   - Privacy Policy
   - User Code of Conduct
   - Grievance redressal mechanism
4. **Grievance Officer**:
   - Name and contact published on website (footer link).
   - Acknowledge complaints within 24 hours.
   - Resolve within 15 days.
5. **Periodic compliance** — file Voluntary User Verification reports with MeitY annually if scale crosses thresholds.

### IT Rules 2021 (Intermediary Rules)

- KYC for sellers crossing transaction thresholds.
- Maintain records for 180 days after account deletion.
- Report breaches to CERT-In within 6 hours.
- Appoint Resident Grievance Officer (RGO), Chief Compliance Officer, Nodal Contact Person if "significant social media intermediary" — likely not applicable initially but plan for it.

### Framing rules (do not violate platform ToS)

- Always use "slot sharing" / "plan member addition" / "join my family plan" language.
- NEVER use "buy account" / "sell account" / "credentials sale".
- ToS disclaimer on every listing detail page.
- Service catalog allow-list — include only services where family/team sharing is officially permitted by their ToS:
  - Netflix Standard with Ads / Standard / Premium (extra member feature, paid)
  - Spotify Family
  - YouTube Premium Family
  - Apple Music Family
  - Microsoft 365 Family
  - Google One Family
  - Canva Pro Teams
  - Notion Plus Teams
- Excluded (private personal subscriptions): basic 1-user accounts of any service.

### Payment compliance (RBI / NPCI)

- UPI handles via Cashfree Payouts — RBI-compliant.
- No direct customer fund handling — escrow is in Cashfree-managed merchant account.
- Refunds via Cashfree Refunds API only.

### GST

- Platform commission attracts 18% GST.
- Generate GST invoice for each commission charge.
- GSTIN displayed on receipts.

### Consumer Protection (E-commerce) Rules 2020

- Buyer protection: clear refund policy, 24-hour escrow auto-confirm.
- Display seller details (name, KYC status).
- Grievance mechanism live.

---

## Privacy

### Data we collect
- Phone (mandatory)
- Name, email (optional)
- UPI ID, bank details (sellers only)
- Aadhaar OTP verification result (NOT the number)
- Transaction history
- Device fingerprint, IP for fraud

### Data we DO NOT collect
- Aadhaar number itself
- Card numbers (handled by Cashfree)
- Biometric data

### Retention
- Active accounts: indefinite while active
- Deleted accounts: 180 days for compliance, then purged
- Audit log: 365 days
- OTP requests: 24 hours

### User rights (GDPR-style, India DPDP Act 2023)
- Right to access (`GET /api/users/me/data-export`)
- Right to delete (`DELETE /api/users/me`)
- Right to rectify (`PATCH /api/users/me`)
- Right to grievance (grievance officer link)

### Cookie usage
- Only `slotu_rt` (refresh) — strictly necessary, no consent banner needed.
- No third-party trackers.
- Analytics: server-side only (PostHog self-hosted recommended).
