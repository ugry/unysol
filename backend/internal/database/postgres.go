package database

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sort"

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

func RunMigrations(ctx context.Context, migrationsDir string) error {
	p := GetPool()
	if p == nil {
		return fmt.Errorf("database pool not initialized")
	}

	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("unable to read migrations directory: %w", err)
	}

	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Name() < entries[j].Name()
	})

	for _, entry := range entries {
		if entry.IsDir() || filepath.Ext(entry.Name()) != ".sql" {
			continue
		}

		path := filepath.Join(migrationsDir, entry.Name())
		sql, err := os.ReadFile(path)
		if err != nil {
			return fmt.Errorf("unable to read migration file %s: %w", entry.Name(), err)
		}

		logging.System(logging.LevelInfo, "running migration", map[string]interface{}{"file": entry.Name()})
		if _, err := p.Exec(ctx, string(sql)); err != nil {
			return fmt.Errorf("migration %s failed: %w", entry.Name(), err)
		}
	}

	return nil
}
