package logging

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"os"
	"path/filepath"
	"sync"
	"time"
)

// ============================================================
// ENTERPRISE LOG SEPARATION — Multi-stream structured logging
// ============================================================
//
// Categories (separate files):
//   system.log  — service lifecycle, migrations, health, module state
//   auth.log    — login, signup, failed attempts, lockouts, password resets
//   actions.log — who did what to what record, old/new values (per-tenant + admin)
//   errors.log  — all errors with full context (tenant, user, trace)
//   access.log  — HTTP request/response (method, path, status, duration)
//
// Action logs go to:             logs/actions/
// Tenant actions go to:          logs/actions/tenant_{id}/
//
// All logs are structured JSON (Loki-compatible) with consistent fields:
//   timestamp, level, category, tenant_id, user_id, role, request_id, message, details

type Category string

const (
	CatSystem  Category = "system"
	CatAuth    Category = "auth"
	CatAction  Category = "action"
	CatError   Category = "error"
	CatAccess  Category = "access"
)

type Level string

const (
	LevelDebug Level = "DEBUG"
	LevelInfo  Level = "INFO"
	LevelWarn  Level = "WARN"
	LevelError Level = "ERROR"
)

type Entry struct {
	Timestamp  string      `json:"timestamp"`
	Level      Level       `json:"level"`
	Category   Category    `json:"category"`
	TenantID   string      `json:"tenant_id,omitempty"`
	UserID     string      `json:"user_id,omitempty"`
	Role       string      `json:"role,omitempty"`
	RequestID  string      `json:"request_id,omitempty"`
	Module     string      `json:"module,omitempty"`
	Action     string      `json:"action,omitempty"`
	TableName  string      `json:"table_name,omitempty"`
	RecordID   string      `json:"record_id,omitempty"`
	OldValues  interface{} `json:"old_values,omitempty"`
	NewValues  interface{} `json:"new_values,omitempty"`
	Message    string      `json:"message"`
	Details    interface{} `json:"details,omitempty"`
	Error      string      `json:"error,omitempty"`
	StackTrace string      `json:"stack_trace,omitempty"`
	Duration   string      `json:"duration,omitempty"`
	StatusCode int         `json:"status_code,omitempty"`
	Path       string      `json:"path,omitempty"`
	Method     string      `json:"method,omitempty"`
	IP         string      `json:"ip,omitempty"`
}

// ============================================================
// Logger — multi-stream logger
// ============================================================
type Logger struct {
	mu       sync.Mutex
	baseDir  string
	writers  map[Category]*os.File
	slog     *slog.Logger
}

var defaultLogger *Logger
var once sync.Once

func Init(baseDir string) *Logger {
	once.Do(func() {
		defaultLogger = &Logger{
			baseDir: baseDir,
			writers: make(map[Category]*os.File),
			slog: slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
				Level: slog.LevelDebug,
			})),
		}
		defaultLogger.openWriters()
		defaultLogger.startRotator()
	})
	return defaultLogger
}

func Get() *Logger { return defaultLogger }

