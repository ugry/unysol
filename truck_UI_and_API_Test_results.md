# Truck (Kamyon) — UI & API Test Results

> **Test Session:** #2 (Re-test: Partial PUT with COALESCE fix)  
> **Date:** 26 May 2026  
> **Module:** Kamyon Yönetimi  
> **Method:** curl + docker exec psql  
> **Base URL:** http://localhost:5174 | API: http://localhost:8080
> **Tenant:** 12 | **User:** demo@unysol.com

## 1. RE-TEST SUMMARY (Partial PUT)

| Total Tests | Passed | Failed | Pass Rate |
|:---:|:---:|:---:|:---:|
| 3 | 3 | 0 | 100.0% |

## 2. PARTIAL PUT FIX VERIFICATION

The PUT endpoint originally used `models.TruckCreate` for update requests and the SQL used `COALESCE(NULLIF($5, ''), tracking_source)` — but `tracking_source` is a PostgreSQL enum type (`tracking_source_enum`), causing a type mismatch error (`COALESCE types text and tracking_source_enum cannot be matched`). The error caused `QueryRow.Scan` to fail, which was reported as "truck not found".

### Fix Applied (`backend/internal/handlers/trucks.go:139`)

```sql
-- BEFORE (broken):
tracking_source = COALESCE(NULLIF($5, ''), tracking_source)

-- AFTER (fixed):
tracking_source = COALESCE(NULLIF($5, '')::tracking_source_enum, tracking_source)
```

### Test Steps

| # | Action | Expected | Actual | Status |
|:---:|:---|:---|:---|:---:|
| 1 | POST create truck (plaka="34 RETEST", marka="Ford", model="Cargo", yil=2023) | id returned | id=339 | PASS |
| 2 | PUT partial update (plaka="34 RETEST2" only) | marka, model, yil preserved | plaka="34 RETEST2", marka="Ford", model="Cargo", yil=2023 | PASS |
| 3 | DB verify after PUT | plaka changed, others unchanged | 34 RETEST2 \| Ford \| Cargo \| 2023 | PASS |

### Raw Test Output

```
CREATE: {"id":339,"tenant_id":12,"plaka":"34 RETEST","marka":"Ford","model":"Cargo","yil":2023,"tracking_source":"MANUEL",...}
PUT:    {"id":339,"tenant_id":12,"plaka":"34 RETEST2","marka":"Ford","model":"Cargo","yil":2023,"tracking_source":"MANUEL",...}
DB:     34 RETEST2 | Ford | Cargo | 2023
```

## 3. PREVIOUS TEST RESULTS (Session #1 — 25 May 2026)

> **Original test with full PUT (all fields sent).**  
> **Tenant:** 4 | **Total:** 20/20 PASS

| # | Action | Expected | Actual | Status |
|:---:|:---|:---|:---|:---:|
| 1 | Login | Redirect to dashboard | /dashboard | PASS |
| 2 | Navigate to /dashboard/trucks | Page content > 100 chars | 12448 chars | PASS |
| 3 | Click 'Kamyon Ekle' | Modal with Kaydet/İptal | Both present | PASS |
| 4 | Create truck '34 UNY 101' via UI | Truck in table | Visible: True | PASS |
| 5 | GET /api/tenant/trucks/ | Has '34 UNY 101' | Found: True | PASS |
| 6 | psql SELECT by id | plaka='34 UNY 101' | 34 UNY 101 / Ford / Cargo 1842T / 2023 | PASS |
| 7 | PUT marka → Mercedes | API confirms | marka=Mercedes | PASS |
| 8 | PUT model → Actros 1845 | API confirms | model=Actros 1845 | PASS |
| 9 | PUT yil → 2024 | API confirms | yil=2024 | PASS |
| 10 | PUT plaka → 34 UNY 999 | API confirms | plaka=34 UNY 999 | PASS |
| 11 | DB: verify all 4 edits persisted | All fields updated | 34 UNY 999 / Mercedes / Actros 1845 / 2024 | PASS |
| 12 | GET /api/tenant/trucks/{id} | All fields match | Confirmed | PASS |
| 13 | Create 3 trucks via DB | 4 in DB, 1 visible (plan limit=1) | 1/4 visible | PASS |
| 14 | DB: check all 4 exist | 4 rows | Found: 4/4 | PASS |
| 15 | Select All checkbox | Toggles active | Toggled=True | PASS |
| 16 | Select row → delete toolbar | 'Sil' button appears | True | PASS |
| 17 | Export CSV | Download triggered | Clicked: True | PASS |
| 18 | Export Excel | Download triggered | Clicked: True | PASS |
| 19 | API DELETE | Truck deactivated | aktiv=false | PASS |
| 20 | Empty state after deactivation | 'Henüz kayıtlı kamyon bulunmuyor' | True | PASS |

## 4. API VERIFICATION

- **GET /api/tenant/trucks/**: Found trucks for tenant
- **POST /api/tenant/trucks/**: Creates truck, returns full object with id
- **PUT /api/tenant/trucks/{id}**: NOW SUPPORTS PARTIAL UPDATES — COALESCE preserves old values for omitted fields
- **GET /api/tenant/trucks/{id}**: Returns single truck by id
- **DELETE /api/tenant/trucks/{id}**: Soft deletes (sets aktif=false)

## 5. DB INTEGRITY

- Table: `trucks` with `tracking_source_enum` type on `tracking_source` column
- Partial PUT preserves: marka, model, yil, tracking_source when not sent in request

## 6. BUGS FOUND

| # | Bug | Severity | Status |
|:---|:---|:---|:---:|
| 1 | PUT `tracking_source` COALESCE type mismatch (text vs enum) | Critical | **FIXED** — Added `::tracking_source_enum` cast |
| 2 | `SuccessResponse` not setting `Success: true` in DELETE handler | Low | Open (returns `"success":false` even on success) |

## 7. KNOWN LIMITATIONS (Updated)

- **Plan limit = 1 active truck** for FREE plan demo accounts
- **No inline edit/delete buttons** in truck list UI table
- **No yakıt tipi field** in add form
- ~~API PUT requires all fields~~ — **FIXED: Partial PUT now supported via COALESCE**
- **API rate limiter** — 10 req/min on auth, 200 req/min global
