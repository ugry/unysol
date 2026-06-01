package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type SettingsHandler struct {
	DB *pgxpool.Pool
}

func (h *SettingsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.Get)
	r.Put("/", h.Update)
	r.Put("/notifications", h.UpdateNotifications)
	return r
}

func (h *SettingsHandler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, key, value, created_at, updated_at
		 FROM settings WHERE tenant_id = $1 ORDER BY key`, tenantID)
	if err != nil {
		slog.Error("failed to get settings", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to get settings")
		return
	}
	defer rows.Close()

	settings := make([]models.Setting, 0)
	var notifPrefs string
	for rows.Next() {
		var s models.Setting
		if err := rows.Scan(&s.ID, &s.TenantID, &s.Key, &s.Value, &s.CreatedAt, &s.UpdatedAt); err != nil {
			slog.Error("failed to scan setting", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan setting")
			return
		}
		if s.Key == "notification_prefs" {
			notifPrefs = s.Value
		} else {
			settings = append(settings, s)
		}
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	resp := models.TenantSettingsResponse{
		Settings:      settings,
		Notifications: notifPrefs,
	}

	writeJSON(w, http.StatusOK, resp)
}

func (h *SettingsHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var input map[string]string
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(input) == 0 {
		writeError(w, http.StatusBadRequest, "request body is empty")
		return
	}

	for key, value := range input {
		if key == "notification_prefs" {
			continue
		}
		_, err := h.DB.Exec(r.Context(),
			`INSERT INTO settings (tenant_id, key, value)
			 VALUES ($1, $2, $3)
			 ON CONFLICT (tenant_id, key) DO UPDATE SET value = $3, updated_at = $4`,
			tenantID, key, value, time.Now())
		if err != nil {
			slog.Error("failed to update setting", "error", err, "tenant_id", tenantID, "key", key)
			writeError(w, http.StatusInternalServerError, "failed to update settings")
			return
		}
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Success: true, Message: "settings updated"})
}

func (h *SettingsHandler) UpdateNotifications(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var input map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	prefsJSON, err := json.Marshal(input)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid notification preferences")
		return
	}

	_, err = h.DB.Exec(r.Context(),
		`INSERT INTO settings (tenant_id, key, value)
		 VALUES ($1, 'notification_prefs', $2)
		 ON CONFLICT (tenant_id, key) DO UPDATE SET value = $2, updated_at = $3`,
		tenantID, string(prefsJSON), time.Now())
	if err != nil {
		slog.Error("failed to update notification preferences", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to update notification preferences")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Success: true, Message: "notification preferences updated"})
}
