package middleware

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"
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

		bodySize := r.ContentLength
		if bodySize < 0 {
			bodySize = 0
		}

		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)

		duration := time.Since(start)

		attrs := []slog.Attr{
			slog.String("method", r.Method),
			slog.String("path", r.URL.Path),
			slog.Int("status", rw.status),
			slog.String("duration", duration.String()),
			slog.Float64("duration_ms", float64(duration.Microseconds())/1000.0),
			slog.String("request_id", requestID),
			slog.Int64("request_size", bodySize),
			slog.Int("response_size", rw.size),
			slog.String("remote_addr", r.RemoteAddr),
			slog.String("user_agent", r.UserAgent()),
		}

		if tenantID := GetTenantID(r.Context()); tenantID != "" {
			attrs = append(attrs, slog.String("tenant_id", tenantID))
		}
		if userID := GetUserID(r.Context()); userID != "" {
			attrs = append(attrs, slog.String("user_id", userID))
		}

		lvl := slog.LevelInfo
		if rw.status >= 500 {
			lvl = slog.LevelError
		} else if rw.status >= 400 {
			lvl = slog.LevelWarn
		}

		slog.LogAttrs(r.Context(), lvl, "http request", attrs...)
	})
}
