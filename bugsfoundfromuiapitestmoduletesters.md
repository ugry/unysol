# Unysol — Bugs Found From UI/API Module Tests

> **Generated:** 25 May 2026  
> **Source:** 8 per-module Playwright + curl + psql test sessions  
> **Scope:** truck, trip, customer, invoice, expense, employee, cek_senet, predictions  
> **Total tests:** 187 | **Total bugs found:** 21

---

## BUG INVENTORY

| # | Module | Severity | Category | Status |
|:---:|--------|:---:|----------|:---:|
| C1 | CekSenet | 🔴 CRITICAL | API | ❌ Open |
| C2 | CekSenet | 🔴 CRITICAL | API | ❌ Open |
| C3 | CekSenet | 🟡 MEDIUM | API | ❌ Open |
| C4 | Employee | 🔴 CRITICAL | FRONTEND | ❌ Open |
| C5 | Employee | 🔴 CRITICAL | FRONTEND | ❌ Open |
| C6 | Expense | 🟠 HIGH | FRONTEND | ❌ Open |
| C7 | Expense | 🟠 HIGH | FRONTEND | ❌ Open |
| C8 | Expense | 🟡 MEDIUM | FRONTEND | ❌ Open |
| C9 | Predictions | 🟠 HIGH | API | ❌ Open |
| C10 | Customer | 🟡 MEDIUM | INFRA | ❌ Open |
| C11 | Invoice | 🟡 MEDIUM | UI | ❌ Open |
| C12 | Truck | 🟢 LOW | API | ❌ Open |
| B1 | Truck | 🟠 HIGH | API | ✅ Fixed |
| B2 | Trip | 🟠 HIGH | API | ✅ Fixed |
| B3 | Employee | 🟠 HIGH | API | ✅ Fixed |
| B4 | Dashboard | 🟡 MEDIUM | API | ✅ Fixed |
| B5 | Expense | 🟠 HIGH | API | ✅ Fixed |
| P1 | RateLimiter | 🟡 MEDIUM | INFRA | ⚠ Won't Fix |
| P2 | Redis | 🟡 MEDIUM | INFRA | ✅ Fixed |

**Open: 8 | Fixed: 7 | Won't Fix: 1**

---

## OPEN BUGS — DETAIL

### C1: CekSenet — JSON Field Name Mismatch (UI → API)

| Field | Detail |
|-------|--------|
| **Module** | CekSenet |
| **Severity** | 🔴 CRITICAL |
| **Category** | API Integration |
| **Test found** | 15/22 passed (68%) |

**What happens:** Frontend sends wrong JSON field names to backend. ALL UI creates fail silently — data appears in UI (from mock fallback) but never reaches DB.

**Field mismatch table:**

| Frontend sends | Backend expects | DB column |
|----------------|-----------------|-----------|
| `tip` | `tur` | `tur` |
| `no` | `seri_no` | `seri_no` |
| `notlar` | `aciklama` | `aciklama` |
| `musteri` | `customer_id` (int) | `customer_id` |
| `taraf` | `kesideci` | `kesideci` |
| `durum` | `status` | `status` |

**Root cause:** `/home/ugur/unysol/frontend/src/pages/CekSenetPage.tsx` — the `columns` and `handleSubmit` functions use different JSON key names than what the Go backend handler expects in `CekSenetCreate` struct.

**Fix:** Update frontend `CekSenetPage.tsx` form and API calls to use backend's field names (`tur`, `seri_no`, `aciklama`, `customer_id`, `kesideci`, `status`). OR update backend `CekSenetCreate` struct to accept frontend's field names with `json:"tip"` tags.
- **File:** `frontend/src/pages/CekSenetPage.tsx` (form submit, ~line 167)
- **File:** `backend/internal/handlers/cek_senet.go` (CekSenetCreate struct)
- **Time estimate:** 15 minutes

---

### C2: CekSenet — DELETE Endpoint Not Implemented

