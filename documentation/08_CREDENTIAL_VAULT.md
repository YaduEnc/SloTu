# 08 — Credential Vault (AES-256-GCM + OTP-Gated Reveal)

## Why this exists

Sellers upload account credentials or family-plan invite links. Slotu must store these so they can be auto-delivered to the buyer the moment payment confirms — but never expose them in any API response unless the buyer is the legitimate buyer of a paid order, and even then only via a one-time OTP-gated reveal.

## Cryptography

- Algorithm: **AES-256-GCM** (authenticated encryption)
- Library: `cryptography` (Python)
- Key: 32 bytes from `VAULT_MASTER_KEY` (base64-encoded in env)
- IV: 12 bytes random per record
- Auth tag: 16 bytes (built into GCM)
- Plaintext: JSON-serialised credential dict

## Key management

- `VAULT_MASTER_KEY` — root key in `.env`. NEVER commit. Generated via `openssl rand -base64 32`.
- For production: store master key in AWS KMS / HashiCorp Vault. Backend reads it at boot.
- `key_version` column allows rotation: write new records with v2, read old with v1 lookup.

## Encrypt helper

```python
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os, json, base64

def get_master_key() -> bytes:
    return base64.b64decode(os.environ["VAULT_MASTER_KEY"])

def encrypt_credential(plain: dict, key_version: int = 1) -> dict:
    aesgcm = AESGCM(get_master_key())
    iv = os.urandom(12)
    plaintext = json.dumps(plain, separators=(",", ":")).encode()
    ciphertext = aesgcm.encrypt(iv, plaintext, None)
    # AES-GCM in cryptography returns ciphertext+tag concatenated
    enc, tag = ciphertext[:-16], ciphertext[-16:]
    return {
        "encrypted_data": enc,
        "iv": iv,
        "auth_tag": tag,
        "key_version": key_version,
    }

def decrypt_credential(record) -> dict:
    aesgcm = AESGCM(get_master_key())  # add version-aware lookup if rotating
    full_ct = record.encrypted_data + record.auth_tag
    plain = aesgcm.decrypt(record.iv, full_ct, None)
    return json.loads(plain)
```

## Allowed credential types

| `credential_type` | `data` shape |
|---|---|
| `login` | `{ "email": str, "password": str, "notes": str? }` |
| `family_invite_link` | `{ "invite_url": str, "notes": str? }` |
| `invite_email_target` | `{ "send_to_email": str, "instructions": str }` (seller manually sends invite to this email) |

## Validation on POST

- `email`: must be valid email, max 160 chars.
- `password`: min 4 chars, max 200 chars (don't be too restrictive — sellers paste real passwords).
- `invite_url`: must match `^https?://[a-z0-9.-]+/.*` and limit to allow-list of service domains (`netflix.com`, `spotify.com`, etc.). Reject random domains.
- `notes`: max 500 chars.

## Reveal flow (security critical)

```
POST /api/vault/orders/:order_id/reveal/request
  ─► Auth: buyer of order
  ─► Order must be in 'paid' status
  ─► Rate limit: 3 per 15 min per order
  ─► Generate 6-digit OTP, bcrypt-hash, store in otp_requests
  ─► Send via the current OTP delivery channel
  ─► Return { request_id, expires_in: 300 }

POST /api/vault/orders/:order_id/reveal/verify
  ─► Auth: same buyer
  ─► Body: { request_id, otp }
  ─► Verify hash, mark consumed
  ─► Atomic transaction:
     ├─ Find oldest unconsumed credential for this listing
     ├─ Mark credentials_vault.consumed_by_order_id = order_id
     ├─ Decrement listings.slots_available (already done at order creation)
     ├─ Transition order paid → delivered
     ├─ Notify seller "Buyer accessed credentials"
  ─► Decrypt credential ONCE
  ─► Return decrypted data in response (NEVER cache, NEVER log)
  ─► Add audit_log entry: vault.credential_revealed
```

## Reveal response

```json
{
  "credential_type": "login",
  "data": {
    "email": "share@example.com",
    "password": "Sup3r$ecret!",
    "notes": "Use profile 'Buyer'. PIN: 1234."
  },
  "delivered_at": "2026-01-01T12:34:56Z",
  "warning": "These credentials will not be shown again. Save them securely."
}
```

## Frontend rules (must enforce)

- Display credentials in a clearly-marked, copy-on-click panel.
- DO NOT store in localStorage/sessionStorage.
- Auto-clear after 10 minutes of inactivity.
- Show "Already revealed?" UX — buyer can re-request only via dispute.

## What's NEVER returned

- Raw `encrypted_data`, `iv`, `auth_tag`.
- Decrypted credential outside the reveal endpoint.
- Credentials of consumed records (one-shot).

## Logging rules

| Event | Logged | Not logged |
|-------|--------|------------|
| Encrypt | record id, listing id | plaintext |
| Decrypt | record id, order id, buyer id | plaintext |
| Reveal request | order id, buyer id (phone masked) | OTP |
| Reveal verify success | order id | decrypted data |

## Key rotation procedure (when needed)

1. Generate new key, set `VAULT_MASTER_KEY_V2` in env.
2. Code reads `key_version` column → picks correct key.
3. Run migration job: re-encrypt records older than 90 days with v2.
4. Once all migrated, retire v1.

## Threat model assumptions

- DB compromise → attacker has ciphertexts only, no key → safe.
- Backend RAM compromise (cold-boot/Spectre) → key exposed → mitigate via KMS at-runtime fetch in production.
- Buyer device compromise → out of scope, frontend warns.
