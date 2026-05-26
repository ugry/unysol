package middleware

import (
	"net/http"
	"time"

	"github.com/google/uuid"
	"unysol/internal/logging"
)

type responseWriter struct {
	http.ResponseWriter
	status int
	size   int
}

func (rw *responseWriter) WriteHeader(status int) {
	rw.status = status
	rw.ResponseWriter.WriteHeader(status)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	size, err := rw.ResponseWriter.Write(b)
	rw.size += size
	return size, err
}

func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}
		w.Header().Set("X-Request-ID", requestID)

		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)

		duration := time.Since(start)

		tenantID := GetTenantID(r.Context())
		userID := GetUserID(r.Context())
		role := GetRole(r.Context())
		ip := r.RemoteAddr

		logging.Access(r.Method, r.URL.Path, ip, tenantID, userID, role, requestID, rw.status, duration)

		if rw.status >= 500 {
			logging.Error(logging.LevelError, nil, tenantID, userID, role, requestID,
				"http", "HTTP "+http.StatusText(rw.status),
				map[string]interface{}{"path": r.URL.Path, "status": rw.status, "duration_ms": float64(duration.Microseconds()) / 1000.0})
		}
	})
}
