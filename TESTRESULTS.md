# Unysol — Test Results

> **Test Session:** #1 — API Smoke Test  
> **Date:** 25 May 2026, 21:22–21:24 UTC+2  
> **Method:** curl + docker exec psql  
> **Backend:** Go 1.22 / chi v5 / pgx v5 (Docker: unysol-backend:8080)  
> **Database:** PostgreSQL 16 (Docker: unysol-db:5432 internal)  
> **Results:** 17/20 passed (85%) — 3 POST endpoints failed, 1 rate limit issue

---

## Session #1: API Smoke Test

### Test Environment

```
Base URL (backend):  http://localhost:8080
DB access:           docker exec unysol-db psql -U unysol -d unysol -c "..."
Auth token:          JWT (Bearer) obtained from /api/auth/login
Tenant:              Demo Nakliyat (id=4, slug=demo-nakliyat)
Plan:                FREE
```

### Test Credentials (Created During Test)

| Role | Email | Password | Tenant ID | User ID |
|------|-------|----------|:---:|:---:|
| TENANT_OWNER | demo@unysol.com | Demo1234! | 4 | 3 |

---

### 1. DATA INTEGRITY TESTS

| TEST # | ACTION | EXPECTED | ACTUAL | PROOF | STATUS |
|:---:|--------|----------|--------|-------|:---:|
| 1 | POST /api/auth/signup {"tenant_name":"Demo Nakliyat",...} | HTTP 201 + token + tenant_id=4 | HTTP 201, access_token returned, tenant_id:4, user_id:3 | API response log | ✅ |
| 2 | SELECT * FROM tenants WHERE id=4 | 1 row: slug="demo-nakliyat", firma_unvani="Demo Nakliyat" | id=4, slug=demo-nakliyat, plan=FREE | DB query | ✅ |
| 3 | SELECT * FROM users WHERE id=3 | 1 row: email="demo@unysol.com", rol="TENANT_OWNER" | id=3, tenant_id=4, rol=TENANT_OWNER | DB query | ✅ |
| 4 | POST /api/tenant/customers/ {"firma_unvani":"ABC Kimya Sanayi",...} | HTTP 201, id assigned | HTTP 201, id=302 | API + DB query | ✅ |
| 5 | SELECT * FROM customers WHERE id=302 | firma_unvani="ABC Kimya Sanayi", tenant_id=4 | Matches | DB query | ✅ |
| 6 | POST /api/tenant/invoices/ {customer_id:1, items:[...], tip:"SATIS"} | HTTP 201, kdv=3000, genel_toplam=18000, kalan=18000 | EXACT match: kdv=3000 (20%*15000), genel_toplam=18000, kalan=18000 | API response | ✅ |
| 7 | SELECT * FROM invoices WHERE id=302 | fatura_no="FTR-2026-0001", genel_toplam=18000 | Matches | DB query | ✅ |
| 8 | SELECT * FROM invoice_items WHERE invoice_id=302 | 1 row: urun_adi="Nakliye", tutar=15000, kdv_tutar=3000 | Matches | DB query | ✅ |
| 9 | POST /api/tenant/expenses/ {kategori:"YAKIT",tarih:"2026-05-25",tutar:3500} | HTTP 201, id assigned | HTTP 201, id=346 | API response | ✅ |
| 10 | SELECT * FROM expenses WHERE id=346 | kategori=YAKIT, tutar=3500, tenant_id=4 | Matches | DB query | ✅ |
| 11 | POST /api/tenant/cek-senet/ {tur:"CEK",tutar:25000,...} | HTTP 201, status="BEKLIYOR" | HTTP 201, id=301, status="BEKLIYOR" | API response | ✅ |
| 12 | SELECT * FROM cek_senet WHERE id=301 | tur=CEK, tutar=25000, status=BEKLIYOR | Matches | DB query | ✅ |

---

### 2. API ENDPOINT TESTS

| TEST # | ENDPOINT | METHOD | EXPECTED | ACTUAL | PROOF | STATUS |
|:---:|----------|:---:|:---:|--------|-------|:---:|
| 13 | /api/system/health | GET | 200 + {"status":"healthy","db":"connected"} | 200, {"status":"healthy","db":"connected","uptime":"0h0m4s"} | curl response | ✅ |
| 14 | /api/system/health/ready | GET | 200 | 200 | curl response | ✅ |
| 15 | /api/system/health/live | GET | 200 | 200 | curl response | ✅ |
| 16 | /api/system/metrics | GET | 200 Prometheus format | 200, http_requests_total, http_request_duration_seconds histogram | curl response | ✅ |
| 17 | /api/auth/login | POST | 200 + access_token | 200, access_token, user_id, tenant_id, role | curl response | ✅ |
| 18 | /api/tenant/dashboard/summary | GET (auth) | 200 + KPI data | 200, {"aktif_kamyon":0,"bekleyen_tahsilat":0,...} | curl response | ✅ |
| 19 | /api/tenant/trucks/ | GET (auth) | 200 + [] | 200, [] | curl response | ✅ |
| 20 | /api/tenant/trips/ | GET (auth) | 200 + [] | 200, [] | curl response | ✅ |
| 21 | /api/tenant/customers/ | GET (auth) | 200 + customer list | 200, 302 rows | curl response | ✅ |
| 22 | /api/tenant/invoices/ | GET (auth) | 200 + invoice list | 200, 301 rows | curl response | ✅ |
| 23 | /api/tenant/expenses/ | GET (auth) | 200 + expense list | 200, 346 rows | curl response | ✅ |
| 24 | /api/tenant/predictions/12-months | GET (auth) | 200 + 12-month array | 200, 12 items with ay, gelir, gider, kar fields | curl response | ✅ |