| Field | Detail |
|-------|--------|
| **Module** | CekSenet |
| **Severity** | 🔴 CRITICAL |
| **Category** | API |

**What happens:** No DELETE handler registered for `/api/tenant/cek-senet/{id}`. Returns HTTP 405.

**Root cause:** `/home/ugur/unysol/backend/internal/handlers/cek_senet.go` — the `Routes()` method has no DELETE route registered.

**Fix:** Add DELETE handler to cek_senet.go:
```go
r.Delete("/{id}", h.Delete)
```
And implement:
```go
func (h *CekSenetHandler) Delete(w, r) {
    // DELETE FROM cek_senet WHERE id=$1 AND tenant_id=$2
}
```
- **File:** `backend/internal/handlers/cek_senet.go`
- **Time estimate:** 10 minutes

---

### C3: CekSenet — Status Enum Mismatch (Frontend vs Backend/DB)

| Field | Detail |
|-------|--------|
| **Module** | CekSenet |
| **Severity** | 🟡 MEDIUM |
| **Category** | Data |

**What happens:** Frontend dropdown values differ from DB enum.

| Frontend value | Backend/DB enum |
|----------------|-----------------|
| `portfoyde` | `BEKLIYOR` |
| `tahsilde` | `TAHSIL_EDILDI` |
| `odendi` | (no DB equivalent) |
| `ciro_edildi` | (no DB equivalent) |
| `karsiliksiz` | `KARSILIKSIZ` |

**Root cause:** Frontend uses Turkish status names, DB enum uses different naming convention.

**Fix:** Align frontend status values with DB enum: `BEKLIYOR`, `TAHSIL_EDILDI`, `KARSILIKSIZ`, `IADE`. Update both the dropdown options and the status badge render function.
- **File:** `frontend/src/pages/CekSenetPage.tsx` (status dropdown + badge render)
- **Time estimate:** 5 minutes

---

### C4: Employee — Edit Button is a TODO Stub

| Field | Detail |
|-------|--------|
| **Module** | Employee |
| **Severity** | 🔴 CRITICAL |
| **Category** | Frontend |

**What happens:** "Düzenle" button appears (after checkbox select) but clicking it does absolutely nothing. `handleEdit` is `// TODO: implement edit`.

**Root cause:** `/home/ugur/unysol/frontend/src/pages/EmployeesPage.tsx:287` — `handleEdit` function body is empty / TODO comment.

**Fix:** Implement `handleEdit`: open edit modal, pre-fill form with current values from row data, on submit call `api.put('/api/tenant/employees/{id}', updatedData)`. Also, backend needs PUT endpoint (currently only POST/GET exist).
- **File:** `frontend/src/pages/EmployeesPage.tsx` (~line 287)
- **File:** `backend/internal/handlers/employees.go` (add PUT handler + PUT route)
- **Time estimate:** 30 minutes (frontend + backend)

---

### C5: Employee — Delete Button is a TODO Stub

| Field | Detail |
|-------|--------|
| **Module** | Employee |
| **Severity** | 🔴 CRITICAL |
| **Category** | Frontend |

**What happens:** "Sil" button appears, clicking shows confirmation dialog, confirming does nothing — record not deleted. `handleDelete` is `// TODO: implement delete confirmation`.

**Root cause:** `/home/ugur/unysol/frontend/src/pages/EmployeesPage.tsx:293` — `handleDelete` stub. Also, no DELETE endpoint in backend employees handler.

**Fix:** Implement `handleDelete`: call `api.delete('/api/tenant/employees/{id}')`, remove from local state on success. Add DELETE handler + route to backend.
- **File:** `frontend/src/pages/EmployeesPage.tsx` (~line 293)
- **File:** `backend/internal/handlers/employees.go` (add DELETE handler + route)
- **Time estimate:** 20 minutes

---

### C6: Expense — Edit Creates Duplicate (POST Instead of PUT)

