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

type LoadBoardHandler struct {
	DB *pgxpool.Pool
}

func (h *LoadBoardHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *LoadBoardHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	ttype := r.URL.Query().Get("type")
	status := r.URL.Query().Get("status")

	query := `SELECT id, tenant_id, user_id, type, from_city, to_city, load_date,
		weight_kg, vehicle_type, price, description, status, contact_phone, created_at
		FROM load_board WHERE tenant_id = $1`
	args := []interface{}{tenantID}
	argN := 2

	if ttype != "" {
		query += ` AND type = $` + itoa(argN)
		args = append(args, ttype)
		argN++
	}
	if status != "" {
		query += ` AND status = $` + itoa(argN)
		args = append(args, status)
		argN++
	}
	query += ` ORDER BY load_date DESC LIMIT 500`

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to list load board", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list")
		return
	}
	defer rows.Close()

	loads := make([]models.LoadBoard, 0)
	for rows.Next() {
		var lb models.LoadBoard
		var loadDate time.Time
		if err := rows.Scan(&lb.ID, &lb.TenantID, &lb.UserID, &lb.Type, &lb.FromCity, &lb.ToCity,
			&loadDate, &lb.WeightKg, &lb.VehicleType, &lb.Price, &lb.Description,
			&lb.Status, &lb.ContactPhone, &lb.CreatedAt); err != nil {
			slog.Error("failed to scan load board", "error", err)
			continue
		}
		lb.LoadDate = loadDate.Format("2006-01-02")
		loads = append(loads, lb)
	}
	writeJSON(w, http.StatusOK, loads)
}

func (h *LoadBoardHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req models.CreateLoadBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Type == "" || req.FromCity == "" || req.ToCity == "" || req.LoadDate == "" {
		writeError(w, http.StatusBadRequest, "type, from_city, to_city, and load_date are required")
		return
	}

	uid, _ := strconv.Atoi(userID)

	var lb models.LoadBoard
	var loadDate time.Time
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO load_board (tenant_id, user_id, type, from_city, to_city, load_date, weight_kg, vehicle_type, price, description, contact_phone)
		 VALUES ($1,$2,$3,$4,$5,$6::date,$7,$8,$9,$10,$11)
		 RETURNING id, tenant_id, user_id, type, from_city, to_city, load_date, weight_kg, vehicle_type, price, description, status, contact_phone, created_at`,
		tenantID, uid, req.Type, req.FromCity, req.ToCity, req.LoadDate,
		nullFloat(req.WeightKg), nullString(req.VehicleType), nullFloat(req.Price),
		nullString(req.Description), nullString(req.ContactPhone),
	).Scan(&lb.ID, &lb.TenantID, &lb.UserID, &lb.Type, &lb.FromCity, &lb.ToCity,
		&loadDate, &lb.WeightKg, &lb.VehicleType, &lb.Price, &lb.Description,
		&lb.Status, &lb.ContactPhone, &lb.CreatedAt)
	if err != nil {
		slog.Error("failed to create load board", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create")
		return
	}
	lb.LoadDate = loadDate.Format("2006-01-02")
	writeJSON(w, http.StatusCreated, lb)
}

func (h *LoadBoardHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req models.CreateLoadBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var lb models.LoadBoard
	var loadDate time.Time
	err := h.DB.QueryRow(r.Context(),
		`UPDATE load_board SET
		 type = COALESCE(NULLIF($1, ''), type),
		 from_city = COALESCE(NULLIF($2, ''), from_city),
		 to_city = COALESCE(NULLIF($3, ''), to_city),
		 load_date = COALESCE(NULLIF($4, '')::date, load_date),
		 weight_kg = COALESCE($5, weight_kg),
		 vehicle_type = COALESCE(NULLIF($6, ''), vehicle_type),
		 price = COALESCE($7, price),
		 description = COALESCE(NULLIF($8, ''), description),
		 contact_phone = COALESCE(NULLIF($9, ''), contact_phone)
		 WHERE id = $10 AND tenant_id = $11
		 RETURNING id, tenant_id, user_id, type, from_city, to_city, load_date, weight_kg, vehicle_type, price, description, status, contact_phone, created_at`,
		req.Type, req.FromCity, req.ToCity, req.LoadDate,
		nullFloat(req.WeightKg), nullString(req.VehicleType), nullFloat(req.Price),
		nullString(req.Description), nullString(req.ContactPhone),
		id, tenantID,
	).Scan(&lb.ID, &lb.TenantID, &lb.UserID, &lb.Type, &lb.FromCity, &lb.ToCity,
		&loadDate, &lb.WeightKg, &lb.VehicleType, &lb.Price, &lb.Description,
		&lb.Status, &lb.ContactPhone, &lb.CreatedAt)
	if err != nil {
		slog.Error("failed to update load board", "error", err)
		writeError(w, http.StatusNotFound, "load not found")
		return
	}
	lb.LoadDate = loadDate.Format("2006-01-02")
	writeJSON(w, http.StatusOK, lb)
}

func (h *LoadBoardHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	result, err := h.DB.Exec(r.Context(),
		`DELETE FROM load_board WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete")
		return
	}
	if result.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "load not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func nullFloat(v float64) interface{} {
	if v == 0 {
		return nil
	}
	return v
}

func nullString(v string) interface{} {
	if v == "" {
		return nil
	}
	return v
}
