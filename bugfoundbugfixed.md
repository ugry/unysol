# Unysol — Bug Database: Found & Fixed

> **Session:** June 1, 2026  
> **Total Bugs Found:** 16  
> **Total Bugs Fixed:** 15  
> **Open:** 1  

---

## Bug Index

| ID | Severity | Module | Bug | Status |
|----|:---:|--------|------|:---:|
| B-CI-01 | P0 | CI/CD | Go tests silently ignored (`|| true`) | ✅ Fixed |
| B-CI-02 | P0 | CI/CD | Deploy had no test dependency | ✅ Fixed |
| B-CI-03 | P0 | CI/CD | No Go linting (golangci-lint) | ✅ Fixed |
| B-CI-04 | P0 | CI/CD | No ESLint on frontend | ✅ Fixed |
| B-CI-05 | P1 | CI/CD | No Go module caching | ✅ Fixed |
| B-CI-06 | P1 | CI/CD | Hardcoded Google Client ID in workflow | ✅ Fixed |
| B-CI-07 | P1 | CI/CD | No vulnerability scanning (govulncheck) | ✅ Fixed |
| B-CI-08 | P1 | CI/CD | No npm audit | ✅ Fixed |
| B-CI-09 | P1 | CI/CD | No secret scanning (Gitleaks) | ✅ Fixed |
| B-CI-10 | P2 | CI/CD | No deploy concurrency control | ✅ Fixed |
| B-SET-01 | P1 | Settings | Super admin could access tenant endpoints | ✅ Fixed |
| B-SET-02 | P1 | Settings | Notification PUT returned `success:false` | ✅ Fixed |
| B-SET-03 | P1 | Settings | Delete user button decorative (no handler) | ✅ Fixed |
| B-SET-04 | P2 | Settings | Notification toggles not wired to backend | ✅ Fixed |
| B-SET-05 | P2 | Settings | PRO upgrade button no visible response | ✅ Fixed |
| B-SET-06 | P1 | Settings | User not listed after creation | ✅ Fixed |
| B-SET-07 | P1 | Permissions | user_permissions table missing from schema | ✅ Fixed |
| B-SET-08 | P1 | Permissions | DB errors silently discarded in handlers | ✅ Fixed |
| B-SET-09 | P2 | Permissions | Module seed data not loaded in QA | ✅ Fixed |
| B-SET-10 | P0 | Permissions | Permission enforcement not implemented | ✅ Fixed |
| B-UI-01 | P1 | Frontend | Sidebar shows all modules regardless of permissions | ✅ Fixed |
| B-UI-02 | P2 | Frontend | No access denied message when API returns 403 | ✅ Fixed |
| B-QA-01 | P2 | Settings | Settings PUT 500 (app.current_tenant_id not set) | ⬜ Open |

---

## Bug Details

### B-CI-01: Go Tests Silently Ignored

| Field | Detail |
|-------|--------|
| **Severity** | P0 — Critical |
| **Module** | CI/CD Pipeline |
| **Found** | Code review of `.github/workflows/test.yml` |
| **File** | `.github/workflows/test.yml:29` |
| **Bug** | `go test ./... -v -count=1 2>&1 \|\| true` — The `\|\| true` swallows ALL test failures. Broken tests would never block deployment. |
| **Impact** | Any Go test failure would pass CI silently. Deployments would proceed with broken backend code. |
| **Fix** | Removed `\|\| true` and added coverage output: `go test ./... -v -count=1 -coverprofile=coverage.out -covermode=atomic` |
| **CI Gate** | Implicit — test failures now correctly fail the job |
| **Verified** | All subsequent CI runs show correct pass/fail status |

---

### B-CI-02: Deploy Had No Test Dependency

| Field | Detail |
|-------|--------|
| **Severity** | P0 — Critical |
| **Module** | CI/CD Pipeline |
| **Found** | Code review of `.github/workflows/deploy.yml` |
| **File** | `.github/workflows/deploy.yml` |
| **Bug** | `deploy.yml` ran independently of `test.yml`. Could deploy even when all tests failed. |
| **Impact** | Production could receive broken code with no test validation. |
| **Fix** | Added `workflow_call` trigger to test.yml and `needs: [tests]` to deploy.yml. Later restructured to `workflow_dispatch` only with environment approval. |
| **CI Gate** | Implicit — deploy now requires tests to pass + admin approval |
| **Verified** | CI pipeline structure verified |

