package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type BillingHandler struct {
	DB *pgxpool.Pool
}

func (h *BillingHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/plans", h.GetPlans)
	r.Get("/invoices", h.GetInvoices)
	r.Post("/upgrade", h.Upgrade)
	r.Post("/cancel", h.Cancel)
	return r
}

func (h *BillingHandler) GetPlans(w http.ResponseWriter, r *http.Request) {
	plans := []models.PlanInfo{
		{
			Name:     "FREE",
			Price:    0,
			Currency: "USD",
			Features: []string{"basic_reporting", "single_user"},
		},
		{
			Name:     "PRO",
			Price:    29,
			Currency: "USD",
			Features: []string{"advanced_reporting", "up_to_10_users", "api_access"},
		},
		{
			Name:     "PREMIUM",
			Price:    99,
			Currency: "USD",
			Features: []string{"all_features", "unlimited_users", "priority_support", "custom_integrations"},
		},
	}

	writeJSON(w, http.StatusOK, plans)
}

func (h *BillingHandler) GetInvoices(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, subscription_id, fatura_no, tarih, vade, tutar, kdv, genel_toplam, durum, created_at
		 FROM billing WHERE tenant_id = $1 ORDER BY created_at DESC`, tenantID)
	if err != nil {
		slog.Error("failed to list invoices", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to list invoices")
		return
	}
	defer rows.Close()

	invoices := make([]models.Billing, 0)
	for rows.Next() {
		var inv models.Billing
		if err := rows.Scan(&inv.ID, &inv.TenantID, &inv.SubscriptionID, &inv.FaturaNo,
			&inv.Tarih, &inv.Vade, &inv.Tutar, &inv.Kdv, &inv.GenelToplam, &inv.Durum, &inv.CreatedAt); err != nil {
			slog.Error("failed to scan invoice", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan invoice")
			return
		}
		invoices = append(invoices, inv)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, invoices)
}

func (h *BillingHandler) Upgrade(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var input struct {
		Plan string `json:"plan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Plan != "FREE" && input.Plan != "PRO" && input.Plan != "PREMIUM" {
		writeError(w, http.StatusBadRequest, "invalid plan: must be FREE, PRO, or PREMIUM")
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`UPDATE tenants SET plan = $1 WHERE id = $2`, input.Plan, tenantID)
	if err != nil {
		slog.Error("failed to upgrade plan", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to upgrade plan")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "plan upgraded"})
}

func (h *BillingHandler) Cancel(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	tag, err := h.DB.Exec(r.Context(),
		`UPDATE tenants SET plan = 'FREE', durum = 'SUSPENDED' WHERE id = $1`, tenantID)
	if err != nil {
		slog.Error("failed to cancel subscription", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to cancel subscription")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "subscription cancelled"})
}
