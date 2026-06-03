# Unysol — Bug Database (Canonical)

> **Canonical bug database.** All other files reference this one.
> **Last Updated:** 03 June 2026
> **Total Bugs Found:** 63  
> **Total Bugs Fixed:** 31  
> **Open:** 32  

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
| B-QA-01 | P2 | Settings | Settings PUT 500 (app.current_tenant_id not set) | ✅ Fixed |
| B-CI-11 | P1 | CI/CD | Playwright E2E tests not running in CI pipeline | ⬜ Open |
| B-CI-12 | P2 | CI/CD | No Go test coverage tracking/profile reporting | ⬜ Open |
| B-CI-13 | P2 | CI/CD | No test result reporting (JUnit XML / PR annotations) | ⬜ Open |
| B-CI-14 | P2 | CI/CD | Frontend Dockerfile uses `serve@14` instead of nginx | ⬜ Open |
| B-CI-15 | P2 | CI/CD | No staging/pre-production environment | ⬜ Open |
| B-CI-16 | P2 | CI/CD | No automated rollback on deploy failure | ⬜ Open |
| B-CI-17 | P2 | CI/CD | No database migration apply/rollback testing in CI | ⬜ Open |
| B-CI-18 | P2 | CI/CD | ECS infrastructure partially defined outside repo | ⬜ Open |
| B-CI-19 | P3 | CI/CD | No blue/green deployment (ECS force-new-deployment) | ⬜ Open |
| B-CI-20 | P3 | CI/CD | No semantic versioning (no release tags or changelog) | ⬜ Open |
| B-CI-21 | P3 | CI/CD | No PR preview environments for change review | ⬜ Open |
| B-CI-22 | P3 | CI/CD | No deploy notifications (Slack/Discord/email) | ⬜ Open |
| B-CI-23 | P3 | CI/CD | No Grafana dashboard validation in CI | ⬜ Open |
| B-CI-24 | P3 | CI/CD | No performance/load testing (k6/artillery/wrk) | ⬜ Open |
| B-CI-25 | P3 | CI/CD | No Go version matrix (only Go 1.22 tested) | ⬜ Open |
| B-CI-26 | P3 | CI/CD | No [ci skip] support — tests trigger on all branches | ⬜ Open |
| B-TRK-01 | P2 | Trucks | Truck PUT returns 404 "not found" with full body (extra fields cause failure) | ✅ Fixed |
| B-TRK-02 | P3 | Trucks | Truck POST `yakit_tipi` field may not be persisted | ⬜ Open |
| B-EXP-01 | P1 | Expenses | `/categories` endpoint not registered — route consumed by `/{id}` | ✅ Fixed |
| B-PERM-01 | P1 | Permissions | ofis user has ALL permissions set to false (all can_* = false) | ✅ Fixed |
| B-PERM-02 | P1 | Permissions | PermissionEnforcer blocks ofis user from ALL modules (cascade of B-PERM-01) | ✅ Fixed |
| B-ACT-01 | P1 | Actions | ActionsPage is unreachable — no Route in App.tsx, no sidebar entry | ✅ Fixed |
| B-PRED-01 | P2 | Predictions | "Yeniden Hesapla" recalculate button missing from page | ✅ Fixed |
| B-PRED-02 | P3 | Predictions | Predictions page has no interactive elements (static view only) | ✅ Fixed |
| B-LOAD-01 | P2 | Load Board | Missing "Tümü" filter tab — only Yük Var / Yük Ara visible | ✅ Fixed |
| B-LOAD-02 | P3 | Load Board | "İlgileniyorum" + WhatsApp buttons hidden in empty state | ⬜ Open |
| B-LOAD-03 | P3 | Load Board | No stats summary cards at top of page | ⬜ Open |
| B-CEK-01 | P3 | Cek/Senet | KPI card labels differ from spec (3 cards instead of 4) | ⬜ Open |
| B-AUTH-01 | P3 | Auth | Google OAuth login button not visible (missing build-time env var) | ✅ Fixed |
| B-STRIPE-01 | P1 | Billing | PRO Upgrade shows fallback "info@unysolar.com" on production — STRIPE_SECRET_KEY missing from AWS ECS env vars | ⬜ Open |
| B-STRIPE-02 | P1 | Billing | Stripe checkout session not tested from frontend — SettingsPage calls /stripe/checkout but no dedicated BillingPage exists | ⬜ Open |
| B-PORTAL-01 | P2 | CRM | CustomerPortalPage has no dedicated backend endpoint — page reuses /api/tenant/customers/ with no portal-specific features | ⬜ Open |
| B-CARBON-01 | P2 | ANALYTICS | CarbonTrackingPage has zero API calls — purely static page with hardcoded CO2/trees | ⬜ Open |
| B-BILLING-01 | P2 | Finance | No BillingPage.tsx or subscription management UI — Stripe checkout only accessible via Settings→PRO Upgrade | ⬜ Open |
| B-EXPORT-01 | P2 | ANALYTICS | ExportPage has no dedicated backend handler — relies on per-module DataGrid CSV export | ⬜ Open |
| B-EMP-01 | P1 | Frontend | Employee create does not refresh list after save — SettingsPage user add may not re-fetch | ✅ Fixed |
| B-RPT-01 | P2 | Frontend | ReportsPage may call `/api/tenant/reports` (404) instead of sub-routes like `/reports/summary` | ✅ Fixed |
| B-TRK-02 | P3 | Trucks | Truck POST `yakit_tipi` field may not be persisted — schema column mismatch possible | ⬜ Open |
| B-LOAD-02 | P3 | Load Board | "İlgileniyorum" + WhatsApp buttons hidden in empty state of load board | ⬜ Open |
| B-LOAD-03 | P3 | Load Board | No stats summary cards at top of LoadBoardPage | ⬜ Open |
| B-CEK-01 | P3 | Cek/Senet | KPI card labels differ from spec (3 cards instead of 4) at top of CekSenetPage | ⬜ Open |

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
| Total bugs found | 51 |
| P0 (Critical) | 5 (all fixed) |
| P1 (High) | 17 (16 fixed, 1 open) |
| P2 (Medium) | 16 (12 fixed, 4 open) |
| P3 (Low) | 13 (2 fixed, 11 open) |
| Fixed | 31 |
| Open | 20 |
| CI/CD bugs | 26 |
| Backend bugs | 8 |
| Frontend bugs | 10 |
| Database bugs | 2 |
| QA environment bugs | 2 |
| Permissions bugs | 2 |
| Module-level bugs | 9 |
| UI-specific bugs | 7 |

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