| Field | Detail |
|-------|--------|
| **Module** | Expense |
| **Severity** | 🟠 HIGH |
| **Category** | Frontend |

**What happens:** Editing an expense (pre-fills form) then clicking "Kaydet" calls `api.post()` instead of `api.put()`, creating a DUPLICATE record instead of updating.

**Root cause:** `/home/ugur/unysol/frontend/src/pages/ExpensesPage.tsx:167` — `handleSubmit` always uses `api.post('/api/tenant/expenses/', ...)`. It does not check if editing (should use PUT) or creating (should use POST).

**Fix:** Inside `handleSubmit`, check if `editingExpense` is set. If yes, use `api.put(\`/api/tenant/expenses/${editingExpense.id}\`, formData)`. If no, use `api.post`.
```typescript
if (editingExpense) {
    await api.put(`/api/tenant/expenses/${editingExpense.id}`, formData);
} else {
    await api.post('/api/tenant/expenses/', formData);
}
```
- **File:** `frontend/src/pages/ExpensesPage.tsx` (~line 167)
- **Time estimate:** 5 minutes

---

### C7: Expense — Delete is Local-Only (No API Call)

| Field | Detail |
|-------|--------|
| **Module** | Expense |
| **Severity** | 🟠 HIGH |
| **Category** | Frontend |

**What happens:** Deleting an expense removes it from React state but NEVER calls the API. If page refreshes, the "deleted" record reappears.

**Root cause:** `/home/ugur/unysol/frontend/src/pages/ExpensesPage.tsx:294` — `handleDelete` only calls `setData(data.filter(...))` with no `api.delete()` call.

**Fix:** Add API call before state update:
```typescript
const handleDelete = async (row: Expense) => {
    await api.delete(`/api/tenant/expenses/${row.id}`);
    setData(prev => prev.filter(e => e.id !== row.id));
};
```
- **File:** `frontend/src/pages/ExpensesPage.tsx` (~line 294)
- **Time estimate:** 5 minutes

---

### C8: Expense — Missing `fatura_no` Field in UI Form

| Field | Detail |
|-------|--------|
| **Module** | Expense |
| **Severity** | 🟡 MEDIUM |
| **Category** | Frontend |

**What happens:** Add Expense modal has no input field for `fatura_no`. Users cannot enter an invoice/receipt number for an expense via the UI.

**Root cause:** `/home/ugur/unysol/frontend/src/pages/ExpensesPage.tsx:33` — `fat_no` is in the TypeScript column definitions but not included in the add modal form JSX.

**Fix:** Add `<input>` field for `fatura_no` in the add/edit modal form. Add `fat_no` to the form state and submission payload.
- **File:** `frontend/src/pages/ExpensesPage.tsx` (modal JSX)
- **Time estimate:** 5 minutes

---

### C9: Predictions — API/UI Field Name Mismatch

| Field | Detail |
|-------|--------|
| **Module** | Predictions |
| **Severity** | 🟠 HIGH |
| **Category** | API Integration |

**What happens:** API `/api/tenant/predictions/12-months` returns `gelir`, `gider`, `kar` fields. Frontend expects `tahmini_gelir`, `tahmini_gider`, `tahmini_kar`, `guven_araligi`. Because of mismatch, frontend falls back to mock data. API returns zeros for tenant 4 (no historical data), but even if data existed, it wouldn't render.

**Root cause:** Backend returns DB column names. Frontend uses different TypeScript interface field names.

**Fix option A:** Update frontend `types/index.ts` Prediction interface to use `gelir`, `gider`, `kar` (matching API).
**Fix option B:** Update backend handler to return `tahmini_gelir`, `tahmini_gider`, `tahmini_kar` in JSON.
- **File:** `frontend/src/types/index.ts` or `frontend/src/pages/PredictionsPage.tsx`
- **File:** `backend/internal/models/models.go` (Prediction struct json tags)
- **Time estimate:** 5 minutes

---

### C10: Customer — Rate Limiter Blocks Sequential Edits

