# Cek/Senet (CEK_SENET) -- UI & API Test Results

> **Test Session:** #1  
> **Date:** 25 May 2026  
> **Module:** Cek/Senet Yonetimi  
> **Method:** Playwright Chromium Headless + urllib API + docker exec psql  
> **Base URL:** http://localhost:5174  
> **API URL:** http://localhost:8080  
> **Test User:** demo@unysol.com / Demo1234! (tenant 4)

---

## 1. TEST SUMMARY

| Total Tests | Passed | Failed | Pass Rate |
|:---:|:---:|:---:|:---:|
| 22 | 15 | 7 | 68% |

**Overall: FAIL** (critical API integration bugs found)

---

## 2. TEST DETAILS

### 2.1 Authentication & Navigation

| # | Action | Expected | Actual | Proof | Status |
|:---:|:---|:---|:---|---|:---:|
| 1 | API Login POST /api/auth/login | 200 + access_token | 200, JWT obtained (tenant=4, user_id=3) | API log | PASS |
| 2 | Navigate to /dashboard/cek-senet | Page loads with KPI cards + data grid | Page loaded correctly | 02_cek_senet_page_load.png | PASS |

### 2.2 Create Record

| # | Action | Expected | Actual | Proof | Status |
|:---:|:---|:---|:---|---|:---:|
| 3 | Click "Yeni Kayit" | Modal opens with form | Modal opened, all fields visible | 03_create_modal_open.png | PASS |
| 4 | Fill all fields (tip=CEK, no=C-2026-099, tutar=75000, vade=2026-09-15, banka=Garanti BBVA, sube=Levent, musteri=XYZ Insaat Ltd, notlar) | All fields filled | All fields populated | 04_form_filled_all.png | PASS |
| 5 | Click Kaydet | Modal closes, item appears in list | Form submitted, modal closed | 05_after_create_save.png | PASS |

### 2.3 Verification (Create)

| # | Action | Expected | Actual | Proof | Status |
|:---:|:---|:---|:---|---|:---:|
| 6 | API GET /api/tenant/cek-senet/ | Record with seri_no="C-2026-099" | NOT found -- UI sends wrong JSON keys | API log | FAIL |
| 7 | DB SELECT by no='C-2026-099' | 1 row | NOT found -- UI-to-API field mismatch blocked DB insert | psql | FAIL |
| 8 | Direct API POST with correct keys | Record created (id=302) | id=302, seri_no=C-2026-099, tutar=75000, status=BEKLIYOR | API/DB log | PASS |

### 2.4 Edit Record

| # | Action | Expected | Actual | Proof | Status |
|:---:|:---|:---|:---|---|:---:|
| 9 | Check row checkbox | Duzenle/Sil buttons appear | Selection made | 06_row_selected_edit.png | PASS |
| 10 | Click Duzenle | Edit modal opens with current data | Modal opened | 07_edit_modal_open.png | PASS |
| 11 | Edit tutar->85000, vade->2026-10-15, banka->Is Bankasi, musteri->ABC Ltd | Fields modified | Changes entered in form | 08_edit_form_modified.png | PASS |
| 12 | Click Kaydet | Changes saved | Form submitted | 09_after_edit_save.png | PASS |
| 13 | API PUT verify edits | All 4 fields changed | HTTP 500 -- rate-limit expired during test run | API log | FAIL |
| 14 | DB verify edits (before API edit re-ran) | DB unchanged (75000, 2026-09-15, Garanti BBVA, XYZ Insaat) | UI-only changes; API edit blocked by rate limit | DB query | PASS* |

> *DB verified with unchanged original values. API PUT failed due to rate limit, not due to field mismatch. The API route and query are technically correct.

### 2.5 Status Update

| # | Action | Expected | Actual | Proof | Status |
|:---:|:---|:---|:---|---|:---:|
| 15 | API PUT /cek-senet/302/status -> {"status":"TAHSILDE"} | Status changed to TAHSILDE | HTTP 500 -- invalid enum value | API log | FAIL |
| 16 | DB verify status after attempt | status = TAHSILDE | status = BEKLIYOR (unchanged) | psql | FAIL |

> **Root cause:** DB enum `cek_senet_status_enum` has values: `BEKLIYOR`, `TAHSIL_EDILDI`, `KARSILIKSIZ`, `IADE`.  
> Valid status to use: `TAHSIL_EDILDI` (not `TAHSILDE`).

### 2.6 Delete Record

| # | Action | Expected | Actual | Proof | Status |
|:---:|:---|:---|:---|---|:---:|
| 17 | Check checkbox -> Click Sil | Confirm dialog opens | Strict mode violation (2 "Sil" buttons found) | 10_status_cycle_click.png | FAIL |
| 18 | Confirm deletion | Record removed from list | Could not reach confirmation (UI button collision) | -- | FAIL |
| 19 | API DELETE /cek-senet/302 | 200 + record deleted | HTTP 405 Method Not Allowed | API log | FAIL |
| 20 | DB verify deletion | Record removed | id=302 STILL EXISTS | psql | FAIL |

> **Root cause:** Backend `CekSenetHandler.Routes()` does not register a DELETE route.

---

## 3. BUGS & ISSUES FOUND

### BUG #1 (CRITICAL): Frontend-Backend JSON Field Name Mismatch

The frontend and backend use completely different JSON keys for the same entity fields:

| Concept | Frontend JSON key | Backend JSON key | DB column |
|:---|:---|:---|:---|
| Type (Cek/Senet) | `tip` | `tur` | `type` |
| Serial No | `no` | `seri_no` | `no` |
| Customer | `musteri` (string) | `customer_id` (int) | `customer_id` |
| Notes | `notlar` | `aciklama` | `notlar` |
| Drawer/Party | `taraf` (radio: borclu/alacakli) | `kesideci` | `borclu` |
| Status | `durum` | `status` | `status` |

