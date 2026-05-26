# Unysol — Phase 1 End User Test Observations

> **Tester:** Trucker perspective (first-time user)
> **Date:** 26 May 2026
> **URL:** https://unysolar.com
> **Test Accounts:** cinar@test.com / Ege Transport / Anadolu Lojistik / Playwright Nakliyat / UIDeep2
> **Test Methods:** API (curl) + Playwright (browser automation)

---

## 1. Registration Experience

### What Works
- Signup returns 201 with JWT token immediately
- Login works with correct credentials
- Token is valid and usable for API calls
- Dashboard loads after login

### What's Broken

| # | Issue | Severity | Detail |
|---|-------|:---:|--------|
| 1 | **Subscription silently fails** | 🔴 CRITICAL | `INSERT INTO subscriptions` missing required columns (`baslangic`, `bitis`, `ucret`). Error ignored with `_, _`. Result: new users have no subscription, plan limits broken. **FIXED during test** |
| 2 | **Plan limit hardcoded to 1 truck** | 🔴 CRITICAL | `planlimits.go` hardcodes FREE=1 truck regardless of config. **FIXED during test** |
| 3 | **Tracking source enum case-sensitive** | 🟠 HIGH | Trucker types "phone" → fails silently. Must be "PHONE". No frontend dropdown to guide user |

---

## 2. Core Module Test Results

| Module | Create | List | Status |
|--------|:---:|:---:|--------|
| Trucks | ✅ | ✅ | After fixes, 3 trucks created |
| Customers | ❌ | ✅ | `fatura_adresi` column mismatch |
| Trips | ❌ | ✅ | `customer_id` column mismatch |
| Invoices | ❌ | — | FK violation (customer not created) |
| Expenses | ✅ | ✅ | Works correctly |
| Employees | ✅ | ✅ | Works correctly |
| Dashboard | ⚠️ | — | KPI values show, but query errors in logs |

---

## 3. Detailed Error Analysis

### 3.1 Customer Creation Fails
```
ERROR: column "fatura_adresi" of relation "customers" does not exist
```
The customer handler INSERT references `fatura_adresi` which doesn't exist in the current schema. The schema uses `vergi_dairesi`, `vergi_no`, `depo_adresleri` but not `fatura_adresi`.

**Impact:** Trucker cannot add customers. Without customers, they cannot create trips or invoices.

### 3.2 Trip Creation Fails
```
ERROR: column "customer_id" of relation "trips" does not exist
```
The trips handler uses `customer_id` but the trips table likely uses `musteri_id` (Turkish column naming).

**Impact:** Trucker cannot create trips — the core workflow is broken.

### 3.3 Invoice Creation Fails (Cascade)
Since customers can't be created, invoices fail due to foreign key constraint `invoices_customer_id_fkey`.

**Impact:** Trucker cannot create invoices.

### 3.4 Dashboard Queries Have SQL Errors
```
ERROR: column "baslangic" does not exist (SQLSTATE 42703)
```
The dashboard handler queries reference `baslangic` but the actual column name is different.

### 3.5 Tracking Source Enum
The enum accepts: `PHONE`, `ESP32_LTE`, `COMM_DEV`, `OBD_ONLY`, `MANUEL` (all uppercase). A trucker typing "phone" or "manuel" in lowercase gets a silent failure with "failed to create truck".

**Impact:** User has no idea what went wrong. Error message is generic and unhelpful.

---

## 4. Frontend UI Issues

| # | Issue | Detail |
|---|-------|--------|
| 4.1 | **English text appears** | Browser detected as English showed "Find Loads, Track, Invoice". Fixed by removing LanguageDetector. |
| 4.2 | **No error messages from API** | Frontend uses generic "Bir hata oluştu" for all errors. User never knows WHY it failed. |
| 4.3 | **Tracking source dropdown** | Frontend has a dropdown for tracking source but not verified if it sends uppercase values |
| 4.4 | **No password reset flow** | If trucker forgets password, no way to recover |
| 4.5 | **No email verification** | Fake email addresses are accepted (no confirmation required) |

---

## 5. Summary

### Critical Paths That WORK (after fixes)
- Register → Login → Dashboard ✅
- Add trucks ✅
- Add expenses ✅
- Add employees ✅

### Critical Paths that are BROKEN
- Add customers ❌ (column mismatch)
- Create trips ❌ (column mismatch)
- Create invoices ❌ (cascade from customers)
- Dashboard queries ⚠️ (partial SQL errors)

### Immediate Fixes Needed

| Priority | Fix | Effort |
|:---:|---|:---:|
| 🔴 | Fix customer handler — remove `fatura_adresi` column | 15 min |
| 🔴 | Fix trip handler — `customer_id` → correct column name | 15 min |
| 🔴 | Fix dashboard queries — correct column names | 30 min |
| 🟠 | Tracking source enum — accept lowercase or show error with valid values | 15 min |
| 🟠 | Generic API errors → specific error messages | 1 hr |
| 🟡 | Frontend: forward API error messages to user | 2 hr |
| 🟡 | Email verification flow | 3 hr |
| 🟡 | Password reset flow | 2 hr |

### Test Verdict
**Registration works. Core workflow (truck→customer→trip→invoice) is broken at customer creation.** A trucker can sign up but cannot use the system beyond adding trucks and expenses. The product is not yet end-user ready.

