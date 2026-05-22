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

type EmployeesHandler struct {
	DB *pgxpool.Pool
}

func (h *EmployeesHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/", h.List)
	r.Post("/", h.Create)
	return r
}

func (h *EmployeesHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, ad_soyad, COALESCE(rol,''), COALESCE(telefon,''), 
		 COALESCE(ehliyet_bitis::text,''), COALESCE(src_bitis::text,''), created_at
		 FROM employees WHERE tenant_id = $1 ORDER BY id`, tenantID)
	if err != nil {
		slog.Error("failed to list employees", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to list employees")
		return
	}
	defer rows.Close()

	employees := make([]models.Employee, 0)
	for rows.Next() {
		var e models.Employee
		if err := rows.Scan(&e.ID, &e.TenantID, &e.AdSoyad, &e.Rol, &e.Telefon,
			&e.EhliyetBitis, &e.SrcBitis, &e.CreatedAt); err != nil {
			slog.Error("failed to scan employee", "error", err)
			continue
		}
		employees = append(employees, e)
	}

	writeJSON(w, http.StatusOK, employees)
}

func (h *EmployeesHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		AdSoyad      string `json:"ad_soyad"`
		Rol          string `json:"rol"`
		Telefon      string `json:"telefon"`
		EhliyetBitis string `json:"ehliyet_bitis"`
		SrcBitis     string `json:"src_bitis"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.AdSoyad == "" {
		writeError(w, http.StatusBadRequest, "ad_soyad is required")
		return
	}

	var e models.Employee
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO employees (tenant_id, ad_soyad, rol, telefon, ehliyet_bitis, src_bitis)
		 VALUES ($1, $2, $3, $4, $5::date, $6::date)
		 RETURNING id, tenant_id, ad_soyad, COALESCE(rol,''), COALESCE(telefon,''), COALESCE(ehliyet_bitis::text,''), COALESCE(src_bitis::text,''), created_at`,
		tenantID, req.AdSoyad, req.Rol, req.Telefon, req.EhliyetBitis, req.SrcBitis,
	).Scan(&e.ID, &e.TenantID, &e.AdSoyad, &e.Rol, &e.Telefon, &e.EhliyetBitis, &e.SrcBitis, &e.CreatedAt)
	if err != nil {
		slog.Error("failed to create employee", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create employee")
		return
	}

	writeJSON(w, http.StatusCreated, e)
}
