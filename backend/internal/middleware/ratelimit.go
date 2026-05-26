package middleware

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

type rateLimitEntry struct {
	mu      sync.Mutex
	count   int
	resetAt time.Time
	limit   int
	window  time.Duration
}

var (
	rateLimitStore sync.Map
	rateLimitMu    sync.Mutex
)

func init() {
	go rateLimitCleanup()
}

func rateLimitCleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		rateLimitStore.Range(func(key, value interface{}) bool {
			entry, ok := value.(*rateLimitEntry)
			if !ok {
				rateLimitStore.Delete(key)
				return true
			}
			entry.mu.Lock()
			if now.After(entry.resetAt.Add(2 * time.Minute)) {
				entry.mu.Unlock()
				rateLimitStore.Delete(key)
			} else {
				entry.mu.Unlock()
			}
			return true
		})
	}
}

func extractIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}

func RateLimit(requestsPerMinute int) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Only rate-limit mutations (POST/PUT/DELETE/PATCH)
			// GET requests are read-only and should not be throttled
			if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
				next.ServeHTTP(w, r)
				return
			}

			ip := extractIP(r)
			key := ip + ":" + formatInt(requestsPerMinute)
			window := 1 * time.Minute

			var entry *rateLimitEntry
			if v, ok := rateLimitStore.Load(key); ok {
				entry = v.(*rateLimitEntry)
			} else {
				entry = &rateLimitEntry{
					resetAt: time.Now().Add(window),
					limit:   requestsPerMinute,
					window:  window,
				}
				rateLimitStore.Store(key, entry)
			}

			entry.mu.Lock()
			now := time.Now()

			if now.After(entry.resetAt) {
				entry.count = 0
				entry.resetAt = now.Add(window)
			}

			entry.count++
			exceeded := entry.count > requestsPerMinute
			entry.mu.Unlock()

			if exceeded {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("Retry-After", "60")
				w.Header().Set("X-RateLimit-Limit", formatInt(entry.limit))
				w.WriteHeader(http.StatusTooManyRequests)
				json.NewEncoder(w).Encode(map[string]string{
					"error": "rate limit exceeded",
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func formatInt(n int) string {
	if n == 0 {
		return "0"
	}
	digits := make([]byte, 0, 20)
	neg := n < 0
	if neg {
		n = -n
	}
	for n > 0 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
		n /= 10
	}
	if neg {
		digits = append([]byte{'-'}, digits...)
	}
	return string(digits)
}
