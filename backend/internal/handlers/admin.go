package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/models"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

func (h *AdminHandler) ListTenants(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT id, slug, firma_unvani, plan, locale, country_code, durum, created_at
		 FROM tenants ORDER BY id DESC`)
	if err != nil {
		slog.Error("failed to list tenants", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list tenants")
		return
	}
	defer rows.Close()

	tenants := make([]models.Tenant, 0)
	for rows.Next() {
		var t models.Tenant
		if err := rows.Scan(&t.ID, &t.Slug, &t.FirmaUnvani, &t.Plan, &t.Locale,
			&t.CountryCode, &t.Durum, &t.CreatedAt); err != nil {
			slog.Error("failed to scan tenant", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan tenant")
			return
		}
		tenants = append(tenants, t)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, tenants)
}

func (h *AdminHandler) GetTenant(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	var t models.Tenant
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, slug, firma_unvani, plan, locale, country_code, durum, created_at
		 FROM tenants WHERE id = $1`, id).
		Scan(&t.ID, &t.Slug, &t.FirmaUnvani, &t.Plan, &t.Locale,
			&t.CountryCode, &t.Durum, &t.CreatedAt)
	if err != nil {
		slog.Error("failed to get tenant", "error", err, "id", id)
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	writeJSON(w, http.StatusOK, t)
}

func (h *AdminHandler) ChangePlan(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

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
		`UPDATE tenants SET plan = $1 WHERE id = $2`, input.Plan, id)
	if err != nil {
		slog.Error("failed to update tenant plan", "error", err, "id", id)
		writeError(w, http.StatusInternalServerError, "failed to update tenant plan")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "plan updated"})
}

func (h *AdminHandler) SuspendTenant(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`UPDATE tenants SET durum = 'SUSPENDED' WHERE id = $1`, id)
	if err != nil {
		slog.Error("failed to suspend tenant", "error", err, "id", id)
		writeError(w, http.StatusInternalServerError, "failed to suspend tenant")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "tenant suspended"})
}

func (h *AdminHandler) GetMRR(w http.ResponseWriter, r *http.Request) {
	var data models.MRRData
	err := h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(tutar), 0), 'USD', 'current_month'
		 FROM billings
		 WHERE durum = 'PAID' AND tarih >= date_trunc('month', CURRENT_DATE)::text`).
		Scan(&data.MRR, &data.Currency, &data.Period)
	if err != nil {
		slog.Error("failed to calculate MRR", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to calculate MRR")
		return
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *AdminHandler) GetChurn(w http.ResponseWriter, r *http.Request) {
	var data models.ChurnData
	err := h.DB.QueryRow(r.Context(),
		`SELECT
			CASE WHEN COUNT(*) > 0 THEN
				(COUNT(*) FILTER (WHERE durum = 'SUSPENDED'))::float / COUNT(*)::float * 100
			ELSE 0 END,
			COUNT(*),
			COUNT(*) FILTER (WHERE durum = 'SUSPENDED')
		 FROM tenants`).
		Scan(&data.ChurnRate, &data.Total, &data.Suspended)
	if err != nil {
		slog.Error("failed to calculate churn", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to calculate churn")
		return
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *AdminHandler) GetGrowth(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT to_char(created_at, 'YYYY-MM') AS period, COUNT(*) AS signups
		 FROM tenants
		 WHERE created_at >= (CURRENT_DATE - INTERVAL '12 months')::text
		 GROUP BY period ORDER BY period`)
	if err != nil {
		slog.Error("failed to query growth", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to query growth")
		return
	}
	defer rows.Close()

	growth := make([]models.GrowthData, 0)
	for rows.Next() {
		var g models.GrowthData
		if err := rows.Scan(&g.Period, &g.Signups); err != nil {
			slog.Error("failed to scan growth data", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan growth data")
			return
		}
		growth = append(growth, g)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, growth)
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif, last_login, created_at
		 FROM users ORDER BY id DESC`)
	if err != nil {
		slog.Error("failed to list users", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &u.AdSoyad,
			&u.Rol, &u.Telefon, &u.Aktif, &u.LastLogin, &u.CreatedAt); err != nil {
			slog.Error("failed to scan user", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan user")
			return
		}
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, users)
}

func (h *AdminHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.AdSoyad == "" {
		writeError(w, http.StatusBadRequest, "email, password, and ad_soyad are required")
		return
	}

	var user models.User
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif, last_login, created_at`,
		req.TenantID, req.Email, req.Password, req.AdSoyad, req.Rol, req.Telefon,
	).Scan(&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.AdSoyad,
		&user.Rol, &user.Telefon, &user.Aktif, &user.LastLogin, &user.CreatedAt)
	if err != nil {
		slog.Error("failed to create user", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	writeJSON(w, http.StatusCreated, user)
}
