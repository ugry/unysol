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
		"/api/tenant/user-management": "access_mgmt",
		"/api/tenant/my-permissions": "access_mgmt",
		"/api/tenant/stripe":         "billing",
		"/api/tenant/reports":        "reports",
		"/api/tenant/tires":          "tire_tracking",
		"/api/tenant/allowances":     "driver_allowance",
		"/api/tenant/payslips":       "payslip",
		"/api/tenant/contracts":      "contract_mgmt",
		"/api/tenant/proposals":      "proposal_system",
		"/api/tenant/customer-portal": "customer_portal",
		"/api/tenant/export":         "export",
	}

	// Paths always allowed regardless of permissions
	alwaysAllowed := map[string]bool{
		"/api/tenant/my-permissions": true,
		"/api/tenant/settings":       true,
		"/api/tenant/notifications":  true,
		"/api/tenant/billing/status": true,
		"/api/tenant/stripe/checkout": true,
		"/api/tenant/stripe/portal":   true,
	}

	var mu sync.RWMutex

	// resolveModuleKey maps URL path to module_key
	resolveModuleKey := func(urlPath string) string {
		mu.RLock()
		defer mu.RUnlock()
		for prefix, key := range pathToModule {
			if strings.HasPrefix(urlPath, prefix) {
				return key
			}
		}
		return ""
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetRole(r.Context())
			userID := GetUserID(r.Context())

			// Always-allowed paths bypass plan check
			if alwaysAllowed[r.URL.Path] {
				next.ServeHTTP(w, r)
				return
			}

			// Plan module check: resolve module_key and verify against JWT allowed_modules
			// Applies to ALL users including TENANT_OWNER (blocks FREE plan from PRO modules)
			moduleKey := resolveModuleKey(r.URL.Path)
			if moduleKey != "" {
				if allowedRaw := r.Context().Value("allowed_modules"); allowedRaw != nil {
					if allowedList, ok := allowedRaw.([]interface{}); ok {
						found := false
						for _, m := range allowedList {
							if s, ok := m.(string); ok && s == moduleKey {
								found = true
								break
							}
						}
						if !found {
							w.Header().Set("Content-Type", "application/json")
							w.WriteHeader(http.StatusForbidden)
							w.Write([]byte(`{"error":"Bu modül mevcut planınızda bulunmuyor. Yükseltmek için PRO plana geçin.","code":"plan_restricted"}`))
							return
						}
					}
				}
			}

			// TENANT_OWNER has all access (within plan limits, enforced above)
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

			// Module key already resolved above
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
