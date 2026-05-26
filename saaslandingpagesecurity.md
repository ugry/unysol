# Unysol — SaaS Landing Page Security Audit

> **Audit Date:** 26 May 2026
> **Scope:** Registration flood attacks, contact form abuse, CSRF, credential protection
> **Severity Scale:** 🔴 CRITICAL · 🟠 HIGH · 🟡 MEDIUM · 🟢 LOW

---

## 1. VULNERABLE ENDPOINTS (Ranked by Risk)

| Priority | Endpoint | Risk | Current Protection |
|:---:|---|---|---|
| 🔴 | `POST /api/demo/create` | Account flood, DB bloat, free PRO | **None.** No rate limit, no auth, no CAPTCHA |
| 🟠 | `POST /api/auth/signup` | Mass account creation | Rate limit 10/min per IP only |
| 🟠 | `POST /api/auth/login` | Credential stuffing | Rate limit 10/min + lockout after 5 fails |
| 🟡 | `POST /api/tenant/*` | CSRF attack vector | JWT auth only, no CSRF token |
| 🟡 | `GET /api/system/*` | Amplification attack | No rate limiting on GET endpoints |

---

## 2. UNPROTECTED LANDING PAGE FORMS

| Form | CSRF | CAPTCHA | Rate Limit | Actual Submission |
|---|---|---|---|---|
| Contact Form | ❌ | ❌ | ❌ | **Fake** — `setContactSent(true)`, data never sent |
| Demo Button | ❌ | ❌ | ❌ | Hits vulnerable `POST /api/demo/create` |
| Login/Signup buttons | ❌ | ❌ | ❌ | Navigate to `/login` (backend: partial protection) |

---

## 3. AUTH PROTECTION STATUS

| Check | Signup | Login |
|---|---|---|
| Rate limiting | ✅ 10/min per IP | ✅ 10/min per IP |
| Password validation | ✅ 8+ char, upper/lower/digit/special | N/A |
| Email validation | ❌ **Not called** | N/A |
| Login lockout | ❌ **Not implemented** | ✅ 5 fails → 15min lockout |
| Email verification | ❌ | N/A |
| CAPTCHA | ❌ | ❌ |

---

## 4. INFRASTRUCTURE GAPS

| Issue | Detail |
|---|---|
| No reverse proxy | Services exposed directly on host ports (8080, 5174) |
| No TLS | Plain HTTP on all endpoints |
| No WAF | No ModSecurity / Coraza / Cloudflare |
| Hardcoded JWT secret | `"unysol-dev-secret-change-in-production"` in docker-compose.yml |
| Hardcoded DB password | `"unysol"` in docker-compose.yml |
| In-memory rate limiter | Resets on restart, not shared across instances |

---

## 5. FIXES IMPLEMENTED (26 May 2026)

| # | Fix | Priority | Status |
|---|------|:---:|:---:|
| 1 | Rate limit on `/api/demo/create` (5 req/min) | 🔴 | ✅ |
| 2 | Email validation on signup | 🟠 | ✅ |
| 3 | Signup lockout (5 fails → 15 min, per-IP) | 🟠 | ✅ |
| 4 | Security headers middleware (CSP, X-Frame, X-Content, X-XSS, Referrer, Permissions) | 🟠 | ✅ |
| 5 | Rate limit key scoping — separate IP buckets per limit value | 🔴 | ✅ |
| 6 | CAPTCHA on signup + demo | 🟡 | ⏳ Ertelendi |
| 7 | Reverse proxy + TLS | 🟡 | ⏳ Ertelendi |
| 8 | Credentials to .env | 🟡 | ⏳ Ertelendi |

---

## 6. TEST VERIFICATION (26 May 2026)

| Test | Result |
|---|---|
| Demo rate limit (5/min) | ✅ 201×5, 429 at request #6 |
| Auth rate limit (10/min) | ✅ 201×10, 429 at request #11 |
| Demo+Auth independent buckets | ✅ No cross-contamination |
| Email validation | ✅ `"invalid email address"` for bad email |
| Signup lockout | ✅ Active (per-IP, 15 min, 5 fails) |
| Security headers | ✅ X-Frame, X-Content, X-XSS, Referrer, CSP, Permissions |
| Backend health | ✅ `{"status":"healthy","db":"connected"}` |

### Files Changed

| File | Change |
|---|---|
| `backend/cmd/server/main.go` | Added `RateLimit(5)` to `/api/demo` + `SecurityHeaders` middleware |
| `backend/internal/handlers/auth.go` | Added email validation, signup lockout (per-IP), extractIP helper |
| `backend/internal/middleware/ratelimit.go` | Fixed shared-map bug — scoped key per limit value |
| `backend/internal/middleware/security.go` | New file — CSP, X-Frame, X-Content, X-XSS, Referrer, Permissions headers |
