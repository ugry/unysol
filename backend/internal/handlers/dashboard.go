package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type DashboardHandler struct {
	DB *pgxpool.Pool
}

func (h *DashboardHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/summary", h.Summary)
	return r
}

func (h *DashboardHandler) Summary(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	now := time.Now()

	var summary models.DashboardSummary

	err := h.DB.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM trucks WHERE tenant_id = $1 AND aktif = true`,
		tenantID,
	).Scan(&summary.AktifKamyon)
	if err != nil {
		slog.Error("dashboard: failed to get aktif kamyon", "error", err, "tenant_id", tenantID)
	}

	err = h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(ucret), 0) FROM trips
		 WHERE tenant_id = $1 AND DATE(baslangic) = CURRENT_DATE AND durum = 'tamamlandi'`,
		tenantID,
	).Scan(&summary.BugunkuKazanc)
	if err != nil {
		slog.Error("dashboard: failed to get bugunku kazanc", "error", err, "tenant_id", tenantID)
	}

	var gelir, gider float64
	err = h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(ucret), 0) FROM trips
		 WHERE tenant_id = $1 AND durum = 'tamamlandi'
		 AND DATE_TRUNC('month', baslangic) = DATE_TRUNC('month', CURRENT_DATE)`,
		tenantID,
	).Scan(&gelir)
	if err != nil {
		slog.Error("dashboard: failed to get monthly gelir", "error", err, "tenant_id", tenantID)
	}

	err = h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(tutar), 0) FROM expenses
		 WHERE tenant_id = $1
		 AND DATE_TRUNC('month', tarih) = DATE_TRUNC('month', CURRENT_DATE)`,
		tenantID,
	).Scan(&gider)
	if err != nil {
		slog.Error("dashboard: failed to get monthly gider", "error", err, "tenant_id", tenantID)
	}

	summary.BuAyKar = gelir - gider

	err = h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(COALESCE(kalan, genel_toplam)), 0) FROM invoices
		 WHERE tenant_id = $1 AND odeme_durumu IN ('bekleyen', 'kismi_odendi', 'gecikti', 'vadesi_gecti')`,
		tenantID,
	).Scan(&summary.BekleyenTahsilat)
	if err != nil {
		slog.Error("dashboard: failed to get bekleyen tahsilat", "error", err, "tenant_id", tenantID)
	}

	summary.AylikGelir = h.getMonthlyRevenue(r.Context(), tenantID, now)
	summary.SonAktiviteler = h.getRecentActions(r.Context(), tenantID)

	writeJSON(w, http.StatusOK, summary)
}

func (h *DashboardHandler) getMonthlyRevenue(ctx context.Context, tenantID string, now time.Time) []models.MonthlyRevenue {
	revenues := make([]models.MonthlyRevenue, 0, 12)

	for i := 11; i >= 0; i-- {
		month := now.AddDate(0, -i, 0)
		monthStart := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
		monthEnd := monthStart.AddDate(0, 1, 0)

		var gelir, gider float64

		h.DB.QueryRow(ctx,
			`SELECT COALESCE(SUM(ucret), 0) FROM trips
			 WHERE tenant_id = $1 AND durum = 'tamamlandi'
			 AND baslangic >= $2 AND baslangic < $3`,
			tenantID, monthStart, monthEnd,
		).Scan(&gelir)

		h.DB.QueryRow(ctx,
			`SELECT COALESCE(SUM(tutar), 0) FROM expenses
			 WHERE tenant_id = $1
			 AND tarih >= $2 AND tarih < $3`,
			tenantID, monthStart, monthEnd,
		).Scan(&gider)

		revenues = append(revenues, models.MonthlyRevenue{
			Ay:    monthStart.Format("2006-01"),
			Gelir: gelir,
			Gider: gider,
		})
	}

	return revenues
}

func (h *DashboardHandler) getRecentActions(ctx context.Context, tenantID string) []models.Action {
	rows, err := h.DB.Query(ctx,
		`SELECT id, tenant_id, user_id, action_type, table_name, record_id, record_data, summary, created_at
		 FROM actions WHERE tenant_id = $1
		 ORDER BY created_at DESC LIMIT 10`,
		tenantID,
	)
	if err != nil {
		slog.Error("dashboard: failed to get recent actions", "error", err, "tenant_id", tenantID)
		return []models.Action{}
	}
	defer rows.Close()

	actions := make([]models.Action, 0)
	for rows.Next() {
		var a models.Action
		if err := rows.Scan(&a.ID, &a.TenantID, &a.UserID, &a.ActionType, &a.TableName,
			&a.RecordID, &a.RecordData, &a.Summary, &a.CreatedAt); err != nil {
			slog.Error("dashboard: failed to scan action", "error", err)
			continue
		}
		actions = append(actions, a)
	}

	return actions
}
