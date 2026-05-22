package handlers

import (
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type NotificationsHandler struct {
	DB *pgxpool.Pool
}

func (h *NotificationsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Put("/{id}/read", h.MarkRead)
	return r
}

func (h *NotificationsHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, user_id, message, read, created_at
		 FROM notifications WHERE tenant_id = $1 ORDER BY created_at DESC`, tenantID)
	if err != nil {
		slog.Error("failed to list notifications", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to list notifications")
		return
	}
	defer rows.Close()

	notifications := make([]models.Notification, 0)
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.TenantID, &n.UserID, &n.Message, &n.Read, &n.CreatedAt); err != nil {
			slog.Error("failed to scan notification", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan notification")
			return
		}
		notifications = append(notifications, n)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, notifications)
}

func (h *NotificationsHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid notification id")
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`UPDATE notifications SET read = true WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if err != nil {
		slog.Error("failed to mark notification as read", "error", err, "id", id, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to mark notification as read")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "notification not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "notification marked as read"})
}
