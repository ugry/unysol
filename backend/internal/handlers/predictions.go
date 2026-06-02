package handlers

import (
	"math"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/logging"
	"unysol/internal/middleware"
	"unysol/internal/models"
)

type PredictionsHandler struct {
	DB *pgxpool.Pool
}

func (h *PredictionsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant(h.DB))
	r.Get("/12-months", h.TwelveMonthForecast)
	r.Post("/recalculate", h.Recalculate)
	return r
}

func (h *PredictionsHandler) TwelveMonthForecast(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	now := time.Now()

	var avgMonthlyGelir, avgMonthlyGider float64
	var monthCount int

	// Get monthly revenue from completed trips (last 6 months)
	rows, err := h.DB.Query(r.Context(),
		`SELECT DATE_TRUNC('month', baslangic_tarih::date) AS ay, SUM(ucret) AS gelir,
		        ROW_NUMBER() OVER (ORDER BY DATE_TRUNC('month', baslangic_tarih::date)) AS month_num
		 FROM trips
		 WHERE tenant_id = $1 AND durum = 'TAMAMLANDI'
		 AND baslangic_tarih::date >= $2
		 GROUP BY ay ORDER BY ay`,
		tenantID, now.AddDate(0, -6, 0).Format("2006-01-02"),
	)
	if err == nil {
		defer rows.Close()
		var totalGelir float64
		for rows.Next() {
			var ay time.Time
			var gelir float64
			var monthNum int
			if rows.Scan(&ay, &gelir, &monthNum) == nil {
				totalGelir += gelir
				monthCount++
			}
		}
		if monthCount > 0 {
			avgMonthlyGelir = totalGelir / float64(monthCount)
		}
	}

	// Get monthly expenses (last 6 months) - tarih is VARCHAR, cast to date
	var expenseMonths int
	rows2, err := h.DB.Query(r.Context(),
		`SELECT DATE_TRUNC('month', tarih::date) AS ay, SUM(tutar) AS gider,
		        ROW_NUMBER() OVER (ORDER BY DATE_TRUNC('month', tarih::date)) AS month_num
		 FROM expenses
		 WHERE tenant_id = $1
		 AND tarih::date >= $2
		 GROUP BY ay ORDER BY ay`,
		tenantID, now.AddDate(0, -6, 0).Format("2006-01-02"),
	)
	if err == nil {
		defer rows2.Close()
		var totalGider float64
		for rows2.Next() {
			var ay time.Time
			var gider float64
			var monthNum int
			if rows2.Scan(&ay, &gider, &monthNum) == nil {
				totalGider += gider
				expenseMonths++
			}
		}
		if expenseMonths > 0 {
			avgMonthlyGider = totalGider / float64(expenseMonths)
		}
	}

	// Fallback: if no trip data, use total customer count for estimation
	if avgMonthlyGelir == 0 {
		var customerCount int
		h.DB.QueryRow(r.Context(),
			`SELECT COUNT(*) FROM customers WHERE tenant_id = $1`, tenantID,
		).Scan(&customerCount)
		if customerCount > 0 {
			avgMonthlyGelir = float64(customerCount) * 5000 // 5000 TL per customer per month
		}
	}
	if avgMonthlyGider == 0 && avgMonthlyGelir > 0 {
		avgMonthlyGider = avgMonthlyGelir * 0.65 // 65% expense ratio
	}
	if avgMonthlyGelir == 0 {
		avgMonthlyGelir = 25000 // minimum estimate
		avgMonthlyGider = 17000
	}

	// Generate 12-month forecast with compound growth
	predictions := make([]models.Prediction, 0, 12)
	for i := 0; i < 12; i++ {
		month := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).AddDate(0, i, 0)
		ay := month.Format("2006-01")
		growthFactor := math.Pow(1+0.02, float64(i)) // 2% monthly compound growth
		seasonalFactor := 1.0 + 0.05*math.Sin(2*math.Pi*float64(i)/12) // ±5% seasonal

		gelir := avgMonthlyGelir * growthFactor * seasonalFactor
		gider := avgMonthlyGider * growthFactor * seasonalFactor
		kar := gelir - gider

		predictions = append(predictions, models.Prediction{
			Ay:    ay,
			Month: month.Format("January 2006"),
			Gelir: &gelir,
			Gider: &gider,
			Kar:   &kar,
		})
	}

	// Persist predictions to DB for dashboard use
	h.DB.Exec(r.Context(), `DELETE FROM predictions WHERE tenant_id = $1`, tenantID)
	for _, p := range predictions {
		h.DB.Exec(r.Context(),
			`INSERT INTO predictions (tenant_id, ay, gelir, gider, kar)
			 VALUES ($1, $2, $3, $4, $5)`,
			tenantID, p.Ay, p.Gelir, p.Gider, p.Kar)
	}

	logging.Action(logging.LevelInfo, tenantID, "", "", "",
		"predictions", "RECALCULATE", "predictions", "",
		map[string]interface{}{
			"avg_gelir":   avgMonthlyGelir,
			"avg_gider":   avgMonthlyGider,
			"months_data": monthCount,
		}, nil)

	writeJSON(w, http.StatusOK, predictions)
}

func (h *PredictionsHandler) Recalculate(w http.ResponseWriter, r *http.Request) {
	h.TwelveMonthForecast(w, r)
}