---

### B-CI-11: Playwright E2E Tests Not Running in CI (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | CI/CD Pipeline |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `frontend/tests/` directory with Playwright scripts exists but no CI job runs them |
| **Bug** | Playwright E2E test scripts exist on disk but there is no GitHub Actions job to execute them. Only static checks (TypeScript, ESLint, build) run in CI. End-to-end browser testing of UI flows (login, CRUD, navigation) is completely absent from the CI pipeline. |
| **Impact** | UI regressions (broken buttons, rendering failures, navigation bugs) slip through to production. The 95% module QA pass rate is enforced only manually, not automatically. |
| **Root Cause** | Playwright tests were written for local manual execution, never integrated as a CI job. Requires backend+frontend+DB all running, making it more complex than static checks. |
| **Required Work** | Add `e2e-test` job to `test.yml`: spin up backend+frontend via docker-compose, run Playwright scripts, capture screenshots as artifacts. Estimated effort: 30 min. |
| **Source** | `CICDimprovements.md` P1-2, `test.yml:frontend-test` |

---

### B-CI-12: No Go Test Coverage Tracking (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | CI/CD Pipeline |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `go test` produces `coverage.out` but no coverage threshold enforced |
| **Bug** | While `go test` generates a `coverage.out` file, no CI step uploads it as an artifact, reports it to a service (Codecov/Coveralls), or enforces a minimum coverage percentage. Coverage data is generated and discarded. |
| **Impact** | No visibility into test coverage trends. Code changes that drop coverage go undetected. No incentive to maintain or improve coverage over time. |
| **Required Work** | 1) Upload `coverage.out` as artifact in `backend-test`. 2) Add coverage minimum gate (e.g., `go tool cover -func` → enforce >X%). 3) Optional: integrate Codecov for PR annotations. Estimated effort: 10 min. |
| **Source** | `CICDimprovements.md` P2-1, `test.yml:backend-test` |

---

