# Unysol — Milestones & Project History

> **Canonical milestone document.**
> **Last Updated:** 04 June 2026 (IMP-054 Resend API)

---

## June 4, 2026 — Resend API Integration (IMP-054)

### Email Delivery
- Resend API sender built (`backend/internal/email/resend.go`)
- `email.Configure/Send` now supports `resend` method alongside `smtp` and `ses`
- `email_config` table: `resend_api_key` column added (migration 015)
- Super admin panel: method selector (SMTP/SES/Resend) + API key field
- CI gate: `IMP-054: Resend integration exists` in production-integrity job
- All system emails (registration verification, password reset) route through chosen method

---

## June 3, 2026 — Major Feature Day (57 commits)

### Payments & Monetization
- Stripe checkout fully operational on production (test mode)
- Stripe secret key stored in DB (`email_config.stripe_secret_key`) — no ECS env var dependency
- BillingPage created: plan selector, Stripe checkout button, invoice history, cancel flow
- PRO webhook properly upgrades tenant plan + creates subscription
- SettingsPage shows "PRO Aktif" badge, BillingPage shows PRO banner with expiry

### Plan Enforcement (IMP-051)
- JWT `allowed_modules` claim embedded on login from `plan_modules` table
- Middleware enforces before TENANT_OWNER bypass (FREE users get 403 on PRO modules)
- FREE plan: 13 modules accessible, 18 blocked
- PRO plan: 31 modules accessible
- End-to-end test: 49/49 API, 33/33 UI

### Access Management (IMP-052)
- New `access_mgmt` module — PRO/PREMIUM only
- User management removed from SettingsPage entirely
- Standalone `AccessManagementPage.tsx` with user CRUD + permissions modal
- Middleware maps `/api/tenant/user-management` → `access_mgmt`

### Email-First Registration (IMP-053)
- `pending_registrations` table — stores signup data without creating tenant/user
- Tenant + user + subscription created ONLY after 6-digit code verification
- Auto-login after verification (JWT returned immediately)
- Migration 014 + schema update

### Forgot Password (IMP-012)
- `POST /api/auth/forgot-password` — sends 6-digit code via email
- `POST /api/auth/reset-password` — validates code, updates bcrypt password
- Frontend: "Şifrenizi mi unuttunuz?" link on login page
- Two-step modal: enter email → enter code + new password
- Email: `SendPasswordReset()` with styled HTML template

### Email Delivery Evolution
- SES sandbox → blocked (recipient not verified)
- Hostinger SMTP → blocked (AWS IP rejected by Hostinger)
- Resend API → configured, 100/day free, domain verification pending
- SMTP fixes: TrimPrefix removed, STARTTLS for port 587, auth skip when empty

### Admin Dashboard Fixes
- `paket_dagilimi` — real DB query (SELECT plan, COUNT(*) FROM tenants GROUP BY plan)
- `son_kayitlar` — real DB query (last 5 tenants)
- Migration 012: seeds modules + countries + plan_modules on production RDS
- 31 modules registered across 6 categories

### Bug Fixes
- Reports SQL: `tutar`→`toplam_tutar`, `ORDER BY sum`→`ORDER BY SUM(tutar)`
- Migration 011: Creates `tenant_rls_policy` function if missing, DROP POLICY IF EXISTS
- LoadBoardPage: 4 KPI stats cards (active, yuk_var, yuk_ara, today new)
- CekSenetPage: 4th KPI card (Karşılıksız) + backend `karsiliksiz_count`
- CarbonTrackingPage: Real API calls to fuel_logs/trips for CO2 calculation
- Export handler: `export.go` with trucks/customers/expenses endpoints
- Google OAuth: www → non-www redirect on ALB (origin_mismatch fix)

### CI/CD — 6 new regression gates
- B-AUTH-02: Forgot password flow completeness
- IMP-052: access_mgmt seed migration
- B-ADMIN-01/02/03: Module seed + dashboard real queries
- B-STRIPE-01/02: Stripe env vars + SettingsPage checkout
- All existing CI gates fixed for Settings refactor

### Documentation Restructure
- 62 md files → 48 (17 deleted, 4 merged)
- 4 new canonical docs: MILESTONES.md, MODULES.md, TEST_ACCOUNTS.md, DOCUMENTATION_RULES.md
- DOCUMENTATION_RULES.md: 9 enforceable rules
- IMP registry: 51 items (P0-P3) with cross-referenced CI gates
- COMPETITORS.md: refreshed with June 2026 exa.ai research

---

## Quick Reference

