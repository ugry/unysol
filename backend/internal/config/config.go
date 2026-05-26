package config

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
)

type RateLimitingConfig struct {
	Global int
	Auth   int
}

type PlanLimitsConfig struct {
	FreeMaxTrucks    int
	FreeMaxUsers     int
	ProMaxTrucks     int
	ProMaxUsers      int
	PremiumMaxTrucks int
	PremiumMaxUsers  int
}

type RedisConfig struct {
	URL string
}

type MonitoringConfig struct {
	Enabled     bool
	MetricsPath string
}

type Config struct {
	Port         string
	DatabaseURL  string
	JWTSecret    string
	RedisURL     string
	Environment  string
	RateLimiting RateLimitingConfig
	PlanLimits   PlanLimitsConfig
	Redis        RedisConfig
	Monitoring   MonitoringConfig
}

func Load() *Config {
	loadEnvFile(".env")

	cfg := &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/unysol?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "default-secret-change-me"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
		Environment: getEnv("ENVIRONMENT", "development"),
		RateLimiting: RateLimitingConfig{
			Global: getEnvInt("RATE_LIMIT_GLOBAL", 500),
			Auth:   getEnvInt("RATE_LIMIT_AUTH", 10),
		},
		PlanLimits: PlanLimitsConfig{
			FreeMaxTrucks:    getEnvInt("PLAN_FREE_MAX_TRUCKS", 1),
			FreeMaxUsers:     getEnvInt("PLAN_FREE_MAX_USERS", 3),
			ProMaxTrucks:     getEnvInt("PLAN_PRO_MAX_TRUCKS", 5),
			ProMaxUsers:      getEnvInt("PLAN_PRO_MAX_USERS", 10),
			PremiumMaxTrucks: getEnvInt("PLAN_PREMIUM_MAX_TRUCKS", 50),
			PremiumMaxUsers:  getEnvInt("PLAN_PREMIUM_MAX_USERS", 30),
		},
		Redis: RedisConfig{
			URL: getEnv("REDIS_URL", "redis://localhost:6379/0"),
		},
		Monitoring: MonitoringConfig{
			Enabled:     getEnvBool("MONITORING_ENABLED", true),
			MetricsPath: getEnv("METRICS_PATH", "/api/system/metrics"),
		},
	}

	if err := cfg.Validate(); err != nil {
		slog.Warn("config validation warning", "error", err)
	}

	return cfg
}

func (c *Config) Validate() error {
	if c.Environment == "production" {
		errors := make([]string, 0)

		if c.Port == "" {
			errors = append(errors, "PORT is required")
		}
		if c.DatabaseURL == "" {
			errors = append(errors, "DATABASE_URL is required")
		}
		if c.JWTSecret == "" || c.JWTSecret == "default-secret-change-me" {
			errors = append(errors, "JWT_SECRET must be set to a secure value in production")
		}
		if len(c.JWTSecret) < 32 {
			errors = append(errors, "JWT_SECRET must be at least 32 characters in production")
		}

		if len(errors) > 0 {
			return fmt.Errorf("configuration errors: %s", strings.Join(errors, "; "))
		}
	}
	return nil
}

func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

func loadEnvFile(path string) {
	data, err := os.ReadFile(path)
	if err != nil {
		return
	}

	lines := strings.Split(string(data), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		value = strings.Trim(value, `"'`)

		if _, exists := os.LookupEnv(key); !exists {
			os.Setenv(key, value)
		}
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}

func getEnvBool(key string, fallback bool) bool {
	if val, ok := os.LookupEnv(key); ok {
		switch strings.ToLower(val) {
		case "true", "1", "yes", "on":
			return true
		case "false", "0", "no", "off":
			return false
		}
	}
	return fallback
}