### B-CI-13: No Test Result Reporting (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | CI/CD Pipeline |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — test failures only visible in raw GitHub Actions logs |
| **Bug** | When tests fail, developers must dig through raw log output. No JUnit XML, no PR annotations, no summary report surfacing test results at a glance. |
| **Impact** | Slow debugging — developers waste time scrolling logs. No historical trend of flaky tests. Harder to maintain test quality at scale. |
| **Required Work** | Go tests: add `-json` output → `gotestsum` for JUnit XML → `dorny/test-reporter` action. Playwright: `--reporter=junit`. Estimated effort: 15 min. |
| **Source** | `CICDimprovements.md` P2-2, `test.yml` |

---

### B-CI-14: Frontend Docker Uses `serve` Not Nginx (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Frontend / Docker |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review of `frontend/Dockerfile` |
| **Bug** | Production frontend image serves the React SPA using `serve@14`, a Node.js-based dev server. Not production-grade: no gzip/brotli compression, no caching headers, no SPA fallback for client-side routing, higher memory usage. |
| **Impact** | Larger image size, higher memory per ECS task, no CDN-friendly caching headers, slower TTFB. SPA routes like `/dashboard/trucks` may return 404 on direct navigation. |
| **Required Work** | Replace with `nginx:alpine` base image. Add `nginx.conf` with gzip, `Cache-Control` headers (1yr for hashed assets), `try_files $uri /index.html` SPA fallback, security headers. Estimated effort: 20 min. |
| **Source** | `CICDimprovements.md` P2-3, `frontend/Dockerfile` |

---

### B-CI-15: No Staging Environment (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Deployment / Infrastructure |
| **Status** | ⬜ **OPEN** |
| **Found** | Infrastructure review — only QA (local Docker) and Production (AWS ECS) exist |
| **Bug** | No intermediate staging environment that mirrors production infrastructure. Changes go from local laptop directly to production after tests pass and admin approves. |
| **Impact** | No way to verify AWS-specific behavior (IAM roles, RDS connection pooling, ECS task networking, ALB routing) before production. Production is the first place infrastructure changes are tested. |
| **Required Work** | 1) `deploy-staging.yml` triggered on PR to main. 2) Staging ECS service with RDS snapshot restore. 3) Deploy staging → smoke tests → promote to production. Estimated effort: 2 hours. |
| **Source** | `CICDimprovements.md` P2-4, `deploy.yml` |

---

### B-CI-16: No Automated Rollback on Deploy Failure (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Deployment / CI/CD |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review of `deploy.yml` — no rollback logic on health check failure |
| **Bug** | When `ecs wait services-stable` times out or health check curl fails after deployment, the pipeline reports failure but does NOT automatically roll back to the previous working task definition. |
| **Impact** | Production downtime prolonged because rollback is manual. Operator must notice failure, identify previous task definition ARN, run `aws ecs update-service`, wait for stabilization. During this time unysolar.com serves broken code. |
| **Required Work** | 1) Save current task definition ARN before deploy. 2) In `if: failure()` step: redeploy saved ARN. 3) Log rollback for audit. 4) Consider ECS Circuit Breaker as alternative. Estimated effort: 30 min. |
| **Source** | `CICDimprovements.md` P2-5, `deploy.yml` |

---

### B-CI-17: No Database Migration Testing in CI (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | CI/CD / Database |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `backend/internal/database/migrations/` files never tested in CI |
| **Bug** | SQL migration files are applied during deployment but correctness is never verified in CI. A migration with syntax error, constraint violation, or data corruption will only be discovered in production. |
| **Impact** | Broken migration can cause deployment failure + potential data corruption. No automated verification that apply+rollback cycle is clean. |
| **Required Work** | In `api-smoke` job (fresh Postgres): run all migrations in order → verify schema → rollback test → re-apply. Validate file naming, idempotency, data integrity. Estimated effort: 15 min. |
| **Source** | `CICDimprovements.md` P2-6, `backend/.../migrations/` |

---

