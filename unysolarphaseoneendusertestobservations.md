# Unysol — Phase 1 End User Test Observations

> **Tester:** Trucker perspective (first-time user)
> **Date:** 26 May 2026
> **URL:** https://unysolar.com
> **Test Account:** cinar@test.com / Ege Transport / Anadolu Lojistik

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