func (l *Logger) openWriters() {
	dirs := map[Category]string{
		CatSystem: "system",
		CatAuth:   "auth",
		CatError:  "errors",
		CatAccess: "access",
	}
	for cat, dir := range dirs {
		path := filepath.Join(l.baseDir, dir)
		os.MkdirAll(path, 0755)
		f, err := os.OpenFile(filepath.Join(path, string(cat)+".log"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err == nil {
			l.writers[cat] = f
		}
	}
	// Actions is special — opened on demand per tenant/admin
}

func (l *Logger) getWriter(cat Category, tenantID string) io.Writer {
	if cat == CatAction {
		subDir := "admin"
		if tenantID != "" && tenantID != "0" {
			subDir = "tenant_" + tenantID
		}
		path := filepath.Join(l.baseDir, "actions", subDir)
		os.MkdirAll(path, 0755)
		f, err := os.OpenFile(filepath.Join(path, "actions.log"), os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			return os.Stderr
		}
		// We don't cache these — they're per-tenant, and tenants come and go
		// Closing is handled after write via Sync
		defer f.Close()
		return f
	}
	if w, ok := l.writers[cat]; ok {
		return w
	}
	return os.Stderr
}

func (l *Logger) write(entry Entry) {
	l.mu.Lock()
	defer l.mu.Unlock()

	if entry.Timestamp == "" {
		entry.Timestamp = time.Now().UTC().Format(time.RFC3339Nano)
	}

	data, err := json.Marshal(entry)
	if err != nil {
		return
	}
	data = append(data, '\n')

	// Write to category-specific file
	w := l.getWriter(entry.Category, entry.TenantID)
	w.Write(data)

	// Also write to stdout for Docker logs / Loki
	os.Stdout.Write(data)
}

// ============================================================
// PUBLIC API — Category-specific logging functions
// ============================================================

// System logs (startup, shutdown, migrations, health, module state)
func System(level Level, message string, details map[string]interface{}) {
	l := Get()
	if l == nil { return }
	l.write(Entry{Category: CatSystem, Level: level, Message: message, Details: details})
}

// Auth logs (login, signup, failed attempts, lockouts)
func Auth(level Level, message string, tenantID, userID, role, ip string, details map[string]interface{}) {
	l := Get()
	if l == nil { return }
	l.write(Entry{Category: CatAuth, Level: level, Message: message, TenantID: tenantID, UserID: userID, Role: role, IP: ip, Details: details})
}

// Action logs (who did what to what record)
func Action(level Level, tenantID, userID, role, requestID, module, action, tableName, recordID string, oldValues, newValues interface{}) {
	l := Get()
	if l == nil { return }
	l.write(Entry{
		Category: CatAction, Level: level, TenantID: tenantID, UserID: userID, Role: role,
		RequestID: requestID, Module: module, Action: action, TableName: tableName,
		RecordID: recordID, OldValues: oldValues, NewValues: newValues,
		Message: fmt.Sprintf("%s %s %s id=%s", action, module, tableName, recordID),
	})
}

// Error logs (errors with full context)
func Error(level Level, err error, tenantID, userID, role, requestID, module, message string, details map[string]interface{}) {
	l := Get()
	if l == nil { return }
	entry := Entry{Category: CatError, Level: level, TenantID: tenantID, UserID: userID, Role: role,
		RequestID: requestID, Module: module, Message: message, Details: details}
	if err != nil {
		entry.Error = err.Error()
	}
	l.write(entry)
}

// Access logs (HTTP request/response)
func Access(method, path, ip, tenantID, userID, role, requestID string, statusCode int, duration time.Duration) {
	l := Get()
	if l == nil { return }
	l.write(Entry{
		Category: CatAccess, Level: LevelInfo, Method: method, Path: path, IP: ip,
		TenantID: tenantID, UserID: userID, Role: role, RequestID: requestID,
		StatusCode: statusCode, Duration: duration.String(),
		Message: fmt.Sprintf("%s %s %d %s", method, path, statusCode, duration),
	})
}

// ============================================================
// HELPERS
// ============================================================

func (l *Logger) Close() {
	l.mu.Lock()
	defer l.mu.Unlock()
	for _, w := range l.writers {
		if w != nil {
			w.Close()
		}
	}
}

func (l *Logger) startRotator() {
	go func() {
		for {
			now := time.Now()
			next := now.Add(24 * time.Hour)
			next = time.Date(next.Year(), next.Month(), next.Day(), 0, 0, 0, 0, next.Location())
			time.Sleep(next.Sub(now))

			l.mu.Lock()
			for cat, f := range l.writers {
				if f != nil {
					f.Close()
				}
				dir := filepath.Join(l.baseDir, string(cat))
				oldPath := filepath.Join(dir, string(cat)+".log")
				newPath := filepath.Join(dir, fmt.Sprintf("%s.%s.log", cat, time.Now().Format("2006-01-02")))
				os.Rename(oldPath, newPath)
				f, err := os.OpenFile(oldPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
				if err == nil {
					l.writers[cat] = f
				}
			}
			// Rotate per-tenant action logs
			actionsDir := filepath.Join(l.baseDir, "actions")
			filepath.Walk(actionsDir, func(path string, info os.FileInfo, err error) error {
				if err != nil || info.IsDir() { return nil }
				if filepath.Ext(path) == ".log" {
					rotated := fmt.Sprintf("%s.%s", path, time.Now().Format("2006-01-02"))
					os.Rename(path, rotated)
				}
				return nil
			})
			l.mu.Unlock()
		}
	}()

	// Cleanup goroutine: delete logs older than 90 days
	go func() {
		for {
			time.Sleep(6 * time.Hour)
			cutoff := time.Now().AddDate(0, 0, -90)
			filepath.Walk(l.baseDir, func(path string, info os.FileInfo, err error) error {
				if err != nil || info.IsDir() || info.ModTime().After(cutoff) { return nil }
				os.Remove(path)
				return nil
			})
		}
	}()
}