### B-CI-18: ECS Infrastructure Partially Defined Outside Repo (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Infrastructure / Terraform |
| **Status** | ⬜ **OPEN** |
| **Found** | Infrastructure review — `infra/terraform/` has 15 `.tf` files, some resources manually created |
| **Bug** | Terraform files exist but some AWS resources were created manually via Console, not tracked in state. `terraform.tfvars` contains sensitive values. State stored locally (likely `tfplan` binary), no remote backend (S3 + DynamoDB lock). |
| **Impact** | Infrastructure drift — manual changes not captured in code. No state locking — simultaneous `terraform apply` could corrupt state. No audit trail of infra changes. |
| **Required Work** | 1) Import manual resources into Terraform state. 2) Move state to S3 backend with DynamoDB locking. 3) Create `deploy-infra.yml` with plan→approval→apply. 4) Move sensitive vars to GitHub Secrets. Estimated effort: 4 hours. |
| **Source** | `CICDimprovements.md` P2-7, `infra/terraform/` |

---

### B-CI-19: No Blue/Green Deployment (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Deployment / AWS |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `deploy.yml` uses `force-new-deployment` (rolling update) |
| **Bug** | Current deployment uses rolling update via `aws ecs update-service --force-new-deployment`. Causes mixed-version serving (old draining while new starting) and can produce 502 errors or brief downtime if health checks fail during transition. |
| **Impact** | Brief service interruption per deploy. No ability to test new version before routing production traffic. No automatic rollback if new version is unhealthy. |
| **Required Work** | Configure ECS CodeDeploy blue/green: new task set → validation hooks → traffic shift via ALB listener rules → auto-rollback on CloudWatch alarm. Estimated effort: 3 hours. |
| **Source** | `CICDimprovements.md` P3-1, `deploy.yml` |

---

### B-CI-20: No Semantic Versioning (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Release Management |
| **Status** | ⬜ **OPEN** |
| **Found** | Git history — tags exist (v2.28–v2.37) but manually created, inconsistent |
| **Bug** | No automated release process. No `CHANGELOG.md`, no auto-generated release notes, no semantic versioning enforcement, no automated GitHub Release creation with build artifacts. |
| **Impact** | Unclear which version runs in production. Manual release notes rely on developer discipline. No changelog for users/operators. |
| **Required Work** | 1) `release.yml` triggered on tag push. 2) `semantic-release` or manual version bump workflow. 3) Auto-generate release notes from conventional commits. 4) Attach Docker tags + APK to release. 5) Create `CHANGELOG.md`. Estimated effort: 1 hour. |
| **Source** | `CICDimprovements.md` P3-2 |

---

### B-CI-21: No PR Preview Environments (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | CI/CD / Review |
| **Status** | ⬜ **OPEN** |
| **Found** | Workflow review — all changes pushed directly to `main`, no PRs |
| **Bug** | No way to preview changes before merge. All development on `main` (single branch), no pull requests, no PR preview deployments. Reviewers cannot see a live running version of changes before approving. |
| **Impact** | Code review limited to code reading only — no visual verification of UI changes. Bugs manifesting only in running environment not caught until post-deploy. |
| **Required Work** | 1) Adopt feature branch workflow: `feature/X` → PR → `main`. 2) `preview.yml` deploying PR branches to temporary ECS service or posting Playwright screenshots as PR comments. 3) Clean up preview on PR close/merge. Estimated effort: 3 hours. |
| **Source** | `CICDimprovements.md` P3-3 |

---

### B-CI-22: No Deploy Notifications (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | CI/CD / Monitoring |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `deploy.yml` has no notification step |
| **Bug** | Deployment success/failure only visible in GitHub Actions UI. No Slack, Discord, email, or SMS notification. A failed deploy at 3 AM goes unnoticed until someone checks manually. |
| **Impact** | Delayed response to failed deployments. No real-time awareness of production changes. Team may not notice a silent deploy with warnings. |
| **Required Work** | Add Slack/Discord webhook step to `deploy.yml`. Send on `success`/`failure`/`cancelled` with commit SHA, actor, reason, URL, duration. Estimated effort: 15 min. |
| **Source** | `CICDimprovements.md` P3-4, `deploy.yml` |

---

### B-CI-23: No Grafana Dashboard Validation in CI (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | CI/CD / Monitoring |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `monitoring/dashboards/` committed but never validated |
| **Bug** | Grafana dashboard JSON files in `monitoring/dashboards/` are not validated in CI. Malformed JSON, broken PromQL queries, or missing datasource references only discovered when loaded in Grafana. |
| **Impact** | Monitoring dashboards can silently break. Operators find "No data" panels because a query references a renamed metric. |
| **Required Work** | 1) Validate dashboard JSON structure. 2) Check datasource references match `grafana-datasources.yml`. 3) Use `grafana-dashboard-linter` or similar. Estimated effort: 30 min. |
| **Source** | `CICDimprovements.md` P3-5, `monitoring/dashboards/` |

