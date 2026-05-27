# Unysol — Prioritized To-Do List

> **Date:** 27 May 2026
> **CI/CD:** Test 8/8 ✅ · Deploy ✅

---

## 🔴 CRITICAL

| # | Task | Why | Status |
|---|------|-----|:---:|
| 1 | **Stripe Price IDs** — create Products in Stripe Dashboard, paste IDs in admin panel | PRO button is dead without this | ⬜ |
| 2 | **SMTP connectivity** — fix Docker DNS so verification emails actually send | Users can't verify email, blocked from login | ⬜ |
| 3 | **WhatsApp notification integration** — truckers live on WhatsApp | #1 competitor differentiator per exa.ai research | ⬜ |

---

## 🟠 HIGH

| # | Task | Why | Effort | Status |
|---|------|-----|:---:|:---:|
| 4 | **Trailer/dorse management** — frontend page | Registered module, no UI | 2h | ⬜ |
| 5 | **HGS/Toll tracking** — frontend page | Registered module, no UI | 2h | ⬜ |
| 6 | **Driver leave calendar** — frontend page | Registered module, no UI | 2h | ⬜ |
| 7 | **Billing/Stripe checkout button** — wire frontend | Stripe backend exists, no frontend trigger | 1h | ⬜ |
| 8 | **Admin audit log** — track who changed plans/suspended | Compliance, multi-admin teams | 2h | ⬜ |
| 9 | **Load board match notification** — YUK_VAR ↔ YUK_ARA auto-detect | Phase 3 from yukpanosumoduleimprovements.md | 4h | ⬜ |
| 10 | **Load board "İlgileniyorum" notification to email/WhatsApp** | Already logs interest, doesn't notify owner | 1h | ⬜ |

---

## 🟡 MEDIUM

| # | Task | Why | Effort | Status |
|---|------|-----|:---:|:---:|
| 11 | **Reports module** — basic report generation | Registered module, no implementation | 3h | ⬜ |
| 12 | **Load board saved search alerts** — "Bursa→İstanbul yeni yük var" | Phase 3 — daily engagement | 4h | ⬜ |
| 13 | **Admin real package distribution** — query subscription counts | Overview shows hardcoded placeholder | 30m | ⬜ |
| 14 | **Admin recent registrations** — real last 5 tenants | Overview shows empty list | 30m | ⬜ |
| 15 | **Admin country management UI** — add/edit countries | Only TR exists, no UI to add | 3h | ⬜ |
| 16 | **Admin module toggle per country/plan** — feature flag UI | Modules visible, toggles untested | 2h | ⬜ |
| 17 | **Password reset flow** — forgot password | Users locked out without Google login | 2h | ⬜ |
| 18 | **Fuel price tracking widget** — compare to EPDK prices | #1 Turkish trucker pain point | 2h | ⬜ |

---

## 🟢 LOW

| # | Task | Why | Effort | Status |
|---|------|-----|:---:|:---:|
| 19 | **Yük Panosu rating system** — 5-star after transaction | Trust building | 6h | ⬜ |
| 20 | **PRO/PREMIUM verified badge** — on listings | Monetization incentive | 1h | ⬜ |
| 21 | **Yük Panosu anti-spam** — duplicate city/city/date detection | Board quality | 1h | ⬜ |
| 22 | **Dashboard "Bu Ay Özet" KPI card** — gelir/gider/kar | Quick profit snapshot | 1h | ⬜ |
| 23 | **Database backup automation** — cron job for pg_dump | Disaster recovery | 30m | ⬜ |
| 24 | **Production reverse proxy** upgrade — Caddy → full Traefik | Long-term scalability | 8h | ⬜ |
| 25 | **Email digests** — weekly summary to active users | Retention | 4h | ⬜ |
| 26 | **Settings page notification toggles** — wire to backend | Currently tagged "Yakında" | 1h | ⬜ |

---

## ✅ DONE (Last 24h)

| # | Task | Commit |
|---|------|--------|
| ✅ | Fuel logging module (frontend + backend) | v2.28 |
| ✅ | Maintenance module (frontend + backend) | v2.28 |
| ✅ | Auto-sync fuel/maintenance to expenses | v2.29 |
| ✅ | User management (create personnel + permissions) | v2.30/v2.33 |
| ✅ | Android APK (4.7MB debug build) | v2.32 |
| ✅ | CI/CD pipeline (test 8/8 + deploy) | v2.32 |
| ✅ | Settings page (real API, PRO upgrade) | v2.27 |
| ✅ | Admin panel (all 10 APIs fixed) | v2.24 |
| ✅ | Google login fix (local JWT decode) | v2.12 |