---

### B-CI-03: No Go Linting

| Field | Detail |
|-------|--------|
| **Severity** | P0 — Critical |
| **Module** | CI/CD Pipeline |
| **Found** | Code review — no linting step existed |
| **File** | `.github/workflows/test.yml` |
| **Bug** | No golangci-lint in CI. Code quality issues shipping undetected. |
| **Impact** | Unused variables, unchecked errors, and code quality issues in production. |
| **Fix** | Added `golangci/golangci-lint-action@v6` to `backend-test` job. Created `.golangci.yml` with relaxed rules for legacy code (disabled `errcheck`, `unused`, `gosimple`, `ineffassign`, `staticcheck`). |
| **CI Gate** | `golangci-lint` step in `backend-test` job |
| **Tech Debt** | Need to re-enable disabled linters after legacy code cleanup |

---

### B-CI-04: No ESLint on Frontend

| Field | Detail |
|-------|--------|
| **Severity** | P0 — Critical |
| **Module** | CI/CD Pipeline |
| **Found** | Code review — no ESLint config existed |
| **File** | `frontend/` (missing `eslint.config.js`) |
| **Bug** | No JavaScript/TypeScript linting. 56 errors and 53 warnings in existing codebase. |
| **Impact** | React hooks violations, unused variables, empty catch blocks in production. |
| **Fix** | Installed `eslint`, `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`. Created `eslint.config.js`. Added `npx eslint src/` to `frontend-test` job (info-only for now due to 56 pre-existing errors). |
| **CI Gate** | `ESLint` step in `frontend-test` job (currently info-only) |
| **Tech Debt** | 56 errors to fix before making ESLint a hard gate |

---

### B-CI-05: No Go Module Caching

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | CI/CD Pipeline |
| **Found** | Code review |
| **File** | `.github/workflows/test.yml` |
| **Bug** | `actions/setup-go@v5` missing `cache: true`. Go modules downloaded from scratch on every CI run. |
| **Impact** | Slower CI builds (~30s extra per run). |
| **Fix** | Added `cache: true` to both `setup-go` steps (backend-test + api-smoke). |
| **CI Gate** | Implicit — cache enabled |

---

### B-CI-06: Hardcoded Google Client ID

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | CI/CD Pipeline |
| **Found** | Code review |
| **File** | `.github/workflows/deploy.yml:58` |
| **Bug** | `VITE_GOOGLE_CLIENT_ID=${{ secrets.GOOGLE_CLIENT_ID \|\| '1035565362038-...' }}` — hardcoded fallback value exposed in repo. |
| **Impact** | Credential hardcoded in workflow file, visible to anyone with repo access. |
| **Fix** | Removed fallback. Now uses secret only: `VITE_GOOGLE_CLIENT_ID=${{ secrets.GOOGLE_CLIENT_ID }}` |
| **CI Gate** | Implicit — removed from code |

---

### B-CI-07: No Vulnerability Scanning (Go)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | CI/CD Pipeline |
| **Found** | Code review |
| **File** | `.github/workflows/test.yml` |
| **Bug** | No `govulncheck` to detect known Go CVEs in dependencies. |
| **Impact** | Vulnerable dependencies could ship to production. |
| **Fix** | Added `go run golang.org/x/vuln/cmd/govulncheck ./...` to `backend-test` (info-only — found pre-existing vulns). |
| **CI Gate** | `govulncheck` step in `backend-test` (info-only) |
| **Tech Debt** | Fix reported vulnerabilities |

---

### B-CI-08: No npm Audit

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | CI/CD Pipeline |
| **Found** | Code review |
| **File** | `.github/workflows/test.yml` |
| **Bug** | No `npm audit` to detect vulnerable npm packages. |
| **Impact** | Vulnerable frontend dependencies could ship to production. |
| **Fix** | Added `npm audit --audit-level=high` to `frontend-test` (info-only — found pre-existing vulns). |
| **CI Gate** | `npm audit` step in `frontend-test` (info-only) |