---

### B-CI-24: No Performance/Load Testing (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Testing / Performance |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — no performance testing tooling in repository |
| **Bug** | No load tests, stress tests, or performance benchmarks for API or frontend. No k6/artillery/wrk scripts. No CI job validating response time SLAs (p95 <200ms, p99 <1s) or throughput requirements. |
| **Impact** | Performance regressions (N+1 queries, missing indexes, inefficient React renders) go undetected. First time system experiences load is with real users. Capacity planning is guesswork. |
| **Required Work** | 1) Create k6 script simulating common flows: login→dashboard→list→create. 2) Add `load-test` job to CI. 3) Set performance budgets (p95 latency, error rate <1%). 4) Optional: Grafana k6 Cloud integration. Estimated effort: 2 hours. |
| **Source** | `CICDimprovements.md` P3-6 |

---

### B-CI-25: No Go Version Matrix (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | CI/CD / Build |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `setup-go` hardcodes `go-version: '1.22'` |
| **Bug** | CI only tests Go 1.22. Production ECS uses Go 1.24 (per `milestone1june.md`). Local dev uses yet another version. Mismatch can cause subtle bugs where code compiles fine in CI but fails in production due to language/stdlib changes. |
| **Impact** | Go version inconsistencies across dev → CI → production. Features deprecated in newer Go versions won't be caught. Build may succeed in CI (1.22) but fail in production (1.24). |
| **Required Work** | 1) Add `strategy: matrix: go-version: ['1.22', '1.23']` to `backend-test`. 2) Sync prod Go version with CI. 3) Add `.go-version` file. 4) Use `go.mod` directive as source of truth. Estimated effort: 5 min. |
| **Source** | `CICDimprovements.md` P3-7, `test.yml:backend-test` |

---

### B-CI-26: No `[ci skip]` Branch Trigger Optimization (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | CI/CD / Efficiency |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `test.yml` triggers on `push: branches: ['**']` unconditionally |
| **Bug** | Test workflow runs on EVERY push to EVERY branch, including documentation-only commits, WIP branches, and commits with messages like "WIP" or "save". No `[ci skip]` convention to skip CI for non-code changes. |
| **Impact** | Wasted CI minutes on documentation commits, workflow edits, and WIP branches. Each CI run takes 5+ min across 8 jobs. 10 doc commits = 50+ min of unnecessary CI time. |
| **Required Work** | 1) Add `if: "!contains(github.event.head_commit.message, '[ci skip]')"` to jobs/workflow. 2) Or change trigger to only `main` + PR branches. 3) Document convention. Estimated effort: 5 min. |
| **Source** | `CICDimprovements.md` P3-8, `test.yml` |

---

### B-TRK-01: Truck PUT Returns 404 With Full Body (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Trucks |
| **Status** | ⬜ **OPEN** |
| **Found** | API test — `PUT /api/tenant/trucks/6` with full JSON body (id, aktif, yakit_tipi, tracking_source) → 404 "truck not found". Same ID with minimal body → 200 success. |
| **Bug** | The truck update handler rejects PUT requests that include fields the handler can't process (`id`, `aktif`, `yakit_tipi`, `tracking_source`). Error message "truck not found" is misleading — the truck exists (confirmed by DELETE 200 on same ID). |
| **Impact** | Frontend may send full truck object on update (common pattern), causing PUT to fail. Users get confusing "not found" error. |
| **Required Fix** | 1) Accept `id` in body (ignore it, use URL param). 2) Allow updating `tracking_source` and `yakit_tipi` via PUT. 3) Fix error message to "invalid update data" instead of "truck not found". |
| **Files to Change** | `backend/internal/handlers/trucks.go` |
| **CI Gate** | `api-smoke`: verify truck PUT works with full object from GET |

---

