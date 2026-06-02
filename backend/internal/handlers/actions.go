package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type ActionsHandler struct {
	DB *pgxpool.Pool
}

func (h *ActionsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant(h.DB))
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Post("/{id}/revert", h.Revert)
	return r
}

func (h *ActionsHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req models.ActionCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		slog.Error("failed to decode action request", "error", err, "tenant_id", tenantID)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "invalid request body: " + err.Error(), "success": false})
		return
	}

	if req.ActionType == "" {
		writeJSON(w, http.StatusBadRequest, "action_type is required")
		return
	}
	if req.TableName == "" {
		writeJSON(w, http.StatusBadRequest, "table_name is required")
		return
	}

	var action models.Action
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO actions (tenant_id, action_type, table_name, record_id, record_data, summary)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, tenant_id, user_id, action_type, table_name, record_id, record_data, summary, created_at`,
		tenantID, req.ActionType, req.TableName, req.RecordID, req.RecordData, req.Summary,
	).Scan(&action.ID, &action.TenantID, &action.UserID, &action.ActionType, &action.TableName,
		&action.RecordID, &action.RecordData, &action.Summary, &action.CreatedAt)
	if err != nil {
		slog.Error("failed to create action", "error", err, "tenant_id", tenantID)
		writeJSON(w, http.StatusInternalServerError, "failed to create action")
		return
	}

	writeJSON(w, http.StatusCreated, action)
}

func (h *ActionsHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	tableName := r.URL.Query().Get("table_name")
	actionType := r.URL.Query().Get("action_type")
	limitStr := r.URL.Query().Get("limit")

	limit := 50
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 200 {
			limit = l
		}
	}

	query := `SELECT id, tenant_id, user_id, action_type, table_name, record_id, record_data, summary, created_at
		FROM actions WHERE tenant_id = $1`
	args := []interface{}{tenantID}
	argIdx := 2

	if tableName != "" {
		query += " AND table_name = $" + strconv.Itoa(argIdx)
		args = append(args, tableName)
		argIdx++
	}
	if actionType != "" {
		query += " AND action_type = $" + strconv.Itoa(argIdx)
		args = append(args, actionType)
		argIdx++
	}

	query += " ORDER BY created_at DESC LIMIT $" + strconv.Itoa(argIdx)
	args = append(args, limit)

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to list actions", "error", err, "tenant_id", tenantID)
		writeJSON(w, http.StatusInternalServerError, "failed to list actions")
		return
	}
	defer rows.Close()

	actions := make([]models.Action, 0)
	for rows.Next() {
		var a models.Action
		if err := rows.Scan(&a.ID, &a.TenantID, &a.UserID, &a.ActionType, &a.TableName,
			&a.RecordID, &a.RecordData, &a.Summary, &a.CreatedAt); err != nil {
			slog.Error("failed to scan action", "error", err)
			writeJSON(w, http.StatusInternalServerError, "failed to scan action")
			return
		}
		actions = append(actions, a)
	}

	writeJSON(w, http.StatusOK, actions)
}

func (h *ActionsHandler) Revert(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	idStr := chi.URLParam(r, "id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, "invalid id")
		return
	}

	var action models.Action
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, user_id, action_type, table_name, record_id, record_data, summary, created_at
		 FROM actions WHERE id = $1 AND tenant_id = $2`,
		id, tenantID,
	).Scan(&action.ID, &action.TenantID, &action.UserID, &action.ActionType, &action.TableName,
		&action.RecordID, &action.RecordData, &action.Summary, &action.CreatedAt)
	if err != nil {
		writeJSON(w, http.StatusNotFound, "action not found")
		return
	}

	if action.RecordData == nil || len(*action.RecordData) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "no record data to restore", "success": false})
		return
	}

	// Parse record data to build dynamic INSERT
	var recordMap map[string]interface{}
	if err := json.Unmarshal(*action.RecordData, &recordMap); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "invalid record data", "success": false})
		return
	}

	// Check if record already exists (soft-delete case) — UPDATE instead of INSERT
	if action.RecordID != nil && *action.RecordID != "" {
		var exists bool
		checkQuery := fmt.Sprintf(`SELECT EXISTS(SELECT 1 FROM %s WHERE id = $1)`, action.TableName)
		h.DB.QueryRow(r.Context(), checkQuery, *action.RecordID).Scan(&exists)
		
		if exists {
			// Reactivate the soft-deleted record
			updateQuery := fmt.Sprintf(`UPDATE %s SET aktif = true WHERE id = $1`, action.TableName)
			_, err = h.DB.Exec(r.Context(), updateQuery, *action.RecordID)
			if err != nil {
				slog.Error("failed to reactivate record", "error", err, "table", action.TableName)
				writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": "failed to reactivate: " + err.Error(), "success": false})
				return
			}
			h.DB.Exec(r.Context(),
				`INSERT INTO actions (tenant_id, action_type, table_name, record_id, record_data, summary)
				 VALUES ($1, 'CREATE', $2, $3, $4, $5)`,
				tenantID, action.TableName, action.RecordID, action.RecordData, "Otomatik geri alma (reactivate)")
			writeJSON(w, http.StatusOK, map[string]string{"status": "reactivated", "table": action.TableName})
			return
		}
	}

	// Build column list and values, skipping auto-generated columns
	skipCols := map[string]bool{"id": true, "created_at": true, "updated_at": true}
	var cols []string
	var placeholders []string
	var values []interface{}
	idx := 1

	for key, val := range recordMap {
		if skipCols[key] {
			continue
		}
		cols = append(cols, key)
		placeholders = append(placeholders, fmt.Sprintf("$%d", idx))
		values = append(values, val)
		idx++
	}

	if len(cols) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "no columns to restore", "success": false})
		return
	}

	query := fmt.Sprintf(
		`INSERT INTO %s (%s) VALUES (%s)`,
		action.TableName,
		strings.Join(cols, ", "),
		strings.Join(placeholders, ", "),
	)

	_, err = h.DB.Exec(r.Context(), query, values...)
	if err != nil {
		slog.Error("failed to revert action", "error", err, "table", action.TableName)
		writeJSON(w, http.StatusInternalServerError, "failed to revert: "+err.Error())
		return
	}

	// Log the revert
	h.DB.Exec(r.Context(),
		`INSERT INTO actions (tenant_id, action_type, table_name, record_id, record_data, summary)
		 VALUES ($1, 'CREATE', $2, $3, $4, $5)`,
		tenantID, action.TableName, action.RecordID, action.RecordData, "Otomatik geri alma (revert)")

	writeJSON(w, http.StatusOK, map[string]string{"status": "reverted", "table": action.TableName})
}