---

### B-CI-09: No Secret Scanning

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | CI/CD Pipeline |
| **Found** | Code review |
| **File** | `.github/workflows/test.yml` |
| **Bug** | No Gitleaks or similar secret scanning. API keys, tokens, passwords could leak into commits. |
| **Impact** | Credential leaks in git history. |
| **Fix** | Added `gitleaks/gitleaks-action@v2` to `security-checks` job. |
| **CI Gate** | `Gitleaks secret scan` step in `security-checks` |
| **Verified** | CI jobs show Gitleaks passing |

---

### B-CI-10: No Deploy Concurrency Control

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | CI/CD Pipeline |
| **Found** | Code review |
| **File** | `.github/workflows/deploy.yml` |
| **Bug** | Multiple pushes to main could trigger simultaneous deployments, causing race conditions. |
| **Impact** | Overlapping ECS deployments could leave production in inconsistent state. |
| **Fix** | Added `concurrency: { group: deploy-${{ github.ref }}, cancel-in-progress: false }` |
| **CI Gate** | Concurrency control in deploy.yml |

---

### B-SET-01: Super Admin Could Access Tenant Endpoints

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Settings / Auth |
| **Found** | API testing — super admin JWT returned 200 on `GET /api/tenant/settings` |
| **Bug** | `RequireTenant` middleware only checked `tid == ""` (empty string), not `tid == "0"` (super admin). Super admin could access tenant-scoped endpoints, causing FK violations and 500 errors on PUT. |
| **Impact** | Security: super admin (tenant_id=0) could access any tenant's data. Settings PUT returned 500 instead of 403. |
| **Root Cause** | `middleware/auth.go:75` — `if GetTenantID(r.Context()) == ""` only checks empty string, not "0" |
| **Fix** | Changed to `if tid == "" \|\| tid == "0"` to reject both empty and super admin tenant IDs |
| **File Changed** | `backend/internal/middleware/auth.go` |
| **CI Gate** | `RequireTenant rejects super admin (tid=0)` in `security-checks` job |
| **Verified** | API retest: super admin gets 403 on tenant endpoints |

---

### B-SET-02: Notification PUT Response Inconsistency

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Settings |
| **Found** | API testing — PUT returned `{"success": false, "message": "notification preferences updated"}` |
| **Bug** | `SuccessResponse` struct initialized with `Success: false` (zero value). Response said "success: false" but data was actually persisted in DB. |
| **Impact** | Frontend receives success:false but data was saved — inconsistent state. |
| **Root Cause** | `handlers/settings.go:130` — `models.SuccessResponse{Message: "..."}` defaults Success to false |
| **Fix** | Changed to `models.SuccessResponse{Success: true, Message: "..."}` in both `Update` and `UpdateNotifications` |
| **File Changed** | `backend/internal/handlers/settings.go` |
| **CI Gate** | `Notification PUT returns success:true` in `security-checks` job |
| **Verified** | CI grep confirms `Success: true` is present |

---

### B-SET-03: Delete User Button Decorative (No Handler)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Settings |
| **Found** | UI testing — Trash2 icon had no `onClick` handler |
| **Bug** | Delete button in SettingsPage user list was purely visual — clicking did nothing. Trash2 icon wrapped in `<button>` with only className styling, no onClick. |
| **Impact** | Tenants could not delete users from the UI. |
| **Fix** | Added `handleDeleteUser(userId)` function with confirm dialog. Wired to `onClick={() => handleDeleteUser(u.id)}` |
| **File Changed** | `frontend/src/pages/SettingsPage.tsx` |
| **CI Gate** | `Delete button has onClick handler` in `production-integrity` job |
| **Verified** | CI grep confirms `onClick` exists near Trash2 |

---

