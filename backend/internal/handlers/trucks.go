package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type TrucksHandler struct {
	DB *pgxpool.Pool
}

func (h *TrucksHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{id}", h.Get)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *TrucksHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, plaka, marka, model, yil, tracking_source, aktif, created_at, updated_at
		 FROM trucks WHERE tenant_id = $1 AND aktif = true ORDER BY id DESC`, tenantID)
	if err != nil {
		slog.Error("failed to list trucks", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to list trucks")
		return
	}
	defer rows.Close()

	trucks := make([]models.Truck, 0)
	for rows.Next() {
		var t models.Truck
		if err := rows.Scan(&t.ID, &t.TenantID, &t.Plaka, &t.Marka, &t.Model, &t.Yil,
			&t.TrackingSource, &t.Aktif, &t.CreatedAt, &t.UpdatedAt); err != nil {
			slog.Error("failed to scan truck", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan truck")
			return
		}
		trucks = append(trucks, t)
	}

	writeJSON(w, http.StatusOK, trucks)
}

func (h *TrucksHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req models.TruckCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Plaka == "" {
		writeError(w, http.StatusBadRequest, "plaka is required")
		return
	}

	if req.TrackingSource == "" {
		req.TrackingSource = "MANUEL"
	}

	var truck models.Truck
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO trucks (tenant_id, plaka, marka, model, yil, tracking_source)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, tenant_id, plaka, marka, model, yil, tracking_source, aktif, created_at, updated_at`,
		tenantID, req.Plaka, req.Marka, req.Model, req.Yil, req.TrackingSource,
	).Scan(&truck.ID, &truck.TenantID, &truck.Plaka, &truck.Marka, &truck.Model, &truck.Yil,
		&truck.TrackingSource, &truck.Aktif, &truck.CreatedAt, &truck.UpdatedAt)
	if err != nil {
		slog.Error("failed to create truck", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to create truck")
		return
	}

	writeJSON(w, http.StatusCreated, truck)
}

func (h *TrucksHandler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var truck models.Truck
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, plaka, marka, model, yil, tracking_source, aktif, created_at, updated_at
		 FROM trucks WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&truck.ID, &truck.TenantID, &truck.Plaka, &truck.Marka, &truck.Model, &truck.Yil,
		&truck.TrackingSource, &truck.Aktif, &truck.CreatedAt, &truck.UpdatedAt)
	if err != nil {
		slog.Error("failed to get truck", "error", err, "id", id, "tenant_id", tenantID)
		writeError(w, http.StatusNotFound, "truck not found")
		return
	}

	writeJSON(w, http.StatusOK, truck)
}

func (h *TrucksHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req models.TruckCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var truck models.Truck
	err = h.DB.QueryRow(r.Context(),
		`UPDATE trucks SET
		 plaka = COALESCE(NULLIF($1, ''), plaka),
		 marka = COALESCE(NULLIF($2, ''), marka),
		 model = COALESCE(NULLIF($3, ''), model),
		 yil = COALESCE(NULLIF($4, 0), yil),
		 tracking_source = COALESCE(NULLIF($5, ''), tracking_source),
		 updated_at = $6
		 WHERE id = $7 AND tenant_id = $8
		 RETURNING id, tenant_id, plaka, marka, model, yil, tracking_source, aktif, created_at, updated_at`,
		req.Plaka, req.Marka, req.Model, req.Yil, req.TrackingSource, time.Now(),
		id, tenantID,
	).Scan(&truck.ID, &truck.TenantID, &truck.Plaka, &truck.Marka, &truck.Model, &truck.Yil,
		&truck.TrackingSource, &truck.Aktif, &truck.CreatedAt, &truck.UpdatedAt)
	if err != nil {
		slog.Error("failed to update truck", "error", err, "id", id, "tenant_id", tenantID)
		writeError(w, http.StatusNotFound, "truck not found")
		return
	}

	writeJSON(w, http.StatusOK, truck)
}

func (h *TrucksHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`UPDATE trucks SET aktif = false, updated_at = $1 WHERE id = $2 AND tenant_id = $3`,
		time.Now(), id, tenantID)
	if err != nil {
		slog.Error("failed to delete truck", "error", err, "id", id, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to delete truck")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "truck not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "truck deactivated"})
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, models.ErrorResponse{Error: message})
}

