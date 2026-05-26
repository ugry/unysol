# Unysol — Roadmap (26 May 2026)

> **Current status:** %95 complete — MVP ready, demo deployed, enterprise logging active  
> **Next target:** e-Fatura GİB integration → CI/CD → Production launch

---

## Phase 1: Bug Fix Sprint ✅ DONE (25 May)

| # | Task | Status |
|---|------|:---:|
| 1.1 | Fix B1: Truck tracking_source default | ✅ |
| 1.2 | Fix B2: Trip NULL time.Time scan | ✅ |
| 1.3 | Fix B3: Employee empty date strings | ✅ |
| 1.4 | Fix B4: Dashboard enum case | ✅ |
| 1.5 | Fix P1: Rate limit scope | ✅ (already correct) |
| 1.6 | Fix P2: Redis URL | ✅ |

---

## Phase 2: Testing Sprint ✅ DONE (25-26 May)

| # | Task | Status |
|---|------|:---:|
| 2.1 | API Smoke Test — 20 endpoint | ✅ |
| 2.2 | Go unit tests — handlers | ✅ |
| 2.3 | Module-by-module Playwright tests — 9 modules | ✅ |
| 2.4 | API CRUD cycle test | ✅ |
| 2.5 | Re-test all modules post-fixes | ✅ |
| 2.6 | New module tests: Load Board + Demo | ✅ |
| 2.7 | 269 tests total, 92% pass rate | ✅ |

---

## Phase 3: Demo Ready ✅ DONE (26 May)

| # | Task | Status |
|---|------|:---:|
| 3.1 | Seed data script (02-seed-demo.sql) | ✅ |
| 3.2 | Demo hesap oluşturma (POST /api/demo/create) | ✅ |
| 3.3 | Landing page demo button | ✅ |
| 3.4 | 3 realistic demo companies (180 records) | ✅ |
| 3.5 | Frontend mock → real API integration | ✅ |

---

## Phase 4: Production Hardening ✅ DONE (26 May)

| # | Task | Status |
|---|------|:---:|
| 4.1 | Password strength validation (8+ chars) | ✅ |
| 4.2 | Login lockout (5 fails → 15 min) | ✅ |
| 4.3 | Prometheus + Grafana services | ✅ |
| 4.4 | GitHub Actions CI | ⚠ Token scope |
| 4.5 | CORS restriction | ✅ |
| 4.6 | docker-compose cleanup | ✅ |
| 4.7 | Enterprise log separation (5 categories) | ✅ |
| 4.8 | Database password masking | ✅ |

---

## Phase 5: Feature Development ✅ PARTIAL (26 May)

| # | Task | Status |
|---|------|:---:|
| 5.1 | Load Board UI | ✅ |
| 5.3 | Multi-language i18n (TR/EN) | ✅ |
| 5.2 | e-Fatura GİB integration | ⬜ NEXT |
| 5.4 | Mobile-responsive improvements | ⬜ |
| 5.5 | WhatsApp Business API | ⬜ |
| 5.6 | Native mobile app | ⬜ |

---

## Phase 6: Scale & Launch

| # | Task | Effort |
|---|------|:---:|
| 6.1 | CI/CD GitHub Actions | 30dk (token scope needed) |
| 6.2 | Production deployment (k3s/GKE) | 16h |
| 6.3 | PostgreSQL read replicas | 8h |
| 6.4 | Multi-region DR | 24h |
| 6.5 | MQTT broker (GPS/ESP32) | 16h |
| 6.6 | Payment integration (Stripe/Iyzico) | 8h |

---

## Immediate Next Action

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   PHASE 5.2: e-Fatura GİB Integration                  │
│                                                         │
│   Legal requirement for Turkish logistics companies     │
│   Backend endpoint exists, needs GİB API connection     │
│                                                         │
│   OR                                                     │
│                                                         │
│   PHASE 6.1: GitHub Actions CI                         │
│                                                         │
│   Run: gh auth refresh -s workflow                     │
│   Push .github/workflows/ci.yml                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