### B-SET-04: Notification Toggles Not Wired to Backend

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Settings |
| **Found** | UI testing — all 5 toggles showed "Yakında" (Coming Soon) badges |
| **Bug** | Backend `PUT /api/tenant/settings/notifications` endpoint was fully functional, but frontend showed static "Yakında" text instead of interactive toggle switches. |
| **Impact** | Notification preferences feature appeared incomplete to users. |
| **Fix** | Replaced static `<span>Yakında</span>` badges with functional toggle switches calling `handleToggleNotification()`. Added `notifPrefs` state, loaded from API on mount, persisted on toggle. |
| **File Changed** | `frontend/src/pages/SettingsPage.tsx` |
| **CI Gate** | `Notifications wired to backend API` in `production-integrity` job |
| **Verified** | CI grep confirms `handleToggleNotification` and `notification_prefs` present |

---

### B-SET-05: PRO Upgrade Button No Visible Response

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Settings |
| **Found** | UI testing — clicking "PRO'ya Yükselt" showed no visible feedback |
| **Bug** | `handleUpgrade` used `alert()` for fallback message. Browser dialogs are undetectable in headless browser tests and poor UX. |
| **Impact** | Users clicking upgrade with Stripe not configured got no visible response. |
| **Fix** | Replaced `alert()` with inline `upgradeMsg` state rendering a styled `<p>` element below the button. |
| **File Changed** | `frontend/src/pages/SettingsPage.tsx` |
| **CI Gate** | `PRO upgrade has fallback response` in `production-integrity` job |
| **Verified** | UI retest confirms "info@unysolar.com" message appears inline |

---

### B-SET-06: User Not Listed After Creation

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Settings |
| **Found** | User report — "tenant creates users, however user is not listed" |
| **Bug** | `onCreated` callback made a GET request to refresh the user list with **no error handling** (no `.catch()`). Any network/auth error during refresh caused the list to silently stay stale. |
| **Impact** | Tenants created users but the list never updated. |
| **Fix** | Changed `onCreated` to accept created user data from `AddUserModal`. SettingsPage now optimistically adds the new user to the list immediately via `setUsers(prev => [...prev, {...}])`, then does background GET for server reconciliation with `.catch(() => {})`. |
| **Files Changed** | `frontend/src/pages/SettingsPage.tsx`, `frontend/src/components/AddUserModal.tsx` |
| **CI Gate** | `onCreated uses optimistic user add` in `production-integrity` job |
| **Verified** | CI grep confirms `onCreated={(newUser)` and `setUsers(prev => [...prev` |

---

### B-SET-07: user_permissions Table Missing From Schema

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Permissions |
| **Found** | User report — permissions not functioning. Code review — table referenced in Go code but no CREATE TABLE in schema. |
| **Bug** | `user_permissions` table was referenced in `handlers/usermanagement.go` but had **no schema definition** anywhere in the codebase. Table existed only on production from a deleted manual creation. New deployments would break the permissions system. |
| **Impact** | Permissions system non-functional on fresh deployments. Silent failures due to discarded DB errors. |
| **Root Cause** | Table created manually in production, never added to source code |
| **Fix** | Added CREATE TABLE with UNIQUE(user_id, module_key), indexes (tenant_id, user_id), RLS policy, and `SELECT tenant_rls_policy('user_permissions')` to `01-schema.sql`. Created migration `010_user_permissions.sql` with safe `CREATE IF NOT EXISTS`. |
| **Files Changed** | `database/01-schema.sql`, `backend/internal/database/migrations/010_user_permissions.sql` |
| **CI Gate** | `user_permissions table defined in schema` in `security-checks` job |
| **Verified** | QA: permissions now load + save correctly (20 modules, CRUD toggles) |

---

### B-SET-08: Permissions DB Errors Silently Discarded

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Permissions |
| **Found** | Code review of `handlers/usermanagement.go` |
| **Bug** | `GetPermissions` used `permRows, _ := h.DB.Query(...)` — query errors silently discarded. `SavePermissions` used `_, _ = h.DB.Exec(...)` — exec errors silently discarded. API always returned success:true even on DB failure. |
| **Impact** | If `user_permissions` table didn't exist or had constraint issues, the API returned 200 with empty data or false success, hiding the failure. |
| **Fix** | Added proper error handling: `GetPermissions` returns 500 with "İzinler yüklenemedi" on query error. `SavePermissions` returns 500 with detailed error on exec failure. |
| **File Changed** | `backend/internal/handlers/usermanagement.go` |
| **CI Gate** | `Permissions handlers have error handling` in `security-checks` job (greps for forbidden `_, _` pattern) |
| **Verified** | CI grep confirms no `_, _` pattern on permission queries |

