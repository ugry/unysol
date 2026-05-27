# Unysol — Super Admin Panel: Engineer Observations

> **Reviewer:** Senior SaaS Engineer
> **Date:** 27 May 2026
> **URL:** https://unysolar.com/admin
> **Auth:** ugur.yardimci@unygms.com (SUPER_ADMIN)

---

## 1. API Endpoint Status

| Endpoint | HTTP | Data | Issue |
|---|:---:|:---:|---|
| `GET /api/admin/tenants` | 200 | 28 tenants | ✅ |
| `GET /api/admin/tenants/{id}` | 200 | Single tenant | ✅ |
| `GET /api/admin/users` | 200 | 28 users | ✅ |
| `GET /api/admin/email/config` | 200 | SMTP + Stripe config | ✅ |
| `GET /api/admin/stripe/config` | 200 | Keys + Price IDs | ✅ |
| `GET /api/admin/modules` | 200 | **0 modules** | 🔴 Empty |
| `GET /api/admin/countries` | 200 | **0 countries** | 🔴 Empty |
| `GET /api/admin/analytics/mrr` | **500** | Internal Server Error | 🔴 Broken |
| `GET /api/admin/analytics/churn` | **500** | Internal Server Error | 🔴 Broken |
| `GET /api/admin/analytics/growth` | — | Not tested | ⚠️ Likely broken |

---

## 2. Critical Bugs

### 2.1 Analytics Endpoints Return 500
```
GET /api/admin/analytics/mrr → 500
GET /api/admin/analytics/churn → 500
```
**Root cause:** SQL queries in `admin.go` reference columns or tables that don't match the actual DB schema (same pattern as customer/trip column mismatches found earlier). The handlers were written against a planned schema but the deployed database is different.

### 2.2 Modules List Returns Empty
```
GET /api/admin/modules → 200, [] (empty)
```
**Expected:** 22+ seed modules (auth, tenant_mgmt, dashboard, truck_tracking, etc.)
**Root cause:** The `modules` table has no data. The seed SQL (`01-schema.sql`) was supposed to insert 22 modules but may not have been executed, or was executed against a different database.

### 2.3 Countries List Returns Empty
```
GET /api/admin/countries → 200, [] (empty)
```
**Expected:** At minimum TR (Türkiye) should be present.
**Root cause:** Same as modules — seed data not loaded.

### 2.4 Admin Route Rate Limiting
The `/api/admin` routes are inside the `RateLimit(500)` middleware group, sharing the same rate limit bucket as tenant routes. If a tenant user makes 500 mutations, the admin gets blocked too. Architecture: routes should have separate rate limit buckets or admin routes should be unrestricted.

---

## 3. Architecture Observations

### 3.1 Context Passing Works Correctly
```
Auth middleware → JWT parse → context.WithValue(user_id, tenant_id, role, email)
RequireSuperAdmin → GetRole(ctx) → checks for SUPER_ADMIN
```
The middleware chain is clean and follows chi conventions. Role-based access is correctly implemented.

### 3.2 Missing Functionality

| Feature | Status | Priority |
|---------|:---:|:---:|
| Tenant search/filter API param | Missing | 🟠 |
| Pagination on tenant list | Missing | 🟡 |
| Suspend tenant API | Exists but untested | 🟡 |
| Change plan API | Exists but untested | 🟡 |
| Create user API | Exists but untested | 🟡 |
| Audit log for admin actions | Missing | 🟡 |
| Tenant login impersonation | Exists (localStorage) | ✅ |
| Export tenants/users CSV | Missing | 🟢 |

### 3.3 Hardcoded Mock Data
`AdminDashboard.tsx` contains hardcoded mock dashboard data (lines 61-80):
- `toplam_firma: 148` (actual: 28)
- `mrr: 284500` (actual: not calculated)
- Mock chart data with months
The frontend falls back to mock data when API calls fail or when loading. This creates false data that misleads the admin.

### 3.4 Mixed JSON Response Formats
- `GET /api/admin/tenants` → returns array directly
- `POST /api/admin/email/config` → returns `{"success":true,"message":"..."}`
- `POST /api/admin/tenants/{id}/suspend` → unknown format
Inconsistent response shapes make frontend error handling fragile.

---

## 4. Code Quality Notes

### Positive
- Clean chi router structure with route grouping
- JWT auth middleware properly validates and extracts claims
- Rate limiting middleware prevents abuse
- Security headers middleware (CSP, X-Frame-Options) applied globally
- System settings (email, Stripe) stored in DB with admin UI

### Needs Improvement
- No request validation middleware (each handler validates independently or not at all)
- No response envelope standard (`{success, data, error}` vs raw arrays)
- Analytics SQL queries reference non-existent schema columns
- Seed data migration not idempotent — can't re-run after initial deploy
- No audit logging for admin actions (who changed what plan, who suspended whom)

---

## 5. Recommendations

| # | Action | Priority |
|---|--------|:---:|
| 1 | Fix analytics queries (MRR, Churn, Growth) — match actual DB schema | 🔴 |
| 2 | Re-run seed SQL to populate modules + countries tables | 🔴 |
| 3 | Remove hardcoded mock data — show real data or empty state | 🔴 |
| 4 | Separate admin rate limit bucket from tenant routes | 🟠 |
| 5 | Add pagination to tenant/user lists (>28 tenants, will grow) | 🟡 |
| 6 | Standardize JSON response format across all endpoints | 🟡 |
| 7 | Add audit log for admin mutations (plan change, suspend, user create) | 🟡 |