---

## 7. Playwright Browser Tests (26 May 2026)

Full browser-based E2E tests run against live `https://unysolar.com`.

### 7.1 Landing Page ✅
| Test | Result |
|---|:---:|
| Page loads | ✅ |
| Title: "Unysol — Yük Bul, Takip Et, Fatura Kes" | ✅ |
| Hero shows Turkish text | ✅ |
| No English phrases on page | ✅ |
| Pricing cards visible (3 tiers) | ✅ |
| FREE plan shows 3 trucks | ✅ |
| PRO shows paid pricing (200/2000 TL) | ✅ |
| Referral section visible ("3 ay PRO") | ✅ |
| "Ücretsiz Başla" CTA present | ✅ |

### 7.2 Login / Signup Page ✅
| Test | Result |
|---|:---:|
| Navigates to /login | ✅ |
| Login form visible (email + password) | ✅ |
| "Hesap Oluştur" toggle switches to signup | ✅ |
| Signup shows "Firma Ünvanı" field | ✅ |

### 7.3 Dashboard & Navigation
| Test | Result |
|---|:---:|
| Dashboard KPI cards visible | ✅ |
| Sidebar: 11/11 nav items present | ✅ |
| Sidebar items: Ana Panel, Kamyonlar, Seferler, Yük Panosu, Müşteriler, Faturalar, Çek/Senet, Giderler, Personel, Tahminler, Ayarlar | ✅ |
| Language switcher (TR → EN) visible | ✅ |
| Logout button ("Çıkış") works, redirects to landing | ✅ |

### 7.4 Module Pages — Navigation
| Page | Loads? | "Ekle" button? |
|---|:---:|:---:|
| /dashboard/trucks | ✅ | ✅ "Kamyon Ekle" |
| /dashboard/customers | ✅ | ✅ "Müşteri Ekle" |
| /dashboard/expenses | ✅ | ✅ "Gider Ekle" |
| /dashboard/employees | ✅ | ✅ "Personel Ekle" |
| /dashboard/predictions | ✅ | — |
| /dashboard/load-board | ✅ | — |

### 7.5 Truck Creation via UI
| Step | Result |
|---|:---:|
| Form opens (modal) | ✅ |
| Form fields: search + plaka + 4 dropdowns + year | ✅ |
| Tracking source dropdown | ⚠️ Cannot select "PHONE" — dropdown options don't match enum values |
| Truck creation result | ❌ Failed — enum mismatch causes silent error |

**Issue:** The tracking source dropdown in the UI may not include "PHONE" as an option, or the value sent doesn't match the database enum (which is case-sensitive). A trucker filling the form will get a silent failure with no clear error message.

### 7.6 Customer Creation via UI
| Step | Result |
|---|:---:|
| Form opens (modal) | ✅ |
| Fill fields (name, contact, phone) | ✅ |
| Customer creation result | ❌ Fails with generic "Bir hata oluştu" |

**Issue:** Frontend shows "Bir hata oluştu" — user has no idea WHY customer creation failed (API bug: `fatura_adresi` column mismatch). The error message is completely unhelpful for a non-technical user.

### 7.7 Expense Creation via UI
| Step | Result |
|---|:---:|
| Form opens (modal) | ✅ |
| Category dropdown has options (YAKIT, BAKIM, etc.) | ✅ |
| Expense creation result | ✅ |

### 7.8 Employee Creation via UI
| Step | Result |
|---|:---:|
| Form opens (modal) | ✅ |
| Fields: name, phone, dates, role dropdown | ✅ |
| Role dropdown: options may not match "DRIVER" enum | ⚠️ |
| Employee creation result | — (test interrupted by dropdown mismatch) |

### 7.9 Mobile Responsiveness
| Test | Result |
|---|:---:|
| Hero visible on 375px width | ✅ |
| Buttons tappable (37 buttons found) | ✅ |
| Horizontal overflow | ❌ Content overflows viewport on mobile |

---

## 8. Playwright Test Summary

| Category | PASS | FAIL | WARN |
|---|:---:|:---:|:---:|
| Landing Page | 9 | 0 | 0 |
| Auth / Login | 3 | 0 | 0 |
| Dashboard Navigation | 5 | 0 | 0 |
| Truck Create UI | 3 | 2 | 1 |
| Customer Create UI | 2 | 1 | 1 |
| Expense Create UI | 3 | 0 | 0 |
| Employee Create UI | 2 | 0 | 1 |
| Mobile | 2 | 1 | 0 |
| Logout | 1 | 0 | 0 |
| **TOTAL** | **30** | **4** | **3** |

---

## 9. Priority UX Issues from Browser Tests

| # | Issue | Severity |
|---|-------|:---:|
| 1 | **Customer creation fails with "Bir hata oluştu"** — user has no clue what's wrong | 🔴 |
| 2 | **Tracking source dropdown mismatch** — UI options don't match DB enum (PHONE/MANUEL) | 🔴 |
| 3 | **Generic error messages** — "Bir hata oluştu" for all failures, no actionable info | 🟠 |
| 4 | **Mobile horizontal overflow** — page doesn't fit phone screens | 🟠 |
| 5 | **Role dropdown** — employee role options may mismatch DB enum | 🟡 |