| Resource | Detail |
|----------|--------|
| **Production URL** | `https://unysolar.com` |
| **GitHub** | `ugry/unysol` (private) |
| **AWS Region** | `eu-central-1` |
| **AWS Account** | In GitHub Secrets (`AWS_ACCOUNT_ID`) |
| **Domain** | `unysolar.com` (Route 53 + ACM SSL) |

---

## Project Timeline

### May 25-26, 2026 — Foundation & Bug Fixes

- Initial project build-out per BLUEPRINT.md
- 29+ DB tables created with RLS on all tenant-scoped tables
- ~70 API endpoints built (Go/chi)
- 14 frontend pages (React/Tailwind)
- Bug fix sprint: 17 bugs fixed across 6 modules
- 269 tests across 9 modules, 92% pass rate

### May 27, 2026 — Modules & Android

- 7 new modules built: fuel_logging, maintenance, trailers, HGS tolls, driver_leave, user_permissions, load_board improvements
- Android APK (4.7MB debug build)
- Cross-tenant marketplace (load board)
- Module consistency CI gate added
- Commits: v2.28 → v2.34

### May 28, 2026 — AWS Full Migration

- Terraform: VPC, ECS Fargate, RDS 16.6, ElastiCache 7.1, ALB + ACM
- SES email service (API mode via IAM role)
- GitHub Actions deploy.yml rewritten for ECS
- 7 database migrations added (002-008)
- Frontend: `serve@14`, KVKK/Terms/Privacy pages
- Registration flow fixed (mixed-content HTTPS fix)
- Email verification tokens table fixed

### June 1, 2026 — CI/CD Hardening + Settings + Permissions

- CI/CD: 8 jobs, ~45 checks, concurrency control, deployment approval gate
- Settings module: 8 bugs fixed (B-SET-01 through B-SET-08)
- Permission enforcement: middleware built, sidebar filters, AccessDenied component
- QA environment: Docker production mirror (docker-compose.qa.yml + Caddyfile)
- Blockchain integration roadmap documented (unysolblockchain.md)
- Deployment Rules enforced (tests must pass + admin approval required)

### June 2, 2026 — 10 New Modules + Design Overhaul

- 9 bugs fixed: B-ACT-01, B-EXP-01, B-PERM-01/02, B-QA-01, B-TRK-01, B-PRED-01, B-LOAD-01, B-DSGN-01-12
- 10 new modules built: reports, proposals, contracts, tire_tracking, driver_allowance, driver_performance, payslip, customer_portal, carbon_tracking, export
- 5 new DB tables: proposals, contracts, tire_records, driver_allowances, payslips
- Registration flow redesigned: 6-digit code, auto-login, Mailpit for local email testing
- Design inconsistencies audit (20 UI issues found, 8 fixed)
- 10 test tenants + 30 sub-users created
- 31/49 blueprint modules complete (63%)

---

## Server & Deploy Commands

```bash
# QA Environment
cd /home/ugur/unysol && ./qa.sh up     # Start
./qa.sh health                          # Check all services
./qa.sh db-shell                        # PostgreSQL console
./qa.sh down                            # Stop

# URLs
# QA:      http://localhost
# QA API:  http://localhost/api/system/health
# QA DB:   docker exec -it unysol-qa-db psql -U unysol -d unysol
# Mailpit: http://localhost:8025
# Prod:    https://unysolar.com

# Deploy to Production
gh workflow run deploy.yml --repo ugry/unysol --ref main -f reason="..."
# → Tests pass → Approve in GitHub UI → Deploy

# DB shell (production)
docker exec unysol-db psql -U unysol -d unysol
```

---

## Test Credentials

| Email | Password | Role | Tenant |
|-------|----------|------|--------|
| `admin@qa.local` | `REDACTED` | TENANT_OWNER | QA Test Company |
| `ofis@ofis.com` | `REDACTED` | OFFICE | trucks + expenses only |
| `test1@unysol.test` | `REDACTED` | TENANT_OWNER | Anadolu Lojistik |

See `TEST_ACCOUNTS.md` for all 10 tenants + 30 sub-users.

---

## Known Issues & Gotchas

