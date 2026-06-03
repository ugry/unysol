package handlers

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type ReportsHandler struct {
	DB *pgxpool.Pool
}

func (h *ReportsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.Root)
	r.Get("/summary", h.Summary)
	r.Get("/revenue-expenses", h.RevenueExpenses)
	r.Get("/profit-per-truck", h.ProfitPerTruck)
	r.Get("/profit-per-driver", h.ProfitPerDriver)
	r.Get("/category-breakdown", h.CategoryBreakdown)
	return r
}

func (h *ReportsHandler) Root(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"endpoints":["/summary","/revenue-expenses","/profit-per-truck","/profit-per-driver","/category-breakdown"]}`))
}

func getDateRange(r *http.Request) (string, string) {
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")
	if start == "" {
		start = time.Now().AddDate(0, -1, 0).Format("2006-01-02")
	}
	if end == "" {
		end = time.Now().Format("2006-01-02")
	}
	return start, end
}

func (h *ReportsHandler) Summary(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	start, end := getDateRange(r)

	var totalRevenue, totalExpenses float64
	var totalTrips, activeTrucks int
	err := h.DB.QueryRow(r.Context(), `
		SELECT
			COALESCE((SELECT SUM(ucret) FROM trips WHERE tenant_id=$1 AND baslangic_tarih BETWEEN $2 AND $3 AND durum='TAMAMLANDI'), 0),
			COALESCE((SELECT SUM(tutar) FROM expenses WHERE tenant_id=$1 AND tarih BETWEEN $2 AND $3), 0),
			COALESCE((SELECT COUNT(*) FROM trips WHERE tenant_id=$1 AND baslangic_tarih BETWEEN $2 AND $3), 0),
			COALESCE((SELECT COUNT(DISTINCT truck_id) FROM trips WHERE tenant_id=$1 AND baslangic_tarih BETWEEN $2 AND $3), 0)
	`, tenantID, start, end).Scan(&totalRevenue, &totalExpenses, &totalTrips, &activeTrucks)
	if err != nil {
		slog.Error("reports summary failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get report summary")
		return
	}

	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: map[string]interface{}{
		"total_revenue":  totalRevenue,
		"total_expenses": totalExpenses,
		"total_profit":   totalRevenue - totalExpenses,
		"total_trips":    totalTrips,
		"active_trucks":  activeTrucks,
		"period_start":   start,
		"period_end":     end,
	}})
}

func (h *ReportsHandler) RevenueExpenses(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	start, end := getDateRange(r)

	rows, err := h.DB.Query(r.Context(), `
		SELECT
			to_char(d.month, 'YYYY-MM') as month,
			COALESCE(SUM(t.ucret), 0) as revenue,
			COALESCE(e.expense_total, 0) as expenses
		FROM generate_series(
			date_trunc('month', $2::date),
			date_trunc('month', $3::date),
			'1 month'::interval
		) d(month)
		LEFT JOIN trips t ON date_trunc('month', t.baslangic_tarih) = d.month AND t.tenant_id=$1 AND t.durum='TAMAMLANDI'
		LEFT JOIN LATERAL (
			SELECT SUM(tutar) as expense_total FROM expenses WHERE tenant_id=$1 AND date_trunc('month', tarih) = d.month
		) e ON true
		GROUP BY d.month, e.expense_total ORDER BY d.month
	`, tenantID, start, end)
	if err != nil {
		slog.Error("reports revenue failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get revenue report")
		return
	}
	defer rows.Close()

	type MonthReport struct {
		Month    string  `json:"month"`
		Revenue  float64 `json:"revenue"`
		Expenses float64 `json:"expenses"`
		Profit   float64 `json:"profit"`
	}
	var data []MonthReport
	for rows.Next() {
		var m MonthReport
		if err := rows.Scan(&m.Month, &m.Revenue, &m.Expenses); err != nil {
			continue
		}
		m.Profit = m.Revenue - m.Expenses
		data = append(data, m)
	}
	if data == nil {
		data = []MonthReport{}
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})
}

func (h *ReportsHandler) ProfitPerTruck(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	start, end := getDateRange(r)

	rows, err := h.DB.Query(r.Context(), `
		SELECT
			tr.id, tr.plaka, COALESCE(tr.marka,''), COALESCE(tr.model,''),
			COUNT(t.id)::int as trip_count,
			COALESCE(SUM(t.ucret), 0) as total_revenue,
			COALESCE((SELECT SUM(toplam_tutar) FROM fuel_logs WHERE truck_id=tr.id AND tarih BETWEEN $2 AND $3), 0) as fuel_cost,
			COALESCE((SELECT SUM(tutar) FROM maintenance_records WHERE truck_id=tr.id AND tarih BETWEEN $2 AND $3), 0) as maintenance_cost
		FROM trucks tr
		LEFT JOIN trips t ON t.truck_id = tr.id AND t.baslangic_tarih BETWEEN $2 AND $3 AND t.durum='TAMAMLANDI'
		WHERE tr.tenant_id=$1 AND tr.aktif=true
		GROUP BY tr.id ORDER BY total_revenue DESC
	`, tenantID, start, end)
	if err != nil {
		slog.Error("reports truck profit failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get truck report")
		return
	}
	defer rows.Close()

	type TruckReport struct {
		ID              int     `json:"id"`
		Plaka           string  `json:"plaka"`
		Marka           string  `json:"marka"`
		Model           string  `json:"model"`
		TripCount       int     `json:"trip_count"`
		TotalRevenue    float64 `json:"total_revenue"`
		FuelCost        float64 `json:"fuel_cost"`
		MaintenanceCost float64 `json:"maintenance_cost"`
		Profit          float64 `json:"profit"`
	}
	var data []TruckReport
	for rows.Next() {
		var tr TruckReport
		if err := rows.Scan(&tr.ID, &tr.Plaka, &tr.Marka, &tr.Model, &tr.TripCount, &tr.TotalRevenue, &tr.FuelCost, &tr.MaintenanceCost); err != nil {
			continue
		}
		tr.Profit = tr.TotalRevenue - tr.FuelCost - tr.MaintenanceCost
		data = append(data, tr)
	}
	if data == nil {
		data = []TruckReport{}
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})
}

func (h *ReportsHandler) ProfitPerDriver(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	start, end := getDateRange(r)

	rows, err := h.DB.Query(r.Context(), `
		SELECT
			e.id, e.ad_soyad,
			COUNT(t.id)::int as trip_count,
			COALESCE(SUM(t.ucret), 0) as total_revenue
		FROM employees e
		LEFT JOIN trips t ON t.sofor = e.ad_soyad AND t.baslangic_tarih BETWEEN $2 AND $3 AND t.durum='TAMAMLANDI'
		WHERE e.tenant_id=$1 AND (e.rol='SOFOR' OR e.rol='DRIVER') AND e.aktif=true
		GROUP BY e.id ORDER BY total_revenue DESC
	`, tenantID, start, end)
	if err != nil {
		slog.Error("reports driver failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get driver report")
		return
	}
	defer rows.Close()

	type DriverReport struct {
		ID           int     `json:"id"`
		Name         string  `json:"name"`
		TripCount    int     `json:"trip_count"`
		TotalRevenue float64 `json:"total_revenue"`
		AvgRevenue   float64 `json:"avg_revenue_per_trip"`
	}
	var data []DriverReport
	for rows.Next() {
		var d DriverReport
		if err := rows.Scan(&d.ID, &d.Name, &d.TripCount, &d.TotalRevenue); err != nil {
			continue
		}
		if d.TripCount > 0 {
			d.AvgRevenue = d.TotalRevenue / float64(d.TripCount)
		}
		data = append(data, d)
	}
	if data == nil {
		data = []DriverReport{}
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})
}

func (h *ReportsHandler) CategoryBreakdown(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	start, end := getDateRange(r)

	rows, err := h.DB.Query(r.Context(), `
		SELECT kategori::text, COUNT(*)::int, COALESCE(SUM(tutar), 0)
		FROM expenses WHERE tenant_id=$1 AND tarih BETWEEN $2 AND $3
		GROUP BY kategori ORDER BY sum DESC
	`, tenantID, start, end)
	if err != nil {
		slog.Error("reports categories failed", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get categories")
		return
	}
	defer rows.Close()

	type CategoryReport struct {
		Category string  `json:"category"`
		Count    int     `json:"count"`
		Total    float64 `json:"total"`
	}
	var data []CategoryReport
	for rows.Next() {
		var c CategoryReport
		if err := rows.Scan(&c.Category, &c.Count, &c.Total); err != nil {
			continue
		}
		data = append(data, c)
	}
	if data == nil {
		data = []CategoryReport{}
	}
	writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})
}
