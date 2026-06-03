# Unysol — Prioritized To-Do List

> **Date:** 03 June 2026
> **CI/CD:** Test 8/8 ✅ · Deploy ✅

---

## 🔴 CRITICAL

| # | Task | Why | Status |
|---|------|-----|:---:|
| 1 | **Stripe Price IDs** — create Products in Stripe Dashboard, paste IDs in admin panel | PRO button is dead without this | ✅ Done |
| 2 | **SMTP connectivity** — fix Docker DNS so verification emails actually send | Users can't verify email, blocked from login | ⬜ |
| 3 | **WhatsApp notification integration** — truckers live on WhatsApp | #1 competitor differentiator per exa.ai research | ⬜ |

---

## 🟠 HIGH

| # | Task | Why | Effort | Status |
|---|------|-----|:---:|:---:|
| 4 | **Billing/Stripe checkout button** — wire frontend | Stripe backend done, price IDs set, no frontend trigger | 1h | ⬜ |
| 5 | **Admin audit log** — track who changed plans/suspended | Compliance, multi-admin teams | 2h | ⬜ |
| 6 | **Load board match notification** — YUK_VAR ↔ YUK_ARA auto-detect | Phase 3 from yukpanosumoduleimprovements.md | 4h | ⬜ |
| 7 | **Load board "İlgileniyorum" notification to email/WhatsApp** | Already logs interest, doesn't notify owner | 1h | ⬜ |
| 8 | **Fix actions module route** — component exists, needs `<Route>` in App.tsx | Dead code, KVKK compliance feature invisible | 15m | ⬜ |

---

## 🟡 MEDIUM

| # | Task | Why | Effort | Status |
|---|------|-----|:---:|:---:|
| 9 | **Load board saved search alerts** — "Bursa→İstanbul yeni yük var" | Phase 3 — daily engagement | 4h | ⬜ |
| 10 | **Admin real package distribution** — query subscription counts | Overview shows hardcoded placeholder | 30m | ⬜ |
| 11 | **Admin recent registrations** — real last 5 tenants | Overview shows empty list | 30m | ⬜ |
| 12 | **Admin country management UI** — add/edit countries | Only TR exists, no UI to add | 3h | ⬜ |
| 13 | **Admin module toggle per country/plan** — feature flag UI | Modules visible, toggles untested | 2h | ⬜ |
| 14 | **Password reset flow** — forgot password | Users locked out without Google login | 2h | ⬜ |
| 15 | **Fuel price tracking widget** — compare to EPDK prices | #1 Turkish trucker pain point | 2h | ⬜ |

---

## 🟢 LOW

| # | Task | Why | Effort | Status |
|---|------|-----|:---:|:---:|
| 16 | **Yük Panosu rating system** — 5-star after transaction | Trust building | 6h | ⬜ |
| 17 | **PRO/PREMIUM verified badge** — on listings | Monetization incentive | 1h | ⬜ |
| 18 | **Yük Panosu anti-spam** — duplicate city/city/date detection | Board quality | 1h | ⬜ |
| 19 | **Dashboard "Bu Ay Özet" KPI card** — gelir/gider/kar | Quick profit snapshot | 1h | ⬜ |
| 20 | **Database backup automation** — cron job for pg_dump | Disaster recovery | 30m | ⬜ |
| 21 | **Production reverse proxy** upgrade — Caddy → full Traefik | Long-term scalability | 8h | ⬜ |
| 22 | **Email digests** — weekly summary to active users | Retention | 4h | ⬜ |

---

## ✅ DONE (Recent)

| # | Task | When |
|---|------|------|
| ✅ | Stripe Price IDs created + wired into QA backend | June 3 |
| ✅ | 10 new modules: reports, proposals, contracts, tires, allowances, performance, payslip, customer_portal, carbon_tracking, export | June 2 |
| ✅ | Registration flow redesign: 6-digit code + auto-login + Mailpit | June 2 |
| ✅ | Trailers, HGS tolls, driver leave frontend pages | May 27 |
| ✅ | Settings notification toggles wired to backend | June 1 |
| ✅ | CI/CD pipeline hardening (8 jobs, ~45 checks) | June 1 |
| ✅ | Fuel logging + maintenance modules | May 27 |
| ✅ | Android APK (4.7MB) | May 27 |
| ✅ | Permission enforcement middleware | June 1 |
| ✅ | Doc restructuring: 62→48 files, 4 new canonical docs | June 3 |