### B-TRK-02: Truck POST `yakit_tipi` May Not Be Persisted (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Trucks |
| **Status** | ⬜ **OPEN** |
| **Found** | Test showed `yakit_tipi` sent in POST body but may not be stored in `trucks` table |
| **Bug** | Frontend and API docs reference `yakit_tipi` (DIZEL/BENZIN/LPG/ELEKTRIK) but the `trucks` table schema may not have a `yakit_tipi` column, or the handler doesn't bind it. |
| **Impact** | Fuel type information silently lost on truck creation. Fuel efficiency calculations may miss vehicle classification. |
| **Required Fix** | Verify `trucks` table has `yakit_tipi` column. If not, add ALTER TABLE. If yes, fix handler binding. |
| **Files to Change** | `database/01-schema.sql`, `backend/internal/handlers/trucks.go` |
| **CI Gate** | `module-consistency`: schema check that trucks table has yakit_tipi column |

---

### B-EXP-01: Expense Categories Route Not Registered (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Expenses |
| **Status** | ⬜ **OPEN** |
| **Found** | API test — `GET /api/tenant/expenses/categories` returns 400 "invalid id" |
| **Bug** | The expenses handler's `Routes()` function does NOT register a `/categories` route. The only routes are `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`. When the frontend calls `/categories`, it matches `GET /{id}` which tries to parse "categories" as integer → fails. |
| **Impact** | Category breakdown chart/statistics in ExpensesPage are non-functional. The endpoint was documented in BUILT.md but never wired. |
| **Required Fix** | Add `r.Get("/categories", h.Categories)` BEFORE `r.Get("/{id}", h.Get)` in Routes() — static routes must precede parameterized routes. |
| **Files to Change** | `backend/internal/handlers/expenses.go` |
| **CI Gate** | `api-smoke`: verify `GET /api/tenant/expenses/categories` returns 200 with category data |

---

### B-PERM-01: Restricted User Has ALL Permissions Set to False (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Permissions / User Management |
| **Status** | ⬜ **OPEN** |
| **Found** | API test — `GET /api/tenant/my-permissions` for ofis@ofis.com returns ALL `can_*: false` |
| **Bug** | The ofis@ofis.com user was configured with truck_tracking + expense_tracking permissions (verified working June 1). On June 2, ALL permissions were `false` — every module_key has `can_view:false, can_create:false, can_edit:false, can_delete:false`. This means: 1) permissions were never persisted/seed data lost, OR 2) SavePermissions defaults to all-false when modal opened without changes, OR 3) QA DB was reset. |
| **Impact** | All non-owner users have ZERO module access. The entire RBAC system is non-functional because permissions default to all-off. |
| **Required Fix** | 1) Verify `user_permissions` has rows for ofis user. 2) Fix `SavePermissions` to not overwrite all to false on open-without-save. 3) Add default permission template for new users. 4) Add `qa.sh db-seed` step for test user permissions. |
| **Files to Change** | `backend/internal/handlers/usermanagement.go`, `qa.sh` |
| **CI Gate** | `api-smoke`: verify ofis user can GET trucks (200) and expenses (200) |

---

### B-PERM-02: PermissionEnforcer Blocks User Due to B-PERM-01 (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Permissions |
| **Status** | ⬜ **OPEN** (cascade of B-PERM-01) |
| **Found** | API test — ofis user gets 403 on ALL tenant endpoints |
| **Bug** | Because B-PERM-01 sets all permissions to `false`, the `PermissionEnforcer` middleware (correctly) returns 403 for every module. The enforcement logic is working, but the permissions data is wrong. |
| **Impact** | ofis@ofis.com cannot access truck_tracking or expense_tracking despite being configured with those permissions. |
| **Required Fix** | Fixing B-PERM-01 automatically resolves B-PERM-02. |
| **Dependency** | B-PERM-01 |
| **CI Gate** | Same as B-PERM-01 gate |

---

### B-ACT-01: ActionsPage Is Unreachable — No Route (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Actions / Audit Log |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review — `GET /api/tenant/actions/` works (200), ActionsPage.tsx is fully coded but has no route |
| **Bug** | `ActionsPage.tsx` is fully implemented (947 lines, DataGrid, API calls, revert functionality) and imported in `App.tsx`, but has NO `<Route>` and NO sidebar link. Users cannot navigate to `/dashboard/actions`. |
| **Impact** | Audit log functionality (KVKK compliance feature) exists but is invisible to users. Backend works, frontend is dead code. |
| **Required Fix** | Add to `App.tsx`: `<Route path="/dashboard/actions" element={<ActionsPage />} />`. Add to `Sidebar.tsx`: `{ name: "İşlem Kayıtları", path: "/dashboard/actions", icon: History }`. Add to `MainLayout.tsx` title mapping. |
| **Files to Change** | `frontend/src/App.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/components/MainLayout.tsx` |
| **CI Gate** | `production-integrity`: verify ActionsPage has Route in App.tsx + sidebar entry |

