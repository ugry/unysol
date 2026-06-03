# Unysol — Milestones & Project History

> **Canonical milestone document.** All milestone/session files merged into one.
> **Last Updated:** 03 June 2026

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
