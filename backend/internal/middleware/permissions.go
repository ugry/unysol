package middleware

import (
	"log/slog"
	"net/http"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PermissionEnforcer checks user_permissions for module-level access control.
// TENANT_OWNER has all permissions. Other roles must have explicit permissions.
func PermissionEnforcer(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	// URL path prefix → module_key mapping
	pathToModule := map[string]string{
		"/api/tenant/dashboard":      "dashboard",
		"/api/tenant/trucks":         "truck_tracking",
		"/api/tenant/trips":          "trip_mgmt",
		"/api/tenant/customers":      "customer_mgmt",
		"/api/tenant/invoices":       "invoice_mgmt",
		"/api/tenant/expenses":       "expense_tracking",
		"/api/tenant/employees":      "employee_mgmt",
		"/api/tenant/cek-senet":      "cek_senet",
		"/api/tenant/actions":        "actions",
		"/api/tenant/predictions":    "predictions",
		"/api/tenant/billing":        "billing",
		"/api/tenant/settings":       "settings",
		"/api/tenant/notifications":  "notifications",
		"/api/tenant/load-board":     "load_board",
		"/api/tenant/fuel-logs":      "fuel_logging",
		"/api/tenant/maintenance":    "maintenance",
		"/api/tenant/trailers":       "trailer_mgmt",
		"/api/tenant/toll-logs":      "toll_tracking",
		"/api/tenant/driver-leave":   "driver_leave",
		"/api/tenant/user-management": "tenant_mgmt",
		"/api/tenant/stripe":         "billing",
	}

	// Paths always allowed regardless of permissions
	alwaysAllowed := map[string]bool{
		"/api/tenant/my-permissions": true,
		"/api/tenant/settings":       true,
		"/api/tenant/notifications":  true,
	}

	var mu sync.RWMutex

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetRole(r.Context())
			userID := GetUserID(r.Context())

			// TENANT_OWNER has all access
			if role == "TENANT_OWNER" {
				next.ServeHTTP(w, r)
				return
			}

			// SUPER_ADMIN bypass (admin routes handled separately)
			if role == "SUPER_ADMIN" {
				next.ServeHTTP(w, r)
				return
			}

			// No user ID → can't check permissions
			if userID == "" {
				next.ServeHTTP(w, r)
				return
			}

			// Resolve module_key from URL path
			mu.RLock()
			moduleKey := ""
			for prefix, key := range pathToModule {
				if strings.HasPrefix(r.URL.Path, prefix) {
					moduleKey = key
					break
				}
			}
			mu.RUnlock()

			// Some paths are always allowed (e.g., my-permissions)
			if alwaysAllowed[r.URL.Path] {
				next.ServeHTTP(w, r)
				return
			}

			// If no module mapping, allow (e.g., /api/system/health)
			if moduleKey == "" {
				next.ServeHTTP(w, r)
				return
			}

			// Map HTTP method to permission column
			var permColumn string
			switch r.Method {
			case "GET", "HEAD", "OPTIONS":
				permColumn = "can_view"
			case "POST":
				permColumn = "can_create"
			case "PUT", "PATCH":
				permColumn = "can_edit"
			case "DELETE":
				permColumn = "can_delete"
			default:
				permColumn = "can_view"
			}

			// Check permission in database
			var hasPermission bool
			err := pool.QueryRow(r.Context(),
				`SELECT COALESCE(`+permColumn+`, false)
				 FROM user_permissions
				 WHERE user_id = $1 AND module_key = $2`,
				userID, moduleKey,
			).Scan(&hasPermission)

			if err != nil || !hasPermission {
				slog.Warn("permission denied",
					"user_id", userID,
					"role", role,
					"module", moduleKey,
					"method", r.Method,
					"perm", permColumn,
					"path", r.URL.Path,
				)
				http.Error(w, `{"error":"Bu modüle erişim izniniz yok"}`, http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