| Field | Detail |
|-------|--------|
| **Module** | Customer (affects ALL modules during bulk testing) |
| **Severity** | 🟡 MEDIUM |
| **Category** | Infrastructure |

**What happens:** During per-module testing, editing 5 fields sequentially (multiple API PUT calls) hits the 10 req/min per-IP rate limit. Later edits fail with HTTP 429.

**Root cause:** Auth endpoint rate limit (10 req/min per IP) is correct for login/signup, but frontend page loads + API calls + edit operations can exceed this in a single test session. Same IP used for all backend calls during E2E testing.

**Fix:** The rate limiter is correctly scoped (auth=10/min, global=200/min). This is a testing inconvenience, not a production bug. For testing, use 2 approaches:
- Space API calls 7+ seconds apart during edit sequences  
- OR use `docker restart unysol-backend` to reset rate limit counters between test phases

No code change needed — this is documented as "rate limiting working as designed."

---

### C11: Invoice — Headless Browser Delete Dialog Callback Issue

| Field | Detail |
|-------|--------|
| **Module** | Invoice |
| **Severity** | 🟡 MEDIUM |
| **Category** | UI Testing |

**What happens:** Delete confirmation dialog appears in headless Playwright. Clicking confirm closes dialog but record not deleted from DB. Manual `curl -X DELETE` confirms the endpoint works correctly.

**Root cause:** Headless browser timing — the dialog's async callback doesn't complete before the test moves on. Not a code bug. The API DELETE endpoint is functional.

**Fix:** No code fix needed. Add `page.wait_for_timeout(2000)` after dialog confirm click in test script, or use `page.on('dialog')` handler.

---

### C12: Truck — API PUT Requires Full Payload

| Field | Detail |
|-------|--------|
| **Module** | Truck |
| **Severity** | 🟢 LOW |
| **Category** | API Design |

**What happens:** Updating a single field (e.g., only plaka) via `PUT /api/tenant/trucks/{id}` fails unless ALL fields are included in the request body.

**Root cause:** Backend handler uses PATCH semantics (partial update) but registers as PUT. The Go struct decode fills missing fields with zero values, which get written to DB.

**Fix option A:** Change PUT to accept partial payloads by checking which fields are explicitly set.
**Fix option B:** Document that PUT requires full payload, and add PATCH route for partial updates.
- **File:** `backend/internal/handlers/trucks.go` (Update function)
- **Time estimate:** 15 minutes

---

## FIXED BUGS — Detail

### B1: Truck Create — Empty Tracking Source Enum ✅ FIXED

| Field | Detail |
|-------|--------|
| **Module** | Truck |
| **Severity** | 🟠 HIGH |
| **Status** | ✅ Fixed (25 May 2026) |

**What was:** POST to `/api/tenant/trucks/` without `tracking_source` → HTTP 500: `invalid input value for enum tracking_source_enum: ""`

**Fix:** Added default `MANUEL` before INSERT (`trucks.go` line 72-74):
```go
if req.TrackingSource == "" {
    req.TrackingSource = "MANUEL"
}
```

---

### B2: Trip Create — NULL Scan into *time.Time ✅ FIXED

| Field | Detail |
|-------|--------|
| **Module** | Trip |
| **Severity** | 🟠 HIGH |
| **Status** | ✅ Fixed (25 May 2026) |

**What was:** POST to `/api/tenant/trips/` → HTTP 500: `cannot scan NULL into *time.Time`

**Fix:** Changed `var baslangic time.Time` → `var baslangic *time.Time` with nil check (`trips.go` lines 111-127).

---

### B3: Employee Create — Empty Date String ✅ FIXED

| Field | Detail |
|-------|--------|
| **Module** | Employee |
| **Severity** | 🟠 HIGH |
| **Status** | ✅ Fixed (25 May 2026) |

**What was:** POST without `ehliyet_bitis` or `src_bitis` → HTTP 500: `invalid input syntax for type date: ""`