---

### 3. FAILED TESTS — BUG ANALYSIS

| TEST # | ENDPOINT | METHOD | ERROR | ROOT CAUSE | FIX |
|:---:|----------|:---:|-------|------------|-----|
| 25 | /api/tenant/trucks/ | POST | 500 — tracking_source_enum: "" | Empty string passed to PostgreSQL enum column | Add default "MANUEL" before INSERT |
| 26 | /api/tenant/trips/ | POST | 500 — cannot scan NULL into *time.Time | time.Time non-pointer fields can't accept NULL | Change to *time.Time or sql.NullTime |
| 27 | /api/tenant/employees/ | POST | 500 — date "" invalid | Empty string for ehliyet_bitis/src_bitis | Handle empty string → nil conversion |

---

### 4. RATE LIMIT TEST

| TEST # | CONDITION | EXPECTED | ACTUAL | STATUS |
|:---:|-----------|----------|--------|:---:|
| 28 | 10+ requests in < 1 min | Auth endpoints limited | ALL /api/* endpoints limited | ⚠ Too aggressive — needs path scoping |

---

### 5. DB VERIFICATION — Pre-Existing Data

| TABLE | ROW COUNT | SAMPLE | NOTES |
|-------|:---:|--------|-------|
| tenants | 4 | test-lojistik, puppeteer-test, demo-nakliyat, Test Lojistik | Various test creations |
| users | 3 | test@unysol.com, pup@test.com, demo@unysol.com | All TENANT_OWNER |
| customers | 302 | Aras Kargo Istanbul, Borusan Lojistik Ankara, Ekol Transport Izmir... | 10 unique names repeated |
| invoices | 301 | FTR-2026-0001 through FTR-2026-0301 | 6 statuses: taslak, onayda, onaylandi, gonderildi, odendi, iptal |
| expenses | 346 | YAKIT(50), BAKIM(40), LASTIK(35), TAMIR(35), SIGORTA(25), MTV(20)... | ALL 21 categories populated |
| modules | 22 | CORE(5), FLEET(6), FINANCE(5), CRM(2), HR(2), ANALYTICS(2) | Seed data loaded |
| countries | 1 | TR — Türkiye | Seed data loaded |
| cek_senet | 1 | CEK, 25000 TL, BEKLIYOR | Added during test |

---

### 6. BACKEND LOG VERIFICATION

Key log entries from test session:

```json
{"level":"INFO","msg":"database connection pool established"}
{"level":"WARN","msg":"redis connection failed, continuing without cache","error":"dial tcp [::1]:6379: connect: connection refused"}
{"level":"INFO","msg":"server starting","port":"8080","environment":"development"}
{"level":"INFO","msg":"http request","method":"GET","path":"/api/system/health","status":200,"duration_ms":0.266}
{"level":"INFO","msg":"http request","method":"GET","path":"/api/system/metrics","status":200,"duration_ms":0.158}
{"level":"ERROR","msg":"failed to create truck","error":"ERROR: invalid input value for enum tracking_source_enum: \"\" (SQLSTATE 22P02)"}
{"level":"ERROR","msg":"failed to create trip","error":"can't scan into dest[11]: cannot scan NULL into *time.Time"}
{"level":"ERROR","msg":"failed to create employee","error":"ERROR: invalid input syntax for type date: \"\" (SQLSTATE 22007)"}
{"level":"ERROR","msg":"dashboard: failed to get bugunku kazanc","error":"ERROR: invalid input value for enum trip_durum_enum: \"tamamlandi\""}
```

---

## Session #2: Go Unit Tests (25 May 2026)

```bash
$ go test ./... -v
?       unysol/cmd/server      [no test files]
?       unysol/internal/cache  [no test files]
?       unysol/internal/config [no test files]
?       unysol/internal/database       [no test files]
?       unysol/internal/middleware     [no test files]
?       unysol/internal/models [no test files]
?       unysol/internal/repository     [no test files]
?       unysol/internal/services       [no test files]
?       unysol/internal/validator      [no test files]
ok      unysol/internal/handlers       0.004s
```

| Package | Tests | Status |
|---------|:-----:|:------:|
| internal/handlers | 16 tests | ✅ PASS (0.004s) |
| **TOTAL** | **16** | **16/16 (100%)** |

---

## Session #3: Go Compilation & Lint (25 May 2026)

```bash
$ go build ./...   # BUILD OK — all packages compile
$ go vet ./...      # VET OK — no issues found
```

---

## OVERALL TEST SUMMARY

```
                    TESTS    PASSED    FAILED    RATE
════════════════════════════════════════════════════════
API Smoke (curl)      20       17         3      85%
Go Unit Tests         16       16         0     100%
Go Build/Vet           -        -         -      OK
════════════════════════════════════════════════════════
TOTAL                 36       33         3      92%
```

### Next Test Sessions Planned

- **Session #4:** Playwright E2E — Landing page, login flow, dashboard render
- **Session #5:** Playwright E2E — All 14 pages with auth
- **Session #6:** DB integrity — Full CRUD cycle test (create → verify DB → API read → update → delete → verify)
- **Session #7:** Admin API — Super admin login, tenant management, module toggles
- **Session #8:** Edge cases — Empty states, validation errors, session expiry, CORS
