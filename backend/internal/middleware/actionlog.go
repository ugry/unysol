package middleware

import (
	"net/http"
	"strings"

	"unysol/internal/logging"
)

func ActionLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" && r.Method != "PUT" && r.Method != "DELETE" && r.Method != "PATCH" {
			next.ServeHTTP(w, r)
			return
		}

		userID := GetUserID(r.Context())
		tenantID := GetTenantID(r.Context())
		role := GetRole(r.Context())
		requestID := r.Header.Get("X-Request-ID")

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
		tableName := "unknown"
		recordID := ""

		parts := strings.Split(strings.Trim(path, "/"), "/")
		if len(parts) >= 3 && parts[0] == "api" {
			if parts[1] == "admin" {
				module = "admin/" + parts[3]
			} else if parts[1] == "tenant" {
				module = parts[2]
				tableName = parts[2]
			} else {
				module = parts[1]
				tableName = parts[1]
			}
			if len(parts) >= 3 {
				tableName = parts[len(parts)-1]
			}
			if len(parts) >= 4 {
				recordID = parts[len(parts)-1]
			}
		}

		// Resolve table name from module
		switch module {
		case "trucks": tableName = "trucks"
		case "trips": tableName = "trips"
		case "customers": tableName = "customers"
		case "invoices": tableName = "invoices"
		case "expenses": tableName = "expenses"
		case "employees": tableName = "employees"
		case "cek-senet": tableName = "cek_senet"
		case "dashboard": tableName = "dashboard"
		case "settings": tableName = "settings"
		case "load-board": tableName = "load_board"
		case "notifications": tableName = "notifications"
		}

		level := logging.LevelInfo
		if ww.status >= 400 {
			level = logging.LevelWarn
		}
		if ww.status >= 500 {
			level = logging.LevelError
		}

		logging.Action(level, tenantID, userID, role, requestID,
			module, action, tableName, recordID, nil, nil)
	})
}
