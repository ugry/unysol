# Unysol — Bug Hunt Report #1

> **Generated:** 25 May 2026 — 21:23 (UTC+2)  
> **Browser/Client:** curl 8.5.0 / docker exec psql  
> **Backend:** Go 1.22 / chi v5 / pgx v5 running in Docker  
> **Status:** FIRST BUG HUNT — Basic API smoke test completed

---

## 1. SUMMARY

```
BUG HUNT STATUS: SESSION #1 COMPLETE
=====================================
Formal tests run:      20 (curl + psql verification)
Tests passed:          17 (85%)
Tests failed:          3 (15%)
Bugs found:            4 API bugs + 2 production issues
Bugs fixed:            0
Open bugs:             6
```

---

## 2. BUGS FOUND (Session #1 — 25 May 2026)

### Bug B1 — Truck Create: Empty tracking_source Enum Rejection
**Severity:** MEDIUM | **Category:** API | **Endpoint:** POST /api/tenant/trucks/

**Steps:**
1. POST to `/api/tenant/trucks/` with `{"plaka":"34 TEST 123","marka":"Ford","model":"Cargo","yil":2023,"yakit_tipi":"DIZEL"}` (no tracking_source)
2. Backend returns HTTP 500

**Expected:** HTTP 201, truck created with default tracking_source="MANUEL"  
**Actual:** `ERROR: invalid input value for enum tracking_source_enum: ""` (SQLSTATE 22P02)

**Root Cause:** `/home/ugur/unysol/backend/internal/handlers/trucks.go` — when tracking_source is empty string, the INSERT passes it to the DB enum which rejects "".

**Fix:** Add default: `if req.TrackingSource == "" { req.TrackingSource = "MANUEL" }` before INSERT.  
**Proof:** Backend log: `"error":"ERROR: invalid input value for enum tracking_source_enum: \"\" (SQLSTATE 22P02)"`

---

### Bug B2 — Trip Create: NULL Scan into *time.Time
**Severity:** MEDIUM | **Category:** API | **Endpoint:** POST /api/tenant/trips/

**Steps:**
1. POST to `/api/tenant/trips/` with valid trip data
2. DB returns some fields as NULL (e.g., updated_at)
3. Go scan fails

**Expected:** HTTP 201, trip created  
**Actual:** `ERROR: can't scan into dest[11]: cannot scan NULL into *time.Time`

**Root Cause:** `/home/ugur/unysol/backend/internal/handlers/trips.go` — the Trip struct (or Scan destination) has `time.Time` (non-pointer) fields. When DB returns NULL for these columns, Go's scan fails. Fix: Change `time.Time` to `*time.Time` or use `sql.NullTime`.

**Proof:** Backend log: `"error":"can't scan into dest[11]: cannot scan NULL into *time.Time"`  
**File:** `/home/ugur/unysol/backend/internal/handlers/trips.go` — scan dest fields 11

---

### Bug B3 — Employee Create: Empty Date String
**Severity:** MEDIUM | **Category:** API | **Endpoint:** POST /api/tenant/employees/

**Steps:**
1. POST to `/api/tenant/employees/` with `{"ad_soyad":"Mehmet Demir","rol":"SOFOR","telefon":"5551112233","ehliyet_bitis":"2027-06-01"}` (no src_bitis)
2. Backend returns HTTP 500

**Expected:** HTTP 201, employee created with NULL for unset dates  
**Actual:** `ERROR: invalid input syntax for type date: ""` (SQLSTATE 22007)

**Root Cause:** `/home/ugur/unysol/backend/internal/handlers/employees.go` — empty string for `ehliyet_bitis` / `src_bitis` is passed to the INSERT. PostgreSQL date type rejects "". Fix: Convert empty string to nil before INSERT, or handle nullable fields properly.

**Proof:** Backend log: `"error":"ERROR: invalid input syntax for type date: \"\" (SQLSTATE 22007)"`

---

### Bug B4 — Dashboard: Enum Case Mismatch
**Severity:** LOW | **Category:** DATA | **Endpoint:** GET /api/tenant/dashboard/summary

**Steps:**
1. GET `/api/tenant/dashboard/summary`  
2. Backend queries use lowercase status values
3. PostgreSQL enum rejects due to case mismatch

**Expected:** KPI data returned (even if zeros)  
**Actual:** Dashboard returns 200 with KPI=0 but logs errors: `"error":"ERROR: invalid input value for enum trip_durum_enum: \"tamamlandi\" (SQLSTATE 22P02)"`

**Root Cause:** Dashboard SQL queries use `WHERE durum = 'tamamlandi'` but the enum definition uses uppercase `'TAMAMLANDI'`. Fix: Use uppercase in queries or define enum values as lowercase in schema.

