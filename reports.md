# reports.md — Technical Details

> Module: reports (Raporlama) | Category: ANALYTICS | is_core: FALSE

## Database Schema (No New Tables)

Reports are pure SQL aggregation queries. No schema changes needed.

## Backend: `internal/handlers/reports.go`

**Handler:** `ReportsHandler` with `*pgxpool.Pool`  
**Routes:** `/api/tenant/reports/*`  
**Auth:** Tenant JWT + RequireTenant

### Endpoints

#### GET /api/tenant/reports/summary
Returns KPIs for the period. Query aggregates:
```sql
SELECT
  (SELECT COALESCE(SUM(ucret),0) FROM trips WHERE tenant_id=$1 AND cikis_tarihi BETWEEN $2 AND $3 AND durum='TAMAMLANDI') as total_revenue,
  (SELECT COALESCE(SUM(tutar),0) FROM expenses WHERE tenant_id=$1 AND tarih BETWEEN $2 AND $3) as total_expenses,
  (SELECT COUNT(*) FROM trips WHERE tenant_id=$1 AND cikis_tarihi BETWEEN $2 AND $3) as total_trips,
  (SELECT COUNT(DISTINCT kamyon_id) FROM trips WHERE tenant_id=$1 AND cikis_tarihi BETWEEN $2 AND $3) as active_trucks
```

#### GET /api/tenant/reports/revenue-expenses
Monthly breakdown:
```sql
SELECT
  to_char(date_trunc('month', cikis_tarihi), 'YYYY-MM') as month,
  COALESCE(SUM(t.revenue),0) as revenue,
  COALESCE(e.expenses,0) as expenses,
  COALESCE(SUM(t.revenue),0) - COALESCE(e.expenses,0) as profit
FROM trips t
LEFT JOIN (SELECT date_trunc('month', tarih) as m, SUM(tutar) as expenses FROM expenses WHERE tenant_id=$1 AND tarih BETWEEN $2 AND $3 GROUP BY 1) e ON e.m = date_trunc('month', t.cikis_tarihi)
WHERE t.tenant_id=$1 AND t.cikis_tarihi BETWEEN $2 AND $3
GROUP BY 1, e.expenses ORDER BY 1
```

#### GET /api/tenant/reports/profit-per-truck
```sql
SELECT
  tr.id, tr.plaka, tr.marka, tr.model,
  COUNT(t.id) as trip_count,
  COALESCE(SUM(t.ucret),0) as total_revenue,
  COALESCE(SUM(f.toplam_tutar),0) as fuel_cost,
  COALESCE(SUM(m.tutar),0) as maintenance_cost,
  COALESCE(SUM(t.ucret),0) - COALESCE(SUM(f.toplam_tutar),0) - COALESCE(SUM(m.tutar),0) as profit
FROM trucks tr
LEFT JOIN trips t ON t.kamyon_id = tr.id AND t.cikis_tarihi BETWEEN $2 AND $3 AND t.durum='TAMAMLANDI'
LEFT JOIN fuel_logs f ON f.arac_id = tr.id AND f.tarih BETWEEN $2 AND $3
LEFT JOIN maintenance_records m ON m.arac_id = tr.id AND m.tarih BETWEEN $2 AND $3
WHERE tr.tenant_id=$1 AND tr.aktif=true
GROUP BY tr.id ORDER BY profit DESC
```

#### GET /api/tenant/reports/profit-per-driver
```sql
SELECT
  e.id, e.ad_soyad,
  COUNT(t.id) as trip_count,
  COALESCE(SUM(t.ucret),0) as total_revenue,
  COALESCE(SUM(t.ucret),0) / NULLIF(COUNT(t.id),0) as avg_revenue_per_trip
FROM employees e
LEFT JOIN trips t ON t.sofor_id = e.id AND t.cikis_tarihi BETWEEN $2 AND $3 AND t.durum='TAMAMLANDI'
WHERE e.tenant_id=$1 AND e.rol='SOFOR' AND e.aktif=true
GROUP BY e.id ORDER BY total_revenue DESC
```

## Frontend: `pages/ReportsPage.tsx`

### State Management
- `activeTab`: 'summary' | 'revenue' | 'truck' | 'driver' | 'categories'
- `startDate`, `endDate`: defaults to current month
- `data`: fetched per-tab from API
- `loading`, `error`

### Components
- Recharts: BarChart (revenue vs expenses), PieChart (categories), BarChart (per-truck profit), BarChart (per-driver)
- Summary KPI cards (4)
- DateRangePicker (simple start/end date inputs)
- Export buttons per report

### Page Title
MainLayout: `'/dashboard/reports': 'Raporlar'`

### Sidebar
Icon: `BarChart3` from lucide-react  
Label: "Raporlar"  
Path: `/dashboard/reports`

## Route Registration
- `App.tsx`: `<Route path="/dashboard/reports" element={<ReportsPage />} />`
- `Sidebar.tsx`: `{ path: '/dashboard/reports', label: 'Raporlar', icon: BarChart3, moduleKey: 'reports' }`
- `MainLayout.tsx`: `'/dashboard/reports': 'Raporlar'`
