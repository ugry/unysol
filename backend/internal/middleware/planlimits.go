package middleware

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"sync"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PlanLimits struct {
	MaxTrucks int
	MaxUsers  int
}

var defaultPlanLimits = map[string]PlanLimits{
	"FREE":    {MaxTrucks: 5, MaxUsers: 5},
	"PRO":     {MaxTrucks: 10, MaxUsers: 15},
	"PREMIUM": {MaxTrucks: 0, MaxUsers: 0},
}

type planLimitsCacheEntry struct {
	mu      sync.Mutex
	plan    string
	fetched bool
}

var planCache sync.Map

func PlanLimitsMiddleware(pool *pgxpool.Pool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role := GetRole(r.Context())
			if role == "SUPER_ADMIN" || role == "super_admin" {
				next.ServeHTTP(w, r)
				return
			}

			if r.Method == http.MethodGet || r.Method == http.MethodOptions {
				next.ServeHTTP(w, r)
				return
			}

			tenantID := GetTenantID(r.Context())
			if tenantID == "" {
				next.ServeHTTP(w, r)
				return
			}

			path := r.URL.Path

			if strings.Contains(path, "/api/tenant/trucks") && r.Method == http.MethodPost {
				if exceeded, limit := checkTruckLimit(r.Context(), pool, tenantID); exceeded {
					writePlanLimitError(w, "kamyon", limit)
					return
				}
			}

			if (strings.Contains(path, "/api/tenant/employees") || strings.Contains(path, "/api/admin/users")) && r.Method == http.MethodPost {
				if exceeded, limit := checkUserLimit(r.Context(), pool, tenantID); exceeded {
					writePlanLimitError(w, "kullanıcı", limit)
					return
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

func getTenantPlan(ctx context.Context, pool *pgxpool.Pool, tenantID string) string {
	if entry, ok := planCache.Load(tenantID); ok {
		e := entry.(*planLimitsCacheEntry)
		e.mu.Lock()
		plan := e.plan
		e.mu.Unlock()
		return plan
	}

	var plan string
	err := pool.QueryRow(ctx,
		`SELECT plan FROM subscriptions WHERE tenant_id = $1`, tenantID,
	).Scan(&plan)
	if err != nil {
		plan = "FREE"
	}

	entry := &planLimitsCacheEntry{
		plan:    plan,
		fetched: true,
	}
	planCache.Store(tenantID, entry)

	return plan
}

func getLimits(plan string) PlanLimits {
	if limits, ok := defaultPlanLimits[plan]; ok {
		return limits
	}
	return defaultPlanLimits["FREE"]
}

func checkTruckLimit(ctx context.Context, pool *pgxpool.Pool, tenantID string) (bool, int) {
	plan := getTenantPlan(ctx, pool, tenantID)
	limits := getLimits(plan)

	var count int
	err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM trucks WHERE tenant_id = $1 AND aktif = true`, tenantID,
	).Scan(&count)
	if err != nil {
		slog.Error("planlimits: failed to count trucks", "error", err, "tenant_id", tenantID)
		return false, 0
	}

	if count >= limits.MaxTrucks {
		return true, limits.MaxTrucks
	}
	return false, limits.MaxTrucks
}

func checkUserLimit(ctx context.Context, pool *pgxpool.Pool, tenantID string) (bool, int) {
	plan := getTenantPlan(ctx, pool, tenantID)
	limits := getLimits(plan)

	var count int
	err := pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND aktif = true`, tenantID,
	).Scan(&count)
	if err != nil {
		slog.Error("planlimits: failed to count users", "error", err, "tenant_id", tenantID)
		return false, 0
	}

	if count >= limits.MaxUsers {
		return true, limits.MaxUsers
	}
	return false, limits.MaxUsers
}

func writePlanLimitError(w http.ResponseWriter, resource string, limit int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusForbidden)
	var msg string
	if limit == 0 {
		msg = resource + " ekleme sınırı yoktur (sınırsız plan)"
	} else {
		msg = "Planınız en fazla " + formatInt(limit) + " " + resource + " eklemenize izin veriyor. Daha fazlası için planınızı yükseltin."
	}
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":   "plan limiti aşıldı",
		"message": msg,
	})
}
