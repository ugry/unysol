package handlers

import (
	"context"
	"fmt"
	"net/http"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	requestCount atomic.Int64
	activeConns  atomic.Int64
)

func IncrementRequestCount() {
	requestCount.Add(1)
}

func IncrementActiveConns() {
	activeConns.Add(1)
}

func DecrementActiveConns() {
	activeConns.Add(-1)
}

type SystemHandler struct {
	DB *pgxpool.Pool
}

func (h *SystemHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.DB.Ping(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "unhealthy",
			"db":     "disconnected",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{
		"status": "healthy",
		"db":     "connected",
	})
}

func (h *SystemHandler) Ready(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	if err := h.DB.Ping(ctx); err != nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"status": "not ready",
			"reason": "database unreachable",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ready"})
}

func (h *SystemHandler) Live(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "alive"})
}

func (h *SystemHandler) Metrics(w http.ResponseWriter, r *http.Request) {
	body := fmt.Sprintf(
		"# HELP http_requests_total Total number of HTTP requests\n"+
			"# TYPE http_requests_total counter\n"+
			"http_requests_total %d\n"+
			"# HELP http_active_connections Current number of active connections\n"+
			"# TYPE http_active_connections gauge\n"+
			"http_active_connections %d\n",
		requestCount.Load(),
		activeConns.Load(),
	)
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(body))
}