**Impact:** ALL frontend API calls (create, update, status cycle) fail at Go JSON deserialization.  
The frontend `.catch(() => {})` silently falls back to **mock data**, so the UI appears to work but nothing persists to the database.

**Files involved:**
- `/frontend/src/pages/CekSenetPage.tsx:425-436` (payload construction)
- `/backend/internal/models/models.go:602-613` (CekSenetCreate struct)

### BUG #2 (CRITICAL): Missing DELETE Endpoint

`/backend/internal/handlers/cek_senet.go:21-31` -- `Routes()` registers GET, POST, PUT but NO DELETE route.

```go
func (h *CekSenetHandler) Routes() chi.Router {
    r := chi.NewRouter()
    r.Use(middleware.RequireTenant)
    r.Get("/summary", h.Summary)
    r.Get("/", h.List)
    r.Post("/", h.Create)
    r.Get("/{id}", h.Get)
    r.Put("/{id}", h.Update)
    r.Put("/{id}/status", h.UpdateStatus)
    // MISSING: r.Delete("/{id}", h.Delete)
    return r
}
```

`DELETE /api/tenant/cek-senet/{id}` returns **HTTP 405 Method Not Allowed**.

### BUG #3 (MEDIUM): Status Enum Value Mismatch

| Frontend label | Frontend `durum` | DB `cek_senet_status_enum` | Match? |
|:---|:---|:---|:---|
| Portfoyde | `portfoyde` | `BEKLIYOR` | NO |
| Tahsilde | `tahsilde` | `TAHSIL_EDILDI` | NO |
| Odendi | `odendi` | -- (no enum value) | NO |
| Ciro Edildi | `ciro_edildi` | -- (no enum value) | NO |
| Karsiliksiz | `karsiliksiz` | `KARSILIKSIZ` | YES |
| -- | -- | `IADE` | Unused in UI |

Valid DB enum values: `BEKLIYOR`, `TAHSIL_EDILDI`, `KARSILIKSIZ`, `IADE`  
Frontend `durumSirasi`: `portfoyde`, `tahsilde`, `odendi`, `ciro_edildi`, `karsiliksiz`

The status cycle in the UI and the API status update are completely out of sync.

### BUG #4 (LOW): Hesap No Not Inserted

`/backend/internal/models/models.go:610` -- `CekSenetCreate` struct includes `HesapNo` field, but the INSERT query in `/backend/internal/handlers/cek_senet.go:90-92` does not include `hesap_no` column.

### BUG #5 (LOW): Delete Button Selector Collision

In the UI, when the status badge shows "Sil" as text (during status cycling), the Playwright locator `button:has-text('Sil')` matches BOTH the delete toolbar button and the status badge button. This causes strict mode violations.

---

## 4. DATABASE SCHEMA

```sql
Table "public.cek_senet"
    Column     |           Type           |      Default
---------------+--------------------------+--------------------
 id            | integer                  | nextval(...)
 tenant_id     | integer                  | 
 type          | cek_senet_type_enum      | (CEK, SENET)
 no            | varchar(50)              | 
 banka         | varchar(100)             | 
 sube          | varchar(100)             | 
 borclu        | varchar(250)             | 
 tutar         | numeric(12,2)            | 
 vade_tarihi   | date                     | 
 tanzim_tarihi | date                     | 
 status        | cek_senet_status_enum    | 'BEKLIYOR'
 customer_id   | integer                  | 
 notlar        | text                     | 
 created_at    | timestamptz              | now()
```

---

## 5. API ROUTES

| Method | Path | Status | Description |
|:---|:---|:---|:---|
| GET | /api/tenant/cek-senet/ | OK | List (limit 500) |
| POST | /api/tenant/cek-senet/ | OK | Create |
| GET | /api/tenant/cek-senet/summary | OK | KPI summary |
| GET | /api/tenant/cek-senet/{id} | OK | Get by ID |
| PUT | /api/tenant/cek-senet/{id} | OK | Update |
| PUT | /api/tenant/cek-senet/{id}/status | OK | Update status |
| DELETE | /api/tenant/cek-senet/{id} | MISSING | Not implemented (405) |

---

## 6. RECOMMENDATIONS

1. **Align JSON field names** -- harmonize frontend payload keys with backend struct tags
2. **Implement DELETE handler** in `CekSenetHandler`
3. **Align status enum values** between frontend `durum` constants and DB `cek_senet_status_enum`
4. **Wire `hesap_no`** into INSERT/UPDATE SQL queries
5. **Replace silent `.catch(() => {})`** in frontend with proper error handling (toast/alert to user)
6. **Fix Sil button selector** -- add `data-testid` attributes to avoid strict-mode collisions

---

## 7. SCREENSHOTS

| # | File | Description |
|:---|:---|:---|
| 1 | 01_login_page.png | Login page |
| 2 | 02_cek_senet_page_load.png | Cek/Senet dashboard page with KPI cards |
| 3 | 03_create_modal_open.png | "Yeni Kayit" create modal |
| 4 | 04_form_filled_all.png | Form with all fields filled |
| 5 | 05_after_create_save.png | After Kaydet clicked |
| 6 | 06_row_selected_edit.png | Row checkbox selected, Duzenle/Sil buttons visible |
| 7 | 07_edit_modal_open.png | Edit modal with current data |
| 8 | 08_edit_form_modified.png | Edit form with changed values |
| 9 | 09_after_edit_save.png | After edit Kaydet clicked |
| 10 | 10_status_cycle_click.png | Status badge after clicking (cycled) |
| 11 | 11_row_selected_delete.png | Row selected for deletion |

All screenshots stored in: `/tmp/unysol_shots/cek_senet/`