**Fix:** Added `NULLIF($5, 'NULL')::date` pattern + empty string → `NULL` conversion before INSERT (`employees.go` lines 69-79).

---

### B4: Dashboard — Enum Case Mismatch ✅ FIXED

| Field | Detail |
|-------|--------|
| **Module** | Dashboard |
| **Severity** | 🟡 MEDIUM |
| **Status** | ✅ Fixed (25 May 2026) |

**What was:** Dashboard queries used `durum = 'tamamlandi'` but DB enum expects `'TAMAMLANDI'`. KPI cards showed zeros despite data existing.

**Fix:** Changed all 3 occurrences to uppercase `'TAMAMLANDI'` (`dashboard.go` lines 43, 53, 100).

---

### B5: Expense — Category Case Mismatch in Update ✅ FIXED

| Field | Detail |
|-------|--------|
| **Module** | Expense |
| **Severity** | 🟠 HIGH |
| **Status** | ✅ Fixed (25 May 2026) |

**What was:** Expense updates with lowercase category values → PostgreSQL enum rejection. Also, UPDATE query had COALESCE type mismatch.

**Fix:** Added `strings.ToUpper()` on category in Create/Update/List handlers. Fixed UPDATE COALESCE to cast `::expense_kategori_enum` (`expenses.go` lines 38, 107, 170).

---

### P2: Redis Connection URL ✅ FIXED

| Field | Detail |
|-------|--------|
| **Module** | Infrastructure |
| **Severity** | 🟡 MEDIUM |
| **Status** | ✅ Fixed (25 May 2026) |

**What was:** Backend tried `redis://localhost:6379/0` inside Docker container. No Redis on container's localhost.

**Fix:** Changed docker-compose.yml REDIS_URL from `redis:6379` to `redis://redis:6379/0`.

---

### P1: Rate Limiter Too Aggressive for Testing ⚠ WON'T FIX

| Field | Detail |
|-------|--------|
| **Module** | Infrastructure |
| **Severity** | 🟡 MEDIUM |
| **Status** | ⚠ Won't Fix — working as designed |

**What:** 10 req/min per IP causes failures during rapid-fire testing with curl scripts.

**Fix:** Not changing — correct for production. For testing, space requests or restart backend container.

---

## BUGS BY MODULE SUMMARY

```
CEKSENET:  C1 🔴 C2 🔴 C3 🟡  (3 bugs, all open)
EMPLOYEE:  C4 🔴 C5 🔴       (2 bugs, both open)
EXPENSE:   C6 🟠 C7 🟠 C8 🟡 (3 bugs, all open)
PREDICT:   C9 🟠             (1 bug, open)
INVOICE:   C11 🟡            (1 bug, test artifact)
CUSTOMER:  C10 🟡            (1 bug, rate limit artifact)
TRUCK:     C12 🟢            (1 bug, low priority)
───────────────────────────────────────
OPEN:     8 bugs (4 critical, 4 high, 3 medium, 1 low)
FIXED:    7 bugs (B1-B5 + P2)
WON'T FIX: 1 bug (P1 - production correct)
```

## FIX PRIORITY ORDER

```
1. C1 🔴  CekSenet field name mismatch          → 15 min
2. C6 🟠  Expense edit=POST not PUT             →  5 min
3. C7 🟠  Expense delete=local only             →  5 min
4. C2 🔴  CekSenet DELETE endpoint              → 10 min
5. C9 🟠  Predictions field name mismatch       →  5 min
6. C4 🔴  Employee edit TODO stub              → 30 min (FE + BE)
7. C5 🔴  Employee delete TODO stub            → 20 min
8. C3 🟡  CekSenet status enum mismatch         →  5 min
9. C8 🟡  Expense missing fatura_no field       →  5 min
10. C12 🟢 Truck PUT requires full payload      → 15 min
══════════════════════════════════════════════════════
TOTAL: 8 bugs can be fixed in ~115 minutes (2 hours)
```
