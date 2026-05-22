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

type ModulesHandler struct {
	DB *pgxpool.Pool
}

func (h *ModulesHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Put("/{id}", h.Update)
	r.Get("/country/{code}", h.GetCountryModules)
	r.Put("/country/{code}", h.ToggleCountryModule)
	r.Get("/plan/{plan}", h.GetPlanModules)
	r.Put("/plan/{plan}", h.TogglePlanModule)
	r.Put("/tenant/{id}", h.ToggleTenantModule)
	return r
}

func (h *ModulesHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT id, module_key, module_name, category, is_core, default_enabled, description, created_at
		 FROM modules ORDER BY module_name`)
	if err != nil {
		slog.Error("failed to list modules", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list modules")
		return
	}
	defer rows.Close()

	modules := make([]models.Module, 0)
	for rows.Next() {
		var m models.Module
		if err := rows.Scan(&m.ID, &m.ModuleKey, &m.ModuleName, &m.Category,
			&m.IsCore, &m.DefaultEnabled, &m.Description, &m.CreatedAt); err != nil {
			slog.Error("failed to scan module", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan module")
			return
		}
		modules = append(modules, m)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, modules)
}

func (h *ModulesHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid module id")
		return
	}

	var req models.UpdateModuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	query := `UPDATE modules SET `
	args := []interface{}{}
	argIdx := 1
	updates := false

	if req.ModuleName != nil {
		query += `module_name = $` + strconv.Itoa(argIdx) + `, `
		args = append(args, *req.ModuleName)
		argIdx++
		updates = true
	}
	if req.Category != nil {
		query += `category = $` + strconv.Itoa(argIdx) + `, `
		args = append(args, *req.Category)
		argIdx++
		updates = true
	}
	if req.Description != nil {
		query += `description = $` + strconv.Itoa(argIdx) + `, `
		args = append(args, *req.Description)
		argIdx++
		updates = true
	}
	if req.DefaultEnabled != nil {
		query += `default_enabled = $` + strconv.Itoa(argIdx) + `, `
		args = append(args, *req.DefaultEnabled)
		argIdx++
		updates = true
	}

	if !updates {
		writeError(w, http.StatusBadRequest, "no fields to update")
		return
	}

	query = query[:len(query)-2]
	query += ` WHERE id = $` + strconv.Itoa(argIdx)
	args = append(args, id)

	tag, err := h.DB.Exec(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to update module", "error", err, "id", id)
		writeError(w, http.StatusInternalServerError, "failed to update module")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "module not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "module updated"})
}

func (h *ModulesHandler) GetCountryModules(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	rows, err := h.DB.Query(r.Context(),
		`SELECT cm.id, cm.country_code, cm.module_id, cm.enabled, cm.created_at,
		        m.module_key, m.module_name
		 FROM country_modules cm
		 JOIN modules m ON m.id = cm.module_id
		 WHERE cm.country_code = $1
		 ORDER BY m.module_name`, code)
	if err != nil {
		slog.Error("failed to get country modules", "error", err, "code", code)
		writeError(w, http.StatusInternalServerError, "failed to get country modules")
		return
	}
	defer rows.Close()

	type countryModuleWithInfo struct {
		models.CountryModule
		ModuleKey  string `json:"module_key"`
		ModuleName string `json:"module_name"`
	}

	modules := make([]countryModuleWithInfo, 0)
	for rows.Next() {
		var cm countryModuleWithInfo
		if err := rows.Scan(&cm.ID, &cm.CountryCode, &cm.ModuleID, &cm.Enabled, &cm.CreatedAt,
			&cm.ModuleKey, &cm.ModuleName); err != nil {
			slog.Error("failed to scan country module", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan country module")
			return
		}
		modules = append(modules, cm)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, modules)
}

func (h *ModulesHandler) ToggleCountryModule(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var req models.ToggleModuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	_, err := h.DB.Exec(r.Context(),
		`INSERT INTO country_modules (country_code, module_id, enabled)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (country_code, module_id) DO UPDATE SET enabled = $3`,
		code, req.ModuleID, req.Enabled)
	if err != nil {
		slog.Error("failed to toggle country module", "error", err, "code", code, "module_id", req.ModuleID)
		writeError(w, http.StatusInternalServerError, "failed to toggle country module")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "country module toggled"})
}

func (h *ModulesHandler) GetPlanModules(w http.ResponseWriter, r *http.Request) {
	plan := chi.URLParam(r, "plan")

	rows, err := h.DB.Query(r.Context(),
		`SELECT pm.id, pm.plan, pm.module_id, pm.enabled, pm.created_at,
		        m.module_key, m.module_name
		 FROM plan_modules pm
		 JOIN modules m ON m.id = pm.module_id
		 WHERE pm.plan = $1
		 ORDER BY m.module_name`, plan)
	if err != nil {
		slog.Error("failed to get plan modules", "error", err, "plan", plan)
		writeError(w, http.StatusInternalServerError, "failed to get plan modules")
		return
	}
	defer rows.Close()

	type planModuleWithInfo struct {
		models.PlanModule
		ModuleKey  string `json:"module_key"`
		ModuleName string `json:"module_name"`
	}

	modules := make([]planModuleWithInfo, 0)
	for rows.Next() {
		var pm planModuleWithInfo
		if err := rows.Scan(&pm.ID, &pm.Plan, &pm.ModuleID, &pm.Enabled, &pm.CreatedAt,
			&pm.ModuleKey, &pm.ModuleName); err != nil {
			slog.Error("failed to scan plan module", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan plan module")
			return
		}
		modules = append(modules, pm)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, modules)
}

func (h *ModulesHandler) TogglePlanModule(w http.ResponseWriter, r *http.Request) {
	plan := chi.URLParam(r, "plan")

	var req models.ToggleModuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	_, err := h.DB.Exec(r.Context(),
		`INSERT INTO plan_modules (plan, module_id, enabled)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (plan, module_id) DO UPDATE SET enabled = $3`,
		plan, req.ModuleID, req.Enabled)
	if err != nil {
		slog.Error("failed to toggle plan module", "error", err, "plan", plan, "module_id", req.ModuleID)
		writeError(w, http.StatusInternalServerError, "failed to toggle plan module")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "plan module toggled"})
}

func (h *ModulesHandler) ToggleTenantModule(w http.ResponseWriter, r *http.Request) {
	tenantID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	var req models.ToggleModuleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	_, err = h.DB.Exec(r.Context(),
		`INSERT INTO tenant_modules (tenant_id, module_id, enabled)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (tenant_id, module_id) DO UPDATE SET enabled = $3`,
		tenantID, req.ModuleID, req.Enabled)
	if err != nil {
		slog.Error("failed to toggle tenant module", "error", err, "tenant_id", tenantID, "module_id", req.ModuleID)
		writeError(w, http.StatusInternalServerError, "failed to toggle tenant module")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "tenant module toggled"})
}
