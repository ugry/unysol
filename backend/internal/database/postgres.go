package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"unysol/internal/logging"
)

var pool *pgxpool.Pool

func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("unable to parse database URL: %w", err)
	}

	p, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection pool: %w", err)
	}

	if err := p.Ping(ctx); err != nil {
		return nil, fmt.Errorf("unable to ping database: %w", err)
	}

	pool = p
	logging.System(logging.LevelInfo, "database connection pool established", nil)
	return p, nil
}

func GetPool() *pgxpool.Pool {
	return pool
}

func ensureMigrationTracking(ctx context.Context, p *pgxpool.Pool) error {
	_, err := p.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			id         SERIAL PRIMARY KEY,
			filename   VARCHAR(255) UNIQUE NOT NULL,
			applied_at TIMESTAMPTZ DEFAULT NOW()
		)
	`)
	return err
}

func isMigrationApplied(ctx context.Context, p *pgxpool.Pool, filename string) bool {
	var count int
	err := p.QueryRow(ctx, `SELECT COUNT(*) FROM schema_migrations WHERE filename = $1`, filename).Scan(&count)
	if err != nil {
		logging.System(logging.LevelWarn, "migration check failed", map[string]interface{}{
			"file":  filename,
			"error": err.Error(),
		})
		return false
	}
	return count > 0
}

func recordMigration(ctx context.Context, p *pgxpool.Pool, filename string) {
	_, err := p.Exec(ctx, `INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`, filename)
	if err != nil {
		logging.System(logging.LevelWarn, "failed to record migration", map[string]interface{}{
			"file":  filename,
			"error": err.Error(),
		})
	}
}

func RunMigrations(ctx context.Context, migrationsDir string) error {
	p := GetPool()
	if p == nil {
		return fmt.Errorf("database pool not initialized")
	}

	if err := ensureMigrationTracking(ctx, p); err != nil {
		return fmt.Errorf("failed to create migration tracking table: %w", err)
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("unable to read migrations directory: %w", err)
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	applied := 0
	skipped := 0
	failed := 0

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}

		if isMigrationApplied(ctx, p, entry.Name()) {
			skipped++
			continue
		}

		path := filepath.Join(migrationsDir, entry.Name())
		sql, err := os.ReadFile(path)
		if err != nil {
			applied = failed + applied // prevent double-count
			return fmt.Errorf("unable to read migration file %s: %w", entry.Name(), err)
		}

		logging.System(logging.LevelInfo, "running migration", map[string]interface{}{"file": entry.Name()})
		if _, err := p.Exec(ctx, string(sql)); err != nil {
			markApplied := false
			// Old migrations (001-010) may fail on idempotent re-run; catch known error patterns
			msg := err.Error()
			if strings.Contains(msg, "already exists") || strings.Contains(msg, "duplicate") ||
				strings.Contains(msg, "current transaction is aborted") {
				markApplied = true
			}
			// 011+ migrations MUST pass — only skip pre-existing errors
			isNew := strings.Compare(entry.Name(), "010_") > 0
			if markApplied && !isNew {
				recordMigration(ctx, p, entry.Name())
				skipped++
				logging.System(logging.LevelInfo, "migration skipped (idempotent)", map[string]interface{}{"file": entry.Name(), "error": msg})
				continue
			}
			failed++
			return fmt.Errorf("migration %s failed: %w", entry.Name(), err)
		}

		recordMigration(ctx, p, entry.Name())
		applied++
	}

	logging.System(logging.LevelInfo, "migrations complete", map[string]interface{}{
		"applied": applied,
		"skipped": skipped,
		"failed":  failed,
	})

	return nil
}