| Issue | Workaround |
|-------|-----------|
| Admin password has special chars | Use Python JWT generation instead of curl login |
| SettingsPage JSX bracket issues | Use separate modal components |
| PostgreSQL enum mismatch | Check actual enum values with `SELECT unnest(enum_range(...))` |
| Empty date strings in DB | Use `NULLIF(column::text,'')::date` in queries |
| Docker DNS Cloudflare blocking | Add `dns: 8.8.8.8` to docker-compose backend service |
| Git HTTPS push blocks workflow files | Use SSH deploy key |
| `npm ci` needs lockfile | Use `npm install` in CI |
| Rate limiter hits during testing | Restart backend: `docker restart unysol-backend` |
| Tracking source enum values | PHONE, ESP32_LTE, COMM_DEV, OBD_ONLY, MANUEL |
| Trip status enum | UPPERCASE required (TAMAMLANDI not tamamlandi) |
| Settings.value JSONB type | String values need JSON quotes |

---

## Architecture Quick Reference

```
Frontend (React/Vite/Tailwind) → /dashboard/*
Caddy/ALB (SSL) → unysolar.com → frontend, /api/* → backend
Backend (Go/chi/pgx) → /api/* → PostgreSQL 16 + Redis 7
Docker Compose: db, redis, backend, frontend, caddy
Auth: JWT (1yr expiry), Google OAuth, email verification, 6-digit code
Plans: FREE (5 trucks), PRO (200 TL/mo), PREMIUM (500 TL/mo)
```

## Project Health (June 2, 2026)

```
Backend:        ███████████████████░  95%
Frontend:       ███████████████████░  95%
Modules:        ████████████████░░░░  63%  (31/49)
CI/CD:          ███████████████████░  95%
Testing:        ████████████████░░░░  70%
Design:         ████████████████████  95%
QA Env:         ████████████████████  100%
Bugs Fixed:     31/51 (61%)
```

## Remaining Tasks

See `TODO.md` for the prioritized task list.

## New Module Recipe

```
1. Check DB schema: docker exec unysol-db psql -U unysol -d unysol -c "\d table_name"
2. Check enums: SELECT unnest(enum_range(NULL::enum_name))
3. Create backend/handlers/xxx.go (CRUD template)
4. Register handler in main.go: xxxHandler := &handlers.XxxHandler{DB: pool}
5. Add route: r.Mount("/xxx", xxxHandler.Routes())
6. Create frontend/pages/XxxPage.tsx (DataGrid + modal template)
7. Register in App.tsx
8. Add sidebar link in Sidebar.tsx with icon
9. Build + deploy
10. Test POST/GET/DELETE via curl
```

---

## June 4, 2026 — Registration Fixes + PRO Upgrade + Multi-tenancy (12+ commits)

### Auth & Registration Fixes (B-AUTH-07 through B-AUTH-15)
- **Email delivery**: Switched from SMTP to Resend API (HTTP), 500ms delay + 3 retries
- **Verification flow**: Post-signup code input screen, dynamic email link (BASE_URL), resend code
- **KVKK/Terms**: Consent checkboxes on signup with legal links
- **Password**: Strength meter + confirmation field + inline policy checklist
- **Account enumeration**: Identical responses prevent email existence detection
- **Input validation**: Phone format, company name min/max, input trimming
- **Forgot password**: Resend code with 60s cooldown, password confirmation
- **Auto-redirect**: Fixed verification→dashboard redirect (location.href)
- **Admin auth**: username-based login (uguradm), no email required
- **reCAPTCHA**: Temporarily disabled — re-enable when deploys stabilize

### PRO Upgrade Flow (B-AUTH-12 through B-AUTH-15)
- **Stripe checkout**: Price IDs configured, Stripe URL template encoding fix
- **Session verification**: Public endpoint verifies payment directly, auto-upgrades tenant
- **Plan enforcement**: plan_enum::text cast fix, migration 022 seeds PRO modules
- **Sidebar filtering**: JWT allowed_modules decoded in frontend

### Multi-tenancy Fix (B-DATA-01)
- Removed mock data with cross-tenant plates from ExpensesPage
- Truck dropdown now fetches real tenant trucks from API

### Infrastructure
- **GitHub Actions**: suspended due to billing — manual deploy via docker build + ECR push + ECS update
- **Deploy method**: `docker build` → `docker tag` → `docker push` → `aws ecs update-service`
- **AWS Profile**: `unysol`, region `eu-central-1`, ECR: `326804802908.dkr.ecr.eu-central-1.amazonaws.com`
- **Email**: Resend API key `REDACTED...`, domain `unysolar.com` verified

### Credentials
- Super admin: `uguradm` / `REDACTED` — https://unysolar.com/admin/login
- Test user: `unygms@tutamail.com` / `REDACTED` — PRO plan, tenant 21
- QA: `admin@qa.local` / `REDACTED` — http://localhost/login
- AWS: profile `unysol`, credentials in `~/.aws/`
