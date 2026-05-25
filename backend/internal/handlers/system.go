package handlers

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	requestCount  atomic.Int64
	activeConns   atomic.Int64
	serverStart   = time.Now()
	durationBuckets = []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10}
	durationCounts  [11]atomic.Int64
	durationSum     atomic.Int64
	durationMu      sync.Mutex
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

func RecordRequestDuration(d time.Duration) {
	sec := d.Seconds()
	durationMu.Lock()
	for i, bound := range durationBuckets {
		if sec <= bound {
			durationCounts[i].Add(1)
			break
		}
		if i == len(durationBuckets)-1 {
			durationCounts[i].Add(1)
		}
	}
	durationMu.Unlock()
	durationSum.Add(int64(d.Microseconds()))
}

type SystemHandler struct {
	DB *pgxpool.Pool
}

func (h *SystemHandler) Health(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	dbStatus := "connected"
	if err := h.DB.Ping(ctx); err != nil {
		dbStatus = "disconnected"
		writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{
			"status": "unhealthy",
			"db":     dbStatus,
			"uptime": formatUptime(time.Since(serverStart)),
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status": "healthy",
		"db":     dbStatus,
		"uptime": formatUptime(time.Since(serverStart)),
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
	poolStat := h.DB.Stat()

	totalReqs := requestCount.Load()
	active := activeConns.Load()

	body := "# HELP http_requests_total Total number of HTTP requests\n"
	body += "# TYPE http_requests_total counter\n"
	body += fmt.Sprintf("http_requests_total %d\n", totalReqs)

	body += "# HELP http_request_duration_seconds HTTP request duration in seconds\n"
	body += "# TYPE http_request_duration_seconds histogram\n"
	durationMu.Lock()
	cumulative := int64(0)
	for i, bound := range durationBuckets {
		cumulative += durationCounts[i].Load()
		body += fmt.Sprintf("http_request_duration_seconds_bucket{le=\"%g\"} %d\n", bound, cumulative)
	}
	body += fmt.Sprintf("http_request_duration_seconds_bucket{le=\"+Inf\"} %d\n", cumulative)
	sum := durationSum.Load()
	body += fmt.Sprintf("http_request_duration_seconds_sum %f\n", float64(sum)/1000000.0)
	body += fmt.Sprintf("http_request_duration_seconds_count %d\n", cumulative)
	durationMu.Unlock()

	body += "# HELP http_active_connections Current number of active connections\n"
	body += "# TYPE http_active_connections gauge\n"
	body += fmt.Sprintf("http_active_connections %d\n", active)

	body += "# HELP db_connections_active Active database connections\n"
	body += "# TYPE db_connections_active gauge\n"
	body += fmt.Sprintf("db_connections_active %d\n", poolStat.AcquiredConns())

	body += "# HELP db_connections_idle Idle database connections\n"
	body += "# TYPE db_connections_idle gauge\n"
	body += fmt.Sprintf("db_connections_idle %d\n", poolStat.IdleConns())

	body += "# HELP db_connections_total Total database connections\n"
	body += "# TYPE db_connections_total gauge\n"
	body += fmt.Sprintf("db_connections_total %d\n", poolStat.TotalConns())

	body += "# HELP process_uptime_seconds Server uptime in seconds\n"
	body += "# TYPE process_uptime_seconds gauge\n"
	body += fmt.Sprintf("process_uptime_seconds %d\n", int64(time.Since(serverStart).Seconds()))

	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(body))
}

func formatUptime(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60
	return fmt.Sprintf("%dh%dm%ds", hours, minutes, seconds)
}
