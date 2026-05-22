package services

import (
	"context"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func StartCleanupWorker(pool *pgxpool.Pool, stop <-chan struct{}) {
	go func() {
		ticker := time.NewTicker(1 * time.Hour)
		defer ticker.Stop()

		slog.Info("cleanup worker started")

		for {
			select {
			case <-ticker.C:
				tag, err := pool.Exec(context.Background(),
					"DELETE FROM actions WHERE created_at < NOW() - INTERVAL '30 days'")
				if err != nil {
					slog.Error("cleanup worker error", "error", err)
				} else {
					slog.Info("cleanup worker completed", "deleted_rows", tag.RowsAffected())
				}
			case <-stop:
				slog.Info("cleanup worker stopped")
				return
			}
		}
	}()
}
