# Unysol — Roadmap (25 May 2026)

> **Current status:** MVP prototype running, 17/20 API endpoints tested OK, 4 bugs + 2 production issues found  
> **Next target:** Bug fix sprint → Testing → Demo ready

---

## Phase 1: Bug Fix Sprint (30 dakika)

| # | Task | Priority | Time | File |
|---|------|:---:|:---:|------|
| 1.1 | Fix B1: Truck tracking_source default to MANUEL | HIGH | 5dk | `backend/internal/handlers/trucks.go` |
| 1.2 | Fix B2: Trip NULL time.Time scan | HIGH | 10dk | `backend/internal/handlers/trips.go` |
| 1.3 | Fix B3: Employee empty date strings | HIGH | 5dk | `backend/internal/handlers/employees.go` |
| 1.4 | Fix B4: Dashboard enum case (tamamlandi→TAMAMLANDI) | HIGH | 5dk | `backend/internal/handlers/dashboard.go` |
| 1.5 | Fix P1: Rate limit scope to /api/auth/* only | MEDIUM | 5dk | `backend/internal/middleware/ratelimit.go` |
| 1.6 | Fix P2: Redis URL in docker-compose + config | MEDIUM | 2dk | `docker-compose.yml` + `config/config.go` |

---

## Phase 2: Testing Sprint (2-3 saat)

| # | Task | Priority | Time | Tool |
|---|------|:---:|:---:|------|
| 2.1 | Playwright E2E — Landing page (25 check) | HIGH | 30dk | Playwright headless Chromium |
| 2.2 | Playwright E2E — Auth flow (signup → login → dashboard) | HIGH | 30dk | Playwright |
| 2.3 | Playwright E2E — All 14 pages render check | HIGH | 45dk | Playwright |
| 2.4 | API CRUD cycle test (create → verify DB → read → update → delete) | HIGH | 30dk | curl + psql |
| 2.5 | Admin API test (super admin login, tenant mgmt, module toggles) | MEDIUM | 30dk | curl |
| 2.6 | Go unit test expansion: auth, invoices, dashboard, middleware | MEDIUM | 60dk | go test |
| 2.7 | Frontend ↔ Backend integration test (browser API calls) | MEDIUM | 30dk | Browser console |

---

## Phase 3: Demo Ready (1-2 saat)

| # | Task | Priority | Time |
|---|------|:---:|:---:|
| 3.1 | Create seed data script (2 tenants, 8 trucks, 5 trips, demo user) | HIGH | 30dk |
| 3.2 | Demo hesap oluşturma sayfası (one-click demo account) | HIGH | 45dk |
| 3.3 | Fix frontend mock data → real API integration on remaining pages | MEDIUM | 45dk |
| 3.4 | Landing page improvements (pricing, features, FAQ) | LOW | 30dk |

---

## Phase 4: Production Hardening (1-2 saat)

| # | Task | Priority | Time |
|---|------|:---:|:---:|
| 4.1 | Wire validator to auth signup (password strength 8+ chars, upper/lower/digit/special) | HIGH | 15dk |
| 4.2 | Login lockout: 5 failed attempts → 15 min cooldown | HIGH | 30dk |
| 4.3 | Prometheus + Grafana docker compose services | MEDIUM | 30dk |
| 4.4 | GitHub Actions CI (build + test on push) | MEDIUM | 30dk |
| 4.5 | Restrict CORS to specific origins (not *) | MEDIUM | 5dk |
| 4.6 | Remove `version` from docker-compose.yml (deprecated warning) | LOW | 1dk |

---

## Phase 5: Feature Development

| # | Task | Priority | Effort |
|---|------|:---:|:---:|
| 5.1 | Load Board UI (backend handler exists, not routed) | MEDIUM | 2h |
| 5.2 | e-Fatura GİB integration (legal requirement for TR market) | HIGH | 8h |
| 5.3 | Multi-language support (EN first, then AR/RU) | MEDIUM | 16h |
| 5.4 | Mobile-responsive improvements for driver phone access | MEDIUM | 4h |
| 5.5 | WhatsApp Business API integration (driver notifications) | MEDIUM | 8h |
| 5.6 | Native mobile app (React Native or Capacitor) | LOW | 40h |

---

## Phase 6: Scale & Launch

| # | Task | Priority | Effort |
|---|------|:---:|:---:|
| 6.1 | Production Kubernetes deployment (k3s or GKE) | MEDIUM | 16h |
| 6.2 | PostgreSQL read replicas | LOW | 8h |
| 6.3 | Multi-region DR (Istanbul + Ankara) | LOW | 24h |
| 6.4 | MQTT broker for ESP32/GPS device ingestion | LOW | 16h |
| 6.5 | Stripe/Iyzico payment integration for SaaS billing | MEDIUM | 8h |

---

## Immediate Next Action

```
┌───────────────────────────────────────────────────────┐
│                                                       │
│   PHASE 1: BUG FIX SPRINT                            │
│                                                       │
│   6 bugs · ~30 minutes · Unlocks full CRUD            │
│                                                       │
│   #1 Truck tracking_source default    (B1)            │
│   #2 Trip NULL time.Time scan        (B2)            │
│   #3 Employee empty date             (B3)            │
│   #4 Dashboard enum case             (B4)            │
│   #5 Rate limit auth scope           (P1)            │
│   #6 Redis connection URL            (P2)            │
│                                                       │
│   ▸ Fix → Rebuild → Test → Document                   │
│                                                       │
└───────────────────────────────────────────────────────┘
```