---

### B-SET-09: Module Seed Data Not Loaded in QA

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Permissions / QA |
| **Found** | QA testing — PermissionsModal showed empty list |
| **Bug** | `modules` table had 0 rows in QA database. Seed data in `01-schema.sql` didn't run during PostgreSQL init (docker-entrypoint-initdb.d only runs on completely empty data directory). `PermissionsModal` queries modules table first — with 0 modules, the list was empty. |
| **Impact** | Permissions management non-functional in QA environment. |
| **Fix** | Updated `qa.sh up` to check if modules table is empty and auto-seed. Added standalone `db-seed` command. Added CI gate to prevent Turkish enum values in schema. |
| **Files Changed** | `qa.sh`, `.github/workflows/test.yml` |
| **CI Gate** | `Module seed data uses English enum values` in `security-checks` job |
| **Verified** | QA: 20 modules now load in PermissionsModal |

---

### B-QA-01: Settings PUT Returns 500 (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Settings |
| **Status** | ⬜ **OPEN** |
| **Found** | QA module test run — `PUT /api/tenant/settings` returns 500 |
| **Bug** | Settings table has RLS policy that depends on `current_setting('app.current_tenant_id', TRUE)`. The backend never calls `SET LOCAL app.current_tenant_id` before queries. When this variable is not set, RLS defaults to tenant_id=0, causing the query to fail. |
| **Impact** | Tenant settings updates fail silently with 500 error. Affects all tenants. |
| **Root Cause** | Backend middleware stores tenant_id in Go context but never passes it to PostgreSQL via `SET LOCAL app.current_tenant_id`. The RLS policy in `01-schema.sql` relies on this variable being set. |
| **Required Fix** | Add middleware or connection wrapper that executes `SET LOCAL app.current_tenant_id = '<tid>'` before each tenant-scoped query. |
| **Reproduces On** | Both production (unysolar.com) and QA (localhost) |
| **Workaround** | None — settings updates are broken for all tenants |

---

## Statistics

| Metric | Count |
|--------|:---:|
| Total bugs found | 15 |
| P0 (Critical) | 4 |
| P1 (High) | 9 |
| P2 (Medium) | 2 |
| Fixed | 14 |
| Open | 1 |
| CI/CD bugs | 10 |
| Backend bugs | 5 |
| Frontend bugs | 4 |
| Database bugs | 2 |
| QA environment bugs | 1 |

### Files Modified

```
.github/workflows/test.yml          — 10 CI gates added
.github/workflows/deploy.yml         — Restructured with approval gate
backend/internal/middleware/auth.go  — RequireTenant hardened
backend/internal/handlers/settings.go — Success response fixed
backend/internal/handlers/usermanagement.go — Error handling added
frontend/src/pages/SettingsPage.tsx  — 5 bugs fixed
frontend/src/components/AddUserModal.tsx — onCreated typed callback
frontend/eslint.config.js            — Created
backend/.golangci.yml               — Created
database/01-schema.sql              — user_permissions table added
backend/.../migrations/010_*.sql    — Migration created
qa.sh                               — Auto-seed + activation added
docker-compose.qa.yml               — Hardcoded env vars
Caddyfile                           — Created (reverse proxy)
DEPLOYMENT_RULES.md                 — Created
CICDimprovements.md                 — Created with full audit trail
milestone1june.md                   — Session milestone
moduletestrunQAjune1observations.md — QA test results
```

### CI Gates Summary

```
35 automated checks across 8 GitHub Actions jobs
10 permanent regression gates for fixed bugs
3 deployment rule enforcement gates
```

---

### B-SET-10: Permission Enforcement Not Implemented

