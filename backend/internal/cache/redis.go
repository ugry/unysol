package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *redis.Client
}

func NewRedisClient(redisURL string) (*RedisClient, error) {
	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse redis URL: %w", err)
	}

	client := redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		slog.Warn("redis connection failed, continuing without cache", "error", err)
		return &RedisClient{client: nil}, nil
	}

	slog.Info("redis connection established")
	return &RedisClient{client: client}, nil
}

func (r *RedisClient) IsAvailable() bool {
	return r.client != nil
}

func (r *RedisClient) Get(ctx context.Context, key string) (string, error) {
	if r.client == nil {
		return "", fmt.Errorf("redis not available")
	}
	return r.client.Get(ctx, key).Result()
}

func (r *RedisClient) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if r.client == nil {
		return fmt.Errorf("redis not available")
	}
	return r.client.Set(ctx, key, value, ttl).Err()
}

func (r *RedisClient) Delete(ctx context.Context, key string) error {
	if r.client == nil {
		return fmt.Errorf("redis not available")
	}
	return r.client.Del(ctx, key).Err()
}

func (r *RedisClient) SetSession(ctx context.Context, token string, userData map[string]string, ttl time.Duration) error {
	if r.client == nil {
		return fmt.Errorf("redis not available")
	}

	data, err := json.Marshal(userData)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %w", err)
	}

	sessionKey := "session:" + token
	return r.client.Set(ctx, sessionKey, data, ttl).Err()
}

func (r *RedisClient) GetSession(ctx context.Context, token string) (map[string]string, error) {
	if r.client == nil {
		return nil, fmt.Errorf("redis not available")
	}

	sessionKey := "session:" + token
	data, err := r.client.Get(ctx, sessionKey).Result()
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}

	var userData map[string]string
	if err := json.Unmarshal([]byte(data), &userData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session data: %w", err)
	}

	return userData, nil
}

func (r *RedisClient) DeleteSession(ctx context.Context, token string) error {
	if r.client == nil {
		return fmt.Errorf("redis not available")
	}

	sessionKey := "session:" + token
	return r.client.Del(ctx, sessionKey).Err()
}

func (r *RedisClient) Cacheable(key string) bool {
	return r.client != nil
}

func (r *RedisClient) Close() error {
	if r.client != nil {
		return r.client.Close()
	}
	return nil
}
