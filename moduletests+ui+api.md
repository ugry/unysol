# Unysol — Module Tests: API + UI

> **Date:** 27 May 2026
> **User:** uguryardimci82@gmail.com (tenant_id=28, plan=FREE)
> **Method:** API (curl/Python requests) + Playwright UI
> **Base URL:** https://unysolar.com

---

## Test Summary

| Module | Create (5) | List | Status |
|:---|:---:|:---:|:---:|
| **Trucks** | ❌ Limit reached (5/5) | ✅ 5 trucks | Plan limit |
| **Customers** | ✅ 5/5 | ✅ 6 total | Working |
| **Employees** | ✅ 5/5 | ✅ 6 total | Working |
| **Trips** | ✅ 5/5 | ✅ 6 total | Working |
| **Invoices** | ✅ 5/5 | ✅ 5 total | Working |
| **Expenses** | ✅ 5/5 | ✅ 6 total | Working |
| **Çek/Senet** | ✅ 5/5 | ✅ 5 total | Field: `tur` not `type` |
| **Load Board** | ✅ 5/5 | ✅ 6 total | Working |
| **Predictions** | — | ✅ 200 | Data returned |
| **Dashboard** | — | ✅ 200 | KPIs visible |

**Total: 35 records created across 8 modules**

---

## Module Details

### 1. Trucks
- **Status:** ❌ Plan limit (FREE = 5 trucks)
- User already has 5 trucks from previous usage
- Error message: *"Planınız en fazla 5 kamyon eklemenize izin veriyor. Daha fazlası için planınızı yükseltin."*
- **Bug:** Error message is in Turkish but frontend used to show generic message (fixed in v2.13.1)

### 2. Customers
- **Status:** ✅ All 5 created
- IDs: 5, 6, 7, 8, 9
- List returns 6 total (1 pre-existing)
- CRUD working correctly

### 3. Employees
- **Status:** ✅ All 5 created
- IDs: 4, 5, 6, 7, 8
- List returns 6 total
- Drivers created with `rol: DRIVER`

### 4. Trips
- **Status:** ✅ All 5 created
- IDs: 4, 5, 6, 7, 8
- Linked to existing trucks and customers
- Required: truck_id, customer_id, sofor, ucret

### 5. Invoices
- **Status:** ✅ All 5 created
- IDs: 8, 9, 10, 11, 12
- Items with KDV calculation working
- Required: customer_id, items array

### 6. Expenses
- **Status:** ✅ All 5 created
- Categories: YAKIT, BAKIM, LASTIK, TAMIR, SIGORTA
- IDs: 4, 5, 6, 7, 8

### 7. Çek/Senet
- **Status:** ✅ All 5 created (after field name fix)
- IDs: 1, 2, 3, 4, 5
- **Bug found:** Frontend/API mismatch — field is `tur` (Turkish), not `type` or `tip`
- Types: 3x SENET, 2x CEK
- Status defaults to BEKLIYOR

### 8. Load Board
- **Status:** ✅ All 5 created
- IDs: 2, 3, 4, 5, 6
- Types: YUK_VAR, YUK_ARA alternating

### 9. Predictions
- **Status:** ✅ 200 OK
- 12-month forecast data returned

### 10. Dashboard
- **Status:** ✅ 200 OK
- KPIs: 5 trucks, revenue/expense tracking

---

## Bugs Found

| # | Module | Issue | Severity |
|---|--------|-------|:---:|
| 1 | Çek/Senet | API field is `tur` not `type` — frontend likely sends wrong field | 🟠 |
| 2 | Trucks | FREE plan 5 truck limit hit — user needs PRO upgrade | 🟡 |
| 3 | Trips Page | useEffect deleted during quick-create edit (fixed v2.14.1) | 🔴 |
| 4 | Customers List | `fiyat_katalogu` column missing (fixed during test) | 🔴 |

---

## UI Test (Playwright)

| Test | Result |
|:---|:---:|
| Login page loads | ✅ |
| Trips page loads | ✅ |
| 4 API calls fire (trips/trucks/customers/employees) | ✅ |
| Empty state "Henüz sefer" shown | ✅ |
| Loading spinner cleared | ✅ |
| Quick-create dropdowns visible | ✅ |
