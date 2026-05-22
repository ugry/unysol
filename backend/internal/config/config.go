package config

import "os"

type Config struct {
	Port        string
	DatabaseURL string
	JWTSecret   string
	RedisURL    string
}

func Load() *Config {
	return &Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/unysol?sslmode=disable"),
		JWTSecret:   getEnv("JWT_SECRET", "default-secret-change-me"),
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379/0"),
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}