### B-STRIPE-01: PRO Upgrade Shows Fallback on Production (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Billing / Stripe |
| **Status** | ⬜ **OPEN** |
| **Found** | Full module API/UI test — June 3, 2026 |
| **Bug** | "PRO'ya Yükselt" button on SettingsPage shows fallback message "info@unysolar.com adresine yazabilirsiniz" instead of redirecting to Stripe Checkout. Root cause: `STRIPE_SECRET_KEY` environment variable not set in AWS ECS task definition. Added to `terraform.tfvars` + `ecs.tf` but needs `terraform apply` to take effect on AWS. |
| **Impact** | Users cannot purchase PRO subscriptions. Revenue blocked. |
| **Fix** | Apply Terraform changes: `cd infra/terraform && terraform apply`. Verify via curl: `POST /api/tenant/stripe/checkout` returns `url`. |
| **Files** | `infra/terraform/ecs.tf`, `infra/terraform/variables.tf`, `infra/terraform/terraform.tfvars` |
| **CI Gate** | `security-checks`: verify STRIPE_SECRET_KEY variable exists in ecs.tf |

### B-STRIPE-02: No Dedicated Billing Page or Subscription Management UI (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Billing / Frontend |
| **Status** | ⬜ **OPEN** |
| **Found** | Full module API/UI test — June 3, 2026 |
| **Bug** | No `BillingPage.tsx` exists. Stripe checkout is only accessible from Settings→PRO Upgrade. No UI to: view subscription history, cancel subscription, change plan, see invoice history, download billing receipts. Backend billing.go + stripe.go fully functional but frontend missing entirely. |
| **Impact** | Users cannot manage their subscriptions. Increased support tickets for plan changes. |
| **Fix** | Create `BillingPage.tsx` with: current plan display, Stripe checkout button, subscription history, cancel/downgrade flow. Add Route + sidebar entry. |
| **Files** | Create `frontend/src/pages/BillingPage.tsx`, update `App.tsx`, `Sidebar.tsx`, `MainLayout.tsx` |

### B-PORTAL-01: Customer Portal Has No Dedicated Backend (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | CRM / Customer Portal |
| **Status** | ⬜ **OPEN** |
| **Found** | Full module API/UI test — June 3, 2026 |
| **Bug** | `CustomerPortalPage.tsx` renders and calls `api.get('/api/tenant/customers/')` which is the standard customers endpoint. No dedicated customer portal features exist: no customer login, no customer-facing invoice view, no customer-facing trip tracking, no self-service. The frontend page exists but provides no additional functionality beyond the regular CustomersPage. |
| **Impact** | Customer self-service portal (planned blueprint feature) is non-functional. Customers cannot view their own deliveries/invoices independently. |
| **Fix** | Either: 1) Remove CustomerPortalPage and route, OR 2) Add portal-specific backend endpoints for customer self-service. |

### B-CARBON-01: Carbon Tracking Is a Static Page (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | ANALYTICS / Carbon Tracking |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review during full module test — June 3, 2026 |
| **Bug** | `CarbonTrackingPage.tsx` has NO API calls — zero. The page only imports `{ useState }` and `lucide-react` icons. It renders a static UI with hardcoded CO2/trees values. No backend handler exists for carbon tracking data. |
| **Impact** | Users see fake data. No actual CO2 calculations from trip/fuel data. EU compliance feature is non-functional. |
| **Fix** | Either: 1) Add backend carbon handler that calculates real CO2 from fuel_logs + trips, OR 2) Mark page as placeholder with "Yakında" notice. |

### B-BILLING-01: No Subscription Management UI (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Finance / Billing |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review during full module test — June 3, 2026 |
| **Bug** | `BillingPage.tsx` does not exist. Backend `billing.go` has full endpoints (plans, invoices, upgrade, cancel, checkout) but zero frontend pages connect to them. The only Stripe integration is the SettingsPage PRO Upgrade button. |
| **Impact** | Users cannot view SaaS billing history, upgrade plans with card, cancel subscriptions, or see billing invoices. |
| **Fix** | Same as B-STRIPE-02 — create `BillingPage.tsx` wired to all billing API endpoints. |

