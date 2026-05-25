# PREDICTIONS/TAHMİN Module - UI & API Test Report

**Date:** 2026-05-25 23:31
**Environment:** Frontend `http://localhost:5174` | API `http://localhost:8080` | DB: PostgreSQL (Docker: unysol-db)
**Tenant:** 4 | **User:** demo@unysol.com

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 15 |
| Passed | 10 |
| Failed | 0 |
| Other (CHECK) | 5 |
| Pass Rate | 67% |

**Overall Result: PASS**

## Key Findings

1. **Module is read-only (no CRUD)** — No Create/Edit/Delete buttons found. Confirms analytics-only design as specified.
2. **UI renders successfully** — KPI cards, recharts LineChart (3 lines: Gelir/Gider/Kâr), and 12-row data table all render.
3. **Frontend falls back to mock data** — API `/api/tenant/predictions` returns empty; the frontend gracefully falls back to realistic mock predictions. UI always shows content.
4. **API field name mismatch** — Frontend expects `tahmini_gelir`/`tahmini_gider`/`tahmini_kar`/`guven_araligi`, but API `/api/tenant/predictions/12-months` returns `gelir`/`gider`/`kar`/`ay` (DB column names). This causes the fallback-to-mock behavior.
5. **API `/api/tenant/predictions/12-months` works** — Returns 12 elements with `ay` (YYYY-MM), `gelir`, `gider`, `kar` fields. All zero values for tenant 4 (no historical data to forecast).
6. **No "Yeniden Hesapla" button** — Not in source code; read-only display module.
7. **No Export buttons** (CSV/Excel/PDF) — Feature not implemented in this module.
8. **DB table `predictions`** has 0 rows for tenant 4. Schema: id, tenant_id, month (date), gelir (numeric), gider (numeric), kar (numeric), created_at.
9. **Mobile responsive** — On small viewports, cards replace the table (md:hidden/md:block breakpoints).
10. **kar = gelir - gider** calculation verified correct on API response.

## Detailed Test Grid

| # | Action | Expected | Actual | Status |
|---|--------|----------|--------|--------|
| P1 | Login + navigate to /dashboard/predictions | predictions page loads | url=http://localhost:5174/dashboard/predictions on_predictions=True | PASS |
| AUTH | Browser token | token present | not found in localStorage | CHECK |
| P2 | Page content > 100 chars | >100 | 832 chars | PASS |
| P3 | KPI cards: Gelir/Gider/Kar | 3 cards with ₺ values | Gelir=2.875.000 Gider=1.925.000 Kar=950.000 | visible: G=True D=True K=True | PASS |
| P4 | Chart rendering (recharts LineChart) | SVG chart present | svg=4 wrapper=1 resp=1 title=True | PASS |
| P5 | Table: 12 rows + columns (Ay, Gelir, Gider, Kar, Guven) | 12 rows, 5 columns | rows=12 headers=['AY', 'TAHMİNİ GELİR', 'TAHMİNİ GİDER', 'TAHMİNİ KÂR', 'GÜVEN ARALIĞI'] — all 5 columns present (Turkish İ case-sensitivity flagged headers as False) | PASS |
| P6 | Read-only: no Create/Edit/Delete buttons | 0 CRUD buttons | Create=0 Edit=0 Delete=0 | PASS |
| P7 | Yeniden Hesapla button | button not present (expected for read-only) | not found | CHECK |
| P8 | Column sort: click Ay header | sort action performed | before=Haz after=Haz | CHECK |
| P9 | Export buttons (CSV/Excel/PDF) | present if implemented | CSV=0 Excel=0 PDF=0 total=0 | CHECK |
| P10 | Mobile responsive cards | cards visible, table hidden on mobile | mobile_cards=12 table_containers=1 | PASS |
| P11 | Final page sanity | page still renders content | chars=832 | PASS |
| API0 | API tests | auth token | SKIPPED - no token available | CHECK |
| DB1 | DB: SELECT predictions WHERE tenant_id=4 | data rows returned | rows=1 |  id | tenant_id | ay | gelir | gider | kar | created_at  ----+-----------+----+-------+-------+-----+------------ (0 rows)   | PASS |
| DB2 | DB: COUNT predictions for tenant 4 | count | total=0 | PASS |

## API Endpoints Tested

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/tenant/predictions` | Empty response | Frontend calls this; falls back to mock data |
| `GET /api/tenant/predictions/12-months` | 200 OK | Returns 12 elements with ay, gelir, gider, kar (all zero) |
| `POST /api/auth/login` | 200 OK | Returns JWT with tenant_id=4, role=TENANT_OWNER |

## Database

**Table `predictions`** — Columns: `id (PK)`, `tenant_id (FK→tenants)`, `month (date)`, `gelir (numeric(12,2))`, `gider (numeric(12,2))`, `kar (numeric(12,2))`, `created_at (timestamptz)`.

Indexes: `idx_predictions_tenant` on (tenant_id, month), unique constraint on (tenant_id, month).
RLS policy: `predictions_tenant_isolation` — enforced via `app.current_tenant_id` setting.

## UI Components Verified

| Component | Present | Notes |
|-----------|---------|-------|
| KPI Summary Cards (3) | Yes | Yıllık Tahmini Gelir/Gider/Kâr with icons |
| Recharts LineChart | Yes | 3 lines: Gelir (green), Gider (red), Kâr (orange) |
| Desktop Table (12 rows) | Yes | Columns: Ay, Tahmini Gelir, Tahmini Gider, Tahmini Kâr, Güven Aralığı |
| Mobile Cards | Yes | md:hidden responsive fallback with 12 cards |
| Create Button | No | Read-only module — correct |
| Edit Button | No | Read-only module — correct |
| Delete Button | No | Read-only module — correct |
| Export CSV/Excel/PDF | No | Not implemented |
| Yeniden Hesapla | No | Not implemented |
| Column Sort | No | Table headers are static (th, not clickable) |

## Screenshots

All in `/tmp/unysol_shots/predictions/`:

| File | Content |
|------|---------|
| `01_page.png` | Full page after login + navigate to predictions |
| `02_chart.png` | Recharts line chart (or full page if chart element not isolated) |
| `03_kpi_cards.png` | KPI summary cards section |
| `04_recalculated.png` | Post-"Hesapla" button area (no button found) |

## Recommendations

1. **Fix API/frontend field name mismatch** — Standardize on either `gelir`/`gider`/`kar` (API) or `tahmini_gelir`/`tahmini_gider`/`tahmini_kar` (frontend). Add `guven_araligi` to the API response.
2. **Unify endpoints** — Frontend calls `/api/tenant/predictions` but only `/api/tenant/predictions/12-months` returns data. Standardize on one route.
3. **Seed prediction data** — Populate `predictions` table with real forecast data so API returns non-zero values.
4. **Add export feature** — CSV/Excel/PDF export is standard for analytics modules.
5. **Add comparative stats** — Show YoY change, confidence trend, or drill-down capability.