**Proof:** Backend log: `"msg":"dashboard: failed to get bugunku kazanc","error":"ERROR: invalid input value for enum trip_durum_enum: \"tamamlandi\""`

---

### Bug P1 — Rate Limiter: Auth Limit Applies Globally
**Severity:** HIGH | **Category:** PRODUCTION | **Middleware:** /api/*

**Steps:**
1. Make 10+ requests to any `/api/tenant/*` endpoint in < 1 minute
2. Client receives HTTP 429

**Expected:** 10 req/min limit only on `/api/auth/login` and `/api/auth/signup`  
**Actual:** All `/api/*` endpoints are rate-limited at 10 req/min

**Root Cause:** `/home/ugur/unysol/backend/internal/middleware/ratelimit.go` — the rate limit check applies the auth limit without scoping to `/api/auth/*` path prefix. Fix: Add path check — apply strict limit only when `strings.HasPrefix(r.URL.Path, "/api/auth")`.

**Proof:** curl response: `{"error":"rate limit exceeded"}` on `/api/tenant/dashboard/summary` and `/api/tenant/notifications/`.

---

### Bug P2 — Redis Connection: Wrong Hostname
**Severity:** MEDIUM | **Category:** PRODUCTION | **Infrastructure**

**Steps:**
1. Docker compose starts redis container as `unysol-redis` on network `unysol_default`
2. Backend REDIS_URL defaults to `redis://localhost:6379/0`  
3. Backend logs connection error

**Expected:** Backend connects to Redis container at `redis:6379`  
**Actual:** Backend tries `localhost:6379` which is the container's own loopback (no Redis)

**Root Cause:** docker-compose.yml sets `REDIS_URL: "redis:6379"` but config.go default is `redis://localhost:6379/0` and the URL format may not match. Also, the redis.go cache client gracefully degrades but emits a warning. Fix: Set `REDIS_URL: "redis://redis:6379/0"` in docker-compose.yml.

**Proof:** Backend log: `"msg":"redis connection failed, continuing without cache","error":"dial tcp [::1]:6379: connect: connection refused"`

---

## 3. KNOWN ISSUES (Pre-Testing Architectural)

| # | Area | Observation | Severity | Status |
|---|------|-------------|----------|--------|
| 1 | Security | CORS allows all origins (`*`) — acceptable for dev, must restrict for prod | MEDIUM | ⚠ Dev only |
| 2 | Security | JWT_SECRET hardcoded in docker-compose.yml (`unysol-dev-secret-change-in-production`) | MEDIUM | ⚠ Dev only |
| 3 | Monitoring | Prometheus/Grafana/Loki stack not configured in compose | LOW | ⬜ Pending |
| 4 | DR | No backup strategy implemented | HIGH | ⬜ Pending |
| 5 | Auth | No login lockout after 5 failed attempts | MEDIUM | ⬜ Pending |
| 6 | Auth | No password strength validation (8+ chars, upper/lower/digit/special) | MEDIUM | ⬜ Validator exists, not wired to signup |
| 7 | Data | db and redis containers previously exited (had to restart full stack) | MEDIUM | ⚠ Needs restart: unless-stopped not preventing exits |
| 8 | Frontend | Building with vite preview (no proxy) — API calls go to localhost:8080 directly | LOW | ⚠ Works when ports exposed to host |
| 9 | Compose | `version: "3.8"` attribute is obsolete (Docker Compose warning) | LOW | ⬜ Cleanup |

---

## 4. FIX VERIFICATION CHECKLIST

```
☐ B1 Fix: Add tracking_source default in trucks.go Create()
☐ B2 Fix: Change time.Time to *time.Time or handle NULL in trips.go scan
☐ B3 Fix: Handle empty date strings in employees.go Create()
☐ B4 Fix: Uppercase trip status values in dashboard queries
☐ P1 Fix: Scope auth rate limit to /api/auth/* path prefix
☐ P2 Fix: Set REDIS_URL to redis://redis:6379/0 in docker-compose.yml
```

---

## 5. ISSUE TEMPLATE

When reporting future bugs, use this format:

```markdown
## Bug #[ID] — [Short Title]

**Severity:** CRITICAL / HIGH / MEDIUM / LOW
**Category:** API / UI / DATA / AUTH / PERFORMANCE / SECURITY
**Page/Endpoint:** [URL or route]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Proof
- Screenshot: /tmp/unysol_shots/bug_[ID].png
- API Log: [curl output or response body]
- DB Query: [SELECT result]
- Backend Log: [docker logs output]

### Root Cause Analysis
[Why this bug exists — code location, logic error, etc.]

### Suggested Fix
[Proposed code change or approach]
```
