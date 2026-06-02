# Unysol — Milestone / Session Context

> **Last Session:** 26-27 May 2026
> **Total Commits:** 102 (v2.28 → v2.34 this session)
> **Context usage:** ~950K / 1M tokens

---

## 🖥️ Servers & Access

| Resource | Detail |
|----------|--------|
| **Production VPS** | `ssh root@<VPS_IP>` (credentials in password manager) |
| **Project path** | `/root/unysol` on VPS |
| **Local project** | `/home/ugur/unysol` |
| **GitHub** | `ugry/unysol` (private) |
| **Domain** | `unysolar.com` (SSL via Let's Encrypt/Caddy) |
| **SSH deploy key** | `/tmp/gh-actions-key` + `~/.ssh/github-actions` |
| **DB shell** | `docker exec unysol-db psql -U unysol -d unysol` |
| **DB port** | `localhost:5433` (container:5432) |

---

## 🔐 Credentials

| Service | User | Password/Key |
|---------|------|-------------|
| Super admin | `ugur.yardimci@unygms.com` | `[in password manager]` |
| Test user | `cinar@test.com` | `[in password manager]` |
| Google test | `uguryardimci82@gmail.com` | tenant_id=28 |
| JWT secret (prod) | `[in GitHub Secrets]` |
| Google Client ID | `[in GitHub Secrets]` |
| Stripe Publishable | `[in GitHub Secrets]` |
| Stripe Secret | `[in GitHub Secrets]` |
| exa.ai API key | `[in GitHub Secrets]` |
| GitHub SSH deploy key | `/tmp/gh-actions-key` (ed25519) |
| VPS root pass | `[in password manager]` |
| SMTP email | `ugur.yardimci@unygms.com` (Hostinger) |
| SMTP server | `smtp.hostinger.com:587` |

---

## 🚀 Deploy Commands

```bash
# Build backend (from backend/)
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /tmp/unysol-server ./cmd/server

# Build frontend (from frontend/)
VITE_GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" npm run build

# Deploy to VPS (credentials in GitHub Secrets)
# ssh root@<VPS_IP> ...

# Generate admin JWT token (use GitHub Secrets for JWT_SECRET)
# python3 -c "..."

# Git push via SSH (when HTTPS token lacks workflow scope)
git remote set-url origin git@github.com:ugry/unysol.git
GIT_SSH_COMMAND="ssh -i ~/.ssh/github-actions -o StrictHostKeyChecking=no" git push
git remote set-url origin https://github.com/ugry/unysol.git
```

---

## 📊 Project State

| Metric | Value |
|--------|:---:|
| Tenants | 37 |
| Users | 38 |
| Modules (DB) | 21 |
| Go handlers | 28 files |
| Frontend pages | 20 files |
| Docker services | 6 (pg, redis, backend, frontend, caddy) |
| API endpoints | ~70 |
| DB tables | 29+ |

---

## ✅ Completed This Session (v2.28 → v2.34)

| Version | What |
|---------|------|
| v2.28 | fuel_logging + maintenance modules (backend+frontend) |
| v2.29 | Auto-sync fuel/maintenance → expenses + L/100km calc |
| v2.30 | User management backend (create personnel + permissions API) |
| v2.31 | Android PWA (manifest, service worker, install prompt) |
| v2.32 | Native Android APK (4.7MB) + Android SDK installed |
| v2.33 | User management UI (AddUserModal + PermissionsModal) |
| v2.34 | 3 new modules: trailers, HGS tolls, driver leave |
| v2.24-26 | Admin panel fixes (analytics, modules, countries, mock data) |
| v2.26 | CI/CD pipeline (test 8/8 + deploy auto) |
| v2.27 | Settings page real API + PRO upgrade wiring |

---

## 🧪 Testing Methods

| # | Method | Purpose |
|---|--------|---------|
| 1 | `curl -sk API_URL` with JWT token | API smoke tests |
| 2 | Python `requests` with `verify=False` | Full CRUD cycle tests |
| 3 | `python3 -c "import jwt..."` | Generate valid JWT tokens |
| 4 | Playwright `chromium.launch({headless:true})` | UI rendering + JS error checks |
| 5 | `page.on('pageerror')` | Catch JS crashes |
| 6 | `page.route('**/*')` | Network interception |
| 7 | `docker exec unysol-db psql` | Direct DB queries |
| 8 | `bash scripts/check-module-consistency.sh` | Module ↔ page mapping |
| 9 | `grep -rn "pattern" frontend/src/pages/` | Static mock data detection |
| 10 | exa.ai API `POST /search` | Competitor research |

---

## 📋 TODO — Remaining Tasks

### 🔴 Critical
- [ ] Stripe Price IDs — create in Dashboard, paste in admin panel
- [ ] SMTP connectivity — Docker DNS fix for email sending
- [ ] WhatsApp notification integration

### 🟠 High (3 done this session, 4 remaining)
- [x] Trailer management ✅
- [x] HGS toll tracking ✅
- [x] Driver leave calendar ✅
- [ ] Billing/Stripe checkout button (frontend trigger)
- [ ] Admin audit log
- [ ] Load board match notification (YUK_VAR ↔ YUK_ARA)
- [ ] Load board "İlgileniyorum" notify to owner

### 🟡 Medium
- [ ] Reports module (last missing frontend page)
- [ ] Load board saved search alerts
- [ ] Admin real package distribution + recent registrations
- [ ] Admin country management UI
- [ ] Password reset flow
- [ ] Fuel price tracking widget

### 🟢 Low
- [ ] Settings page notification toggles → wire to backend
- [ ] Yük Panosu rating system
- [ ] PRO/PREMIUM verified badge
- [ ] Yük Panosu anti-spam
- [ ] Database backup automation

---

## 🔄 New Module Pattern (Copy-Paste Recipe)

```
1. Check DB schema: docker exec unysol-db psql -U unysol -d unysol -c "\d table_name"
2. Check enums: SELECT unnest(enum_range(NULL::enum_name))
3. Create backend/handlers/xxx.go (CRUD template)
4. Register handler in main.go: xxxHandler := &handlers.XxxHandler{DB: pool}
5. Add route: r.Mount("/xxx", xxxHandler.Routes())
6. Create frontend/pages/XxxPage.tsx (DataGrid + modal template)
7. Register in App.tsx: import + <Route>
8. Add sidebar link in Sidebar.tsx with icon
9. Build + deploy
10. Test POST/GET/DELETE via curl
```

---

## ⚠️ Known Issues & Gotchas

| Issue | Workaround |
|-------|-----------|
| Admin password has `\|` char | Use Python JWT generation instead of curl login |
| SettingsPage JSX bracket issues | Use separate modal components (AddUserModal, PermissionsModal) |
| PostgreSQL enum mismatch | Check actual enum values with `SELECT unnest(enum_range(...))` |
| Empty date strings in DB | Use `NULLIF(column::text,'')::date` in queries |
| Docker DNS Cloudflare blocking | Add `dns: 8.8.8.8` to docker-compose backend service |
| Git HTTPS push blocks workflow files | Use SSH deploy key: `git@github.com:ugry/unysol.git` |
| `npm ci` needs lockfile | Use `npm install` in CI |
| YAML names with `:` break CI | Quote all name values: `name: "Step: Action"` |

---

## 🔗 Key Files

| File | Purpose |
|------|---------|
| `TODO.md` | Prioritized task list |
| `modulecomparisongrid.md` | Module gaps vs blueprint |
| `newmodules.md` | Module development rules + competitor research |
| `yukpanosumoduleimprovements.md` | Load board improvement plan |
| `truckownersettingsanalysis.md` | Settings page audit + industry pain points |
| `saassuperadminobservationsfromengineer.md` | Super admin panel audit |
| `saassuperadminmodulemanagementobservations.md` | Module management audit |
| `unysolarphaseoneendusertestobservations.md` | End user test observations |
| `saaslandingpagesecurity.md` | Security audit |
| `BLUEPRINT.md` | Master architecture plan |
| `ROADMAP.md` | Development roadmap |
| `STATUS.md` | Current status report |
| `server.md` | Server deployment details |
| `stripe_todo.md` | Stripe integration checklist |
| `scripts/check-module-consistency.sh` | CI module consistency gate |
| `.github/workflows/test.yml` | CI test pipeline (8 jobs) |
| `.github/workflows/deploy.yml` | CI deploy pipeline |

---

## 🏗️ Architecture Quick Reference

```
Frontend (React/Vite/Tailwind) → /dashboard/*
Caddy (SSL) → unysolar.com → frontend:5173, /api/* → backend:8080
Backend (Go/chi/pgx) → /api/* → PostgreSQL 16 + Redis 7
Docker Compose: db, redis, backend, frontend, caddy
Storage: pgdata volume, logs mounted at ./logs
Auth: JWT (1yr expiry), Google OAuth, email verification
Plans: FREE (5 trucks), PRO (10 trucks, 2000TL/yr), PREMIUM (unlimited)
```

## 🎨 Design System

- **Primary:** `#FF5F03` (orange)
- **Background:** `#0f1011` / `#08090a` (dark)
- **Text:** `#f7f8f8` / `#d0d6e0` / `#8a8f98`
- **Font:** Ubuntu (body), Oswald (headings)
- **Icons:** lucide-react
- **PWA:** manifest.json, service-worker.js, install prompt
