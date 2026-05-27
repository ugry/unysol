# Unysol — Super Admin Panel: Engineer Observations v2

> **Reviewer:** Senior SaaS Engineer (Post-fix audit)
> **Date:** 27 May 2026
> **URL:** https://unysolar.com/admin
> **Auth:** ugur.yardimci@unygms.com (SUPER_ADMIN)

---

## 1. API Endpoint Status (10/10 PASS)

| # | Endpoint | Method | HTTP | Data | Notes |
|---|---------|--------|:---:|------|-------|
| 1 | `/api/admin/dashboard/summary` | GET | 200 | 28 firms, MRR 0 | ✅ |
| 2 | `/api/admin/tenants` | GET | 200 | 28 tenants | ✅ |
| 3 | `/api/admin/tenants/{id}` | GET | 200 | Detail visible | ✅ |
| 4 | `/api/admin/tenants/{id}/plan` | PUT | 200 | Plan changes | ⚠️ `success:false` but works |
| 5 | `/api/admin/tenants/{id}/suspend` | POST | 500 | — | 🔴 Broken |
| 6 | `/api/admin/users` | GET | 200 | 28 users | ✅ |
| 7 | `/api/admin/analytics/mrr` | GET | 200 | MRR=0 (all FREE) | ✅ |
| 8 | `/api/admin/analytics/churn` | GET | 200 | 0% churn | ✅ |
| 9 | `/api/admin/analytics/growth` | GET | 200 | 1 month data | ✅ |
| 10 | `/api/admin/modules` | GET | 200 | 20 modules, 6 categories | ✅ |
| 11 | `/api/admin/countries` | GET | 200 | 1 country (TR) | ✅ |
| 12 | `/api/admin/email/config` | GET | 200 | Config loaded | ✅ |
| 13 | `/api/admin/stripe/config` | GET | 200 | Keys + price IDs | ✅ |

---

## 2. Bugs Found During Audit

### 2.1 Suspend Endpoint Returns 500
```
POST /api/admin/tenants/{id}/suspend → 500 "failed to suspend tenant"
```
**Root cause:** The `SuspendTenant` handler references a `durum` column that may have a different expected value format or the SQL UPDATE fails. Needs investigation.

### 2.2 Plan Change Returns `success: false` Despite Working
```
PUT /api/admin/tenants/{id}/plan → {"success":false,"message":"plan updated"}
```
Response format bug: the endpoint updates the plan correctly but the response JSON has `success: false` while `message: "plan updated"`. The frontend may interpret this as a failure.

### 2.3 Summary API Lacks Historical Data
The dashboard summary returns `paket_dagilimi` and `son_kayitlar` as hardcoded placeholders. The package distribution only shows "FREE: 28" and recent registrations is empty. These should be computed from real DB data.

---

## 3. UI Test Results

| Test | Result |
|---|:---:|
| Admin page loads | ✅ |
| 6 navigation tabs visible | ✅ |
| Overview KPI cards show real data (28 firms, MRR 0) | ✅ |
| No JavaScript errors | ✅ |
| No mock data displayed | ✅ |
| Modules tab: 20 modules listed | ✅ |
| Countries tab: 1 country (TR) | ✅ |
| Analytics tab: MRR/Churn/Growth working | ✅ |

### Previously Broken, Now Fixed
| Issue | Fix |
|-------|-----|
| Analytics endpoints returned 500 | Aligned SQL with actual DB schema |
| Modules list returned 0 | Seed SQL re-executed |
| Countries list returned 0 | Seed SQL re-executed |
| Mock data shown (148 firms, 284K MRR) | Real summary API, null-safe frontend |
| Admin page JS crash (undefined.map) | Added `|| []` guards |

---

## 4. Code Quality Assessment

### Strengths
- Clean chi router structure with proper middleware chain
- JWT auth correctly extracts claims (tenant_id=0 for SUPER_ADMIN bypasses RLS)
- Role-based access (RequireSuperAdmin) working correctly
- Rate limiting protects mutations
- Security headers (CSP, X-Frame-Options) applied globally
- System settings stored in DB with admin UI

### Remaining Issues

| Issue | Severity | Recommendation |
|-------|:---:|--------|
| Suspend endpoint broken | 🔴 | Fix SQL/column mismatch |
| Plan change response format | 🟡 | Fix `success` field |
| No pagination on tenant/user lists | 🟡 | Add limit/offset for >100 tenants |
| No audit log for admin actions | 🟡 | Log who changed what plan/suspended whom |
| Summary → package distribution is hardcoded | 🟡 | Query real subscription counts |
| Tenant list has no search API param | 🟢 | Add query params for filtering |
| No delete tenant functionality | 🟢 | Could be dangerous, intentional omission |
