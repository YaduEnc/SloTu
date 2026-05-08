# 05 — Auth: Phone OTP via Fast2SMS + JWT

## High-level flow

```
[Frontend]                   [Backend]                    [Fast2SMS]
   │                            │                             │
   │ POST /api/auth/otp/send   │                             │
   ├───────────────────────────►│                             │
   │                            │ rate-limit check            │
   │                            │ generate 6-digit code       │
   │                            │ bcrypt(code) → otp_hash     │
   │                            │ insert otp_requests row     │
   │                            │ POST sms with code          │
   │                            ├────────────────────────────►│
   │                            │                             │
   │ 200 { request_id }         │                             │
   │◄───────────────────────────┤                             │
   │                            │                             │
   │ user reads SMS, enters code│                             │
   │                            │                             │
   │ POST /api/auth/otp/verify  │                             │
   ├───────────────────────────►│                             │
   │                            │ load otp_requests row       │
   │                            │ check not expired/consumed  │
   │                            │ bcrypt.verify(code, hash)   │
   │                            │ mark consumed               │
   │                            │ upsert user                 │
   │                            │ issue JWT + refresh cookie  │
   │ 200 { access_token, user } │                             │
   │◄───────────────────────────┤                             │
```

## OTP rules

| Rule | Value |
|------|-------|
| Code length | 6 digits, numeric, no leading zero excluded |
| TTL | 5 minutes |
| Max verify attempts per request | 5 |
| Send rate per phone | 3/min, 10/hour |
| Send rate per IP | 30/hour |
| Storage | `otp_requests.otp_hash = bcrypt(otp, rounds=10)` |

## Phone validation

Regex: `^\+91[6-9]\d{9}$`
Always normalise: strip spaces, hyphens, leading zeros, prepend `+91` if 10-digit Indian number.

## Fast2SMS API

Endpoint: `https://www.fast2sms.com/dev/bulkV2`
Headers: `authorization: <FAST2SMS_API_KEY>`
Method: POST (form-encoded)
Body for OTP route:
```
route=otp
variables_values=<6_digit_code>
numbers=<10_digit_no_country_code>
```

Response: `{ "return": true, "request_id": "...", "message": ["..."] }`

**Failure handling**: if Fast2SMS returns non-200 or `return:false`:
- Log + Sentry alert.
- Return 503 `SMS_PROVIDER_DOWN` to client (NOT 500).
- Do NOT delete `otp_requests` row — let it expire naturally (helps with retries).

**Fallback provider**: MSG91 if `FAST2SMS_FALLBACK_ENABLED=true`.

## JWT

| Token | TTL | Where stored |
|-------|-----|--------------|
| `access_token` | 15 minutes | Authorization header by frontend (in memory) |
| `refresh_token` | 7 days | HttpOnly Secure SameSite=Lax cookie `slotu_rt` |

JWT claims:
```json
{
  "sub": "<user_uuid>",
  "phone": "+91...",
  "role": "buyer|seller|admin",
  "iat": 1700000000,
  "exp": 1700000900,
  "jti": "<uuid>",
  "type": "access" | "refresh"
}
```

Algorithm: `HS256`. Secret: `JWT_SECRET` env var (32+ random bytes).

### Refresh flow
- Frontend sees 401 → calls `POST /api/auth/refresh` (cookie sent automatically).
- Backend validates refresh JWT, checks JTI not in Redis blacklist, issues new access token.
- On any error → 401 → frontend redirects to login.

### Logout
- Backend adds JTI to Redis with TTL = remaining lifetime: `SET blacklist:<jti> 1 EX <seconds>`.
- Clears refresh cookie.

## Role middleware

```python
def require_role(*roles):
    def dep(user: User = Depends(get_current_user)):
        if user.role not in roles and "admin" not in roles:
            raise HTTPException(403, "INSUFFICIENT_ROLE")
        return user
    return dep

# Usage
@router.post("/listings", dependencies=[Depends(require_role("seller"))])
```

`admin` role bypasses seller/buyer checks where appropriate.

## Security checklist

- [ ] OTP brute-force protected (per request + global per phone)
- [ ] Refresh token rotation on use (issue new refresh, blacklist old)
- [ ] HTTPS only (cookie Secure flag)
- [ ] JWT secret 32+ random bytes
- [ ] Logging: phone numbers masked in logs (`+91XX...XX10`)
- [ ] No JWTs in URLs
- [ ] CORS allowlist enforced