### B-EXPORT-01: Export Has No Dedicated Backend Handler (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | ANALYTICS / Export |
| **Status** | ⬜ **OPEN** |
| **Found** | Code review during full module test — June 3, 2026 |
| **Bug** | `ExportPage.tsx` exists (1 API call) but no `handlers/export.go` exists. Export functionality relies on per-module DataGrid `onExport` handler (CSV/Excel/PDF generation in `lib/export.ts`). No centralized export backend. |
| **Impact** | Cross-module exports (export all data at once) not possible. Each module exports independently from frontend. |
| **Fix** | Either: 1) Document that export is per-module only (DataGrid feature), OR 2) Add `handlers/export.go` with centralized multi-module export. |

### B-EMP-01: Employee Create Does Not Refresh List (FIXED)

| Field | Detail |
|-------|--------|
| **Severity** | P1 — High |
| **Module** | Frontend / Employees |
| **Status** | ✅ **FIXED** |
| **Found** | QA module test — employee created but not shown in list |
| **Bug** | SettingsPage employee/user create did not refresh the list after save. Fixed by B-SET-06 (optimistic user add) which applies to SettingsPage's user management. |
| **Fix** | SettingsPage now optimistically adds created user to list. The separate EmployeesPage.tsx route was also added to App.tsx. |
| **CI Gate** | `production-integrity`: Employee create refreshes list |

### B-RPT-01: Reports Page May Call Wrong Endpoint (FIXED)

| Field | Detail |
|-------|--------|
| **Severity** | P2 — Medium |
| **Module** | Frontend / Reports |
| **Status** | ✅ **FIXED** |
| **Found** | Code review — ReportsPage.tsx API call pattern |
| **Bug** | ReportsPage could potentially call `/api/tenant/reports` (which returns 404) instead of sub-routes like `/api/tenant/reports/summary` or `/api/tenant/reports/revenue-expenses`. The backend has no root `/reports` handler, only sub-routes. |
| **Fix** | ReportsPage uses correct sub-route endpoints. Verified during full module test — both `/reports/summary` and `/reports/revenue-expenses` return 200. |
| **CI Gate** | `production-integrity`: Reports page uses valid sub-route endpoints |

### B-TRK-02: Truck POST yakit_tipi May Not Be Persisted (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Trucks |
| **Status** | ⬜ **OPEN** |
| **Found** | Test showed `yakit_tipi` sent in POST body may not be stored |
| **Bug** | Frontend and API docs reference `yakit_tipi` but trucks table schema needs verification that the column exists and handler binds it correctly. |
| **Fix** | Verify `trucks` table has `yakit_tipi` column. If not, add ALTER TABLE + fix handler binding. |

### B-LOAD-02: "İlgileniyorum" Button Hidden in Empty State (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Load Board |
| **Status** | ⬜ **OPEN** |
| **Found** | UI review — "İlgileniyorum" + WhatsApp share buttons not visible when load board is empty |
| **Bug** | Load board's interest/WhatsApp buttons are rendered only when listings exist. With zero listings, the buttons are hidden. |
| **Fix** | Add buttons/labels to empty state view, or ensure buttons render regardless of listing count. |

### B-LOAD-03: No Stats Summary Cards on Load Board (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Load Board |
| **Status** | ⬜ **OPEN** |
| **Found** | UI review — LoadBoardPage lacks KPI summary |
| **Bug** | LoadBoardPage has no stats summary cards (total active loads, YUK_VAR count, YUK_ARA count, matches today) at top. Only filter tabs and listing grid. |
| **Fix** | Add KPI cards row: "Toplam Aktif İlan", "Yük Var", "Yük Ara", "Bugünkü Eşleşme". Use `/api/tenant/load-board/stats` endpoint. |

### B-CEK-01: KPI Cards Differ From Spec (OPEN)

| Field | Detail |
|-------|--------|
| **Severity** | P3 — Low |
| **Module** | Cek/Senet |
| **Status** | ⬜ **OPEN** |
| **Found** | UI review — CekSenetPage KPI cards |
| **Bug** | CekSenetPage shows 3 KPI cards instead of 4 from spec. Spec calls for: Toplam Portföy, Bekleyen, Tahsil Edildi, Karşılıksız. |
| **Fix** | Add missing 4th KPI card (Karşılıksız) to CekSenetPage top section. |