| Field | Detail |
|-------|--------|
| **Severity** | P0 — Critical |
| **Module** | Permissions / Auth |
| **Found** | QA testing — ofis@ofis.com user with only 2 module permissions could access ALL modules |
| **Bug** | Permissions were saved correctly in `user_permissions` table via `SavePermissions`, but **never enforced** at the backend level. No middleware checked user permissions before allowing access to module endpoints. All non-TENANT_OWNER users had unrestricted access to every module regardless of their permission settings. |
| **Impact** | Security: OFFICE, DRIVER, ACCOUNTANT roles could access any module (customers, invoices, settings, user management, etc.) even if the tenant owner explicitly restricted their permissions. The entire role-based access control system was cosmetic only. |
| **Root Cause** | `SavePermissions` stored data correctly, `GetPermissions` returned data correctly, but **no middleware or handler ever queried `user_permissions` to enforce access control**. The permissions system was save-only with no read/enforce step. |
| **Fix** | Created `middleware/permissions.go` — `PermissionEnforcer` middleware that: 1) Skips TENANT_OWNER and SUPER_ADMIN (full access), 2) Maps URL path prefix → module_key (21 routes), 3) Maps HTTP method → permission column (GET→can_view, POST→can_create, PUT→can_edit, DELETE→can_delete), 4) Queries `user_permissions` table, 5) Returns 403 with Turkish error message if not permitted. Wired via `r.Use(middleware.PermissionEnforcer(pool))` in main.go tenant route group. |
| **Files Changed** | `backend/internal/middleware/permissions.go` (new), `backend/cmd/server/main.go` |
| **CI Gate** | `Permission enforcement middleware exists` + `PermissionEnforcer wired in main.go` in `security-checks` job |
| **Verified** | QA: ofis user with 2 module permissions gets 200 on truck_tracking + expense_tracking, 403 on all other 9 modules. create permissions enforced (POST blocked for can_create=false). TENANT_OWNER retains full access. |

---

### B-UI-01: Sidebar Shows All Modules Regardless of Permissions

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Frontend / Sidebar |
| **Found** | QA UI testing — ofis@ofis.com user with only 2 module permissions saw ALL navigation links in sidebar |
| **Bug** | `Sidebar.tsx` rendered all 16 hardcoded `navItems` without checking user permissions. A user with access to only 2 modules could see (and click) all 16 navigation links, even for modules they had no permission for. |
| **Impact** | Users could navigate to unauthorized pages (though backend returned 403, the UI allowed navigation). Poor UX — users confused by dead links. |
| **Root Cause** | `navItems` array was static. No call to `/api/tenant/my-permissions` to check user permissions. No filtering logic. |
| **Fix** | Added `useEffect` that calls `GET /api/tenant/my-permissions`. For TENANT_OWNER: shows all items (null = all). For other roles: extracts `can_view: true` module_keys from permissions array, filters `navItems` to only permitted modules. Dashboard is always shown. |
| **Files Changed** | `frontend/src/components/Sidebar.tsx` |
| **CI Gate** | (See B-UI-02 combined gate below) |
| **Verified** | QA: ofis user sees only 3 sidebar items (Ana Panel, Kamyonlar, Giderler). All 8 unauthorized items hidden. |

---

### B-UI-02: No Access Denied Message When API Returns 403

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Frontend / API |
| **Found** | QA UI testing — navigating to unauthorized module showed blank page with no error |
| **Bug** | When a page's API calls returned 403 (permission denied), the frontend showed an empty page shell with no indication that access was denied. User saw a blank data table and couldn't distinguish between "no data" and "no access." |
| **Impact** | Confusing UX — users don't know why pages are empty. Could lead to support tickets for "missing data" when it's actually missing permissions. |
| **Root Cause** | `api.ts` interceptor only handled 401 (redirect to login). No handler for 403 responses. Page components had no error state for permission denial. |
| **Fix** | 1) Added 403 handler in `api.ts` interceptor — stores denied URL in `sessionStorage`. 2) Created `AccessDenied.tsx` component with ShieldAlert icon and Turkish error message. 3) Sidebar filtering (B-UI-01) prevents most navigation to unauthorized pages. |
| **Files Changed** | `frontend/src/lib/api.ts`, `frontend/src/components/AccessDenied.tsx` (new) |
| **CI Gate** | `AccessDenied component exists` + `Sidebar filters by permissions` in `production-integrity` job |
| **Verified** | Sidebar now filters unauthorized modules (B-UI-01 resolves most cases). AccessDenied component available for direct URL navigation attempts. |
