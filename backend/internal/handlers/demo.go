package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type DemoHandler struct {
	DB *pgxpool.Pool
}

type demoRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Company  string `json:"company"`
}

func (h *DemoHandler) CreateDemo(w http.ResponseWriter, r *http.Request) {
	var req demoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Email = "demo@unysol.com"
		req.Password = "Demo1234!"
		req.FullName = "Demo Kullanıcı"
		req.Company = "Demo Nakliyat"
	}

	if req.Email == "" {
		req.Email = "demo@unysol.com"
	}
	if req.Password == "" {
		req.Password = "Demo1234!"
	}
	if req.Company == "" {
		req.Company = "Demo Nakliyat"
	}
	if req.FullName == "" {
		req.FullName = "Demo Kullanıcı"
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed")
		return
	}

	slug := cleanSlug(strings.ToLower(strings.ReplaceAll(req.Company, " ", "-")))
	if len(slug) > 50 {
		slug = slug[:50]
	}

	// Clean previous demo with same slug
	var existingTenantID int
	h.DB.QueryRow(r.Context(), `SELECT id FROM tenants WHERE slug = $1`, slug).Scan(&existingTenantID)
	if existingTenantID > 0 {
		h.DB.Exec(r.Context(), `DELETE FROM users WHERE tenant_id = $1`, existingTenantID)
		h.DB.Exec(r.Context(), `DELETE FROM tenants WHERE id = $1`, existingTenantID)
	}

	var tenantID int
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO tenants (slug, firma_unvani, plan, locale, country_code, durum)
		 VALUES ($1, $2, 'PRO', 'tr', 'TR', 'AKTIF') RETURNING id`,
		slug, req.Company,
	).Scan(&tenantID)
	if err != nil {
		slog.Error("failed to create demo tenant", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create demo account")
		return
	}

	var userID int
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif)
		 VALUES ($1, $2, $3, $4, 'TENANT_OWNER', '05550000000', true) RETURNING id`,
		tenantID, req.Email, string(passwordHash), req.FullName,
	).Scan(&userID)
	if err != nil {
		slog.Error("failed to create demo user", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create demo account")
		return
	}

	h.DB.Exec(r.Context(), `INSERT INTO subscriptions (tenant_id, plan, baslangic, ucret, status)
		VALUES ($1, 'PRO', CURRENT_DATE::text, 200, 'AKTIF')`, tenantID)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success":      true,
		"email":        req.Email,
		"password":     req.Password,
		"company":      req.Company,
		"tenant_id":    tenantID,
		"message":      "Demo hesap oluşturuldu. Şimdi giriş yapabilirsiniz.",
		"demo_created": true,
	})
}
