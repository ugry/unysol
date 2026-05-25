package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"

	"unysol/internal/cache"
	"unysol/internal/config"
	"unysol/internal/database"
	"unysol/internal/handlers"
	"unysol/internal/middleware"
	"unysol/internal/repository"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	ctx := context.Background()
	cfg := config.Load()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := database.RunMigrations(ctx, "internal/database/migrations"); err != nil {
		slog.Warn("migrations warning", "error", err)
	}

	redisClient, err := cache.NewRedisClient(cfg.RedisURL)
	if err != nil {
		slog.Warn("failed to initialize redis", "error", err)
	}
	if redisClient != nil {
		defer redisClient.Close()
	}

	repo := repository.NewRepository(pool)

	middleware.InitActionLog("actions.log")
	defer middleware.CloseActionLog()
	middleware.StartActionLogFlusher(5 * time.Second)
	middleware.StartActionLogRotator("actions.log")

	authHandler := &handlers.AuthHandler{DB: pool, JWTSecret: cfg.JWTSecret}
	trucksHandler := &handlers.TrucksHandler{DB: pool}
	tripsHandler := &handlers.TripsHandler{DB: pool}
	customersHandler := &handlers.CustomersHandler{DB: pool}
	invoicesHandler := &handlers.InvoicesHandler{DB: pool}
	expensesHandler := &handlers.ExpensesHandler{DB: pool}
	employeesHandler := &handlers.EmployeesHandler{DB: pool}
	cekSenetHandler := &handlers.CekSenetHandler{DB: pool}
	actionsHandler := &handlers.ActionsHandler{DB: pool}
	dashboardHandler := &handlers.DashboardHandler{DB: pool}
	predictionsHandler := &handlers.PredictionsHandler{DB: pool}
	adminHandler := &handlers.AdminHandler{DB: pool}
	systemHandler := &handlers.SystemHandler{DB: pool}
	modulesHandler := &handlers.ModulesHandler{DB: pool}
	countriesHandler := &handlers.CountriesHandler{DB: pool}
	billingHandler := &handlers.BillingHandler{DB: pool}
	settingsHandler := &handlers.SettingsHandler{DB: pool}
	notificationsHandler := &handlers.NotificationsHandler{DB: pool}
	demoHandler := &handlers.DemoHandler{DB: pool}

	_ = repo
	_ = redisClient

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Request-ID"},
		ExposedHeaders:   []string{"X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(middleware.Logging)
	r.Use(metricsMiddleware)
	r.Use(middleware.ActionLogger)

	r.Route("/api/auth", func(r chi.Router) {
		r.Use(middleware.RateLimit(cfg.RateLimiting.Auth))
		r.Post("/signup", authHandler.Signup)
		r.Post("/login", authHandler.Login)
	})

	r.Route("/api/demo", func(r chi.Router) {
		r.Post("/create", demoHandler.CreateDemo)
	})

	r.Route("/api/system", func(r chi.Router) {
		r.Get("/health", systemHandler.Health)
		r.Get("/health/ready", systemHandler.Ready)
		r.Get("/health/live", systemHandler.Live)
		r.Get("/metrics", systemHandler.Metrics)
	})

	r.Group(func(r chi.Router) {
		r.Use(middleware.Auth(cfg.JWTSecret))
		r.Use(middleware.RateLimit(cfg.RateLimiting.Global))
		r.Use(middleware.PlanLimitsMiddleware(pool))

		r.Route("/api/tenant", func(r chi.Router) {
			r.Use(middleware.RequireTenant)

			r.Mount("/dashboard", dashboardHandler.Routes())
			r.Mount("/trucks", trucksHandler.Routes())
			r.Mount("/trips", tripsHandler.Routes())
			r.Mount("/customers", customersHandler.Routes())
			r.Mount("/invoices", invoicesHandler.Routes())
			r.Mount("/expenses", expensesHandler.Routes())
			r.Mount("/employees", employeesHandler.Routes())
			r.Mount("/cek-senet", cekSenetHandler.Routes())
			r.Mount("/actions", actionsHandler.Routes())
			r.Mount("/predictions", predictionsHandler.Routes())
			r.Mount("/billing", billingHandler.Routes())
			r.Mount("/settings", settingsHandler.Routes())
			r.Mount("/notifications", notificationsHandler.Routes())
		})

		r.Route("/api/admin", func(r chi.Router) {
			r.Use(middleware.RequireSuperAdmin)

			r.Get("/tenants", adminHandler.ListTenants)
			r.Get("/tenants/{id}", adminHandler.GetTenant)
			r.Put("/tenants/{id}/plan", adminHandler.ChangePlan)
			r.Post("/tenants/{id}/suspend", adminHandler.SuspendTenant)

			r.Get("/analytics/mrr", adminHandler.GetMRR)
			r.Get("/analytics/churn", adminHandler.GetChurn)
			r.Get("/analytics/growth", adminHandler.GetGrowth)

			r.Get("/users", adminHandler.ListUsers)
			r.Post("/users", adminHandler.CreateUser)

			r.Mount("/modules", modulesHandler.Routes())
			r.Mount("/countries", countriesHandler.Routes())
		})
	})

	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server starting", "port", cfg.Port, "environment", cfg.Environment)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("server shutting down")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
	}

	slog.Info("server stopped")
}

func metricsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		handlers.IncrementRequestCount()
		handlers.IncrementActiveConns()
		defer handlers.DecrementActiveConns()
		next.ServeHTTP(w, r)
		handlers.RecordRequestDuration(time.Since(start))
	})
}
