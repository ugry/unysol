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

type PredictionsHandler struct {
	DB *pgxpool.Pool
}

func (h *PredictionsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/12-months", h.TwelveMonthForecast)
	return r
}

func (h *PredictionsHandler) TwelveMonthForecast(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	now := time.Now()

	var avgMonthlyGelir, avgMonthlyGider float64

	err := h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(AVG(monthly_gelir), 0) FROM (
			SELECT DATE_TRUNC('month', baslangic) as ay, SUM(ucret) as monthly_gelir
			FROM trips
			WHERE tenant_id = $1 AND durum = 'tamamlandi'
			AND baslangic >= $2
			GROUP BY DATE_TRUNC('month', baslangic)
			ORDER BY ay DESC LIMIT 6
		) sub`,
		tenantID, now.AddDate(0, -6, 0),
	).Scan(&avgMonthlyGelir)
	if err != nil {
		slog.Error("predictions: failed to get avg monthly gelir", "error", err, "tenant_id", tenantID)
	}

	err = h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(AVG(monthly_gider), 0) FROM (
			SELECT DATE_TRUNC('month', tarih) as ay, SUM(tutar) as monthly_gider
			FROM expenses
			WHERE tenant_id = $1
			AND tarih >= $2
			GROUP BY DATE_TRUNC('month', tarih)
			ORDER BY ay DESC LIMIT 6
		) sub`,
		tenantID, now.AddDate(0, -6, 0),
	).Scan(&avgMonthlyGider)
	if err != nil {
		slog.Error("predictions: failed to get avg monthly gider", "error", err, "tenant_id", tenantID)
	}

	predictions := make([]models.Prediction, 0, 12)
	for i := 0; i < 12; i++ {
		month := now.AddDate(0, i, 0)
		ay := month.Format("2006-01")
		kar := avgMonthlyGelir - avgMonthlyGider

		predictions = append(predictions, models.Prediction{
			Ay:    ay,
			Gelir: &avgMonthlyGelir,
			Gider: &avgMonthlyGider,
			Kar:   &kar,
		})
	}

	writeJSON(w, http.StatusOK, predictions)
}
