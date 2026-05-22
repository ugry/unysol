package middleware

import (
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

var (
	actionLogFile *os.File
	actionLogMu   sync.Mutex
)

func InitActionLog(path string) error {
	actionLogMu.Lock()
	defer actionLogMu.Unlock()

	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	actionLogFile = f
	return nil
}

func CloseActionLog() {
	actionLogMu.Lock()
	defer actionLogMu.Unlock()
	if actionLogFile != nil {
		actionLogFile.Close()
	}
}

func LogAction(userID, tenantID, role, method, path, summary string) {
	actionLogMu.Lock()
	defer actionLogMu.Unlock()

	if actionLogFile == nil {
		return
	}

	timestamp := time.Now().UTC().Format(time.RFC3339)
	entry := fmt.Sprintf("%s [%s] user=%s tenant=%s role=%s %s %s | %s\n",
		timestamp, method, userID, tenantID, role, method, path, summary)

	actionLogFile.WriteString(entry)
}

func ActionLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" && r.Method != "PUT" && r.Method != "DELETE" && r.Method != "PATCH" {
			next.ServeHTTP(w, r)
			return
		}

		userID := GetUserID(r.Context())
		tenantID := GetTenantID(r.Context())
		role := GetRole(r.Context())

		ww := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(ww, r)

		action := "UNKNOWN"
		switch r.Method {
		case "POST":
			action = "CREATE"
		case "PUT", "PATCH":
			action = "UPDATE"
		case "DELETE":
			action = "DELETE"
		}

		path := r.URL.Path
		module := "system"
		parts := strings.Split(strings.Trim(path, "/"), "/")
		if len(parts) >= 3 && parts[0] == "api" {
			module = parts[2]
			if len(parts) >= 4 {
				module = parts[3]
			}
		}

		status := "OK"
		if ww.status >= 400 {
			status = fmt.Sprintf("FAIL(%d)", ww.status)
		}

		summary := fmt.Sprintf("%s %s %s", action, module, status)
		LogAction(userID, tenantID, role, r.Method, r.URL.Path, summary)
	})
}

func StartActionLogFlusher(interval time.Duration) {
	go func() {
		for {
			time.Sleep(interval)
			actionLogMu.Lock()
			if actionLogFile != nil {
				actionLogFile.Sync()
			}
			actionLogMu.Unlock()
		}
	}()
}

func StartActionLogRotator(basePath string) {
	go func() {
		for {
			now := time.Now()
			next := now.Add(24 * time.Hour)
			next = time.Date(next.Year(), next.Month(), next.Day(), 0, 0, 0, 0, next.Location())
			time.Sleep(next.Sub(now))

			actionLogMu.Lock()
			if actionLogFile != nil {
				actionLogFile.Close()
			}
			date := time.Now().Format("2006-01-02")
			rotatedPath := fmt.Sprintf("%s.%s", basePath, date)
			os.Rename(basePath, rotatedPath)

			f, err := os.OpenFile(basePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
			if err != nil {
				slog.Error("failed to rotate action log", "error", err)
			} else {
				actionLogFile = f
			}
			actionLogMu.Unlock()
		}
	}()
}
