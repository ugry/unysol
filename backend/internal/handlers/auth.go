package handlers

import (
	"encoding/json"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"unysol/internal/logging"
	"unysol/internal/validator"
)

type AuthHandler struct {
	DB        *pgxpool.Pool
	JWTSecret string
}

type SignupRequest struct {
	TenantName string `json:"tenant_name"`
	Email      string `json:"email"`
	Password   string `json:"password"`
	Telefon    string `json:"telefon,omitempty"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token     string `json:"access_token"`
	TokenType string `json:"token_type"`
	UserID    int    `json:"user_id"`
	TenantID  int    `json:"tenant_id"`
	Email     string `json:"email"`
	Role      string `json:"role"`
}

func (h *AuthHandler) Signup(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.TenantName == "" || req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "tenant_name, email, and password are required"})
		return
	}

	if !validator.IsValidEmail(req.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid email address"})
		return
	}

	if err := validator.ValidatePassword(req.Password); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	ip := extractIP(r)
	if isSignupLockedOut(ip) {
		logging.Auth(logging.LevelWarn, "signup blocked — IP locked", "", "", "", ip,
			map[string]interface{}{"email": req.Email})
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "too many signup attempts, try again in 15 minutes"})
		return
	}
	recordSignupFailedAttempt(ip)

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		recordSignupFailedAttempt(ip)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to hash password"})
		return
	}

	slug := strings.ToLower(strings.ReplaceAll(req.TenantName, " ", "-"))
	slug = cleanSlug(slug)

	var tenantID int
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO tenants (slug, firma_unvani) VALUES ($1, $2) RETURNING id`,
		slug, req.TenantName,
	).Scan(&tenantID)
	if err != nil {
		recordSignupFailedAttempt(ip)
		logging.Auth(logging.LevelError, "signup failed — tenant create error", "", "", "", r.RemoteAddr,
			map[string]interface{}{"email": req.Email, "error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create tenant"})
		return
	}

	var userID int
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon) 
		 VALUES ($1, $2, $3, $4, 'TENANT_OWNER', $5) RETURNING id`,
		tenantID, req.Email, string(passwordHash), req.TenantName, req.Telefon,
	).Scan(&userID)
	if err != nil {
		recordSignupFailedAttempt(ip)
		logging.Error(logging.LevelError, err, itoa(tenantID), "", "", "", "auth", "signup user create failed", nil)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create user"})
		return
	}

	_, _ = h.DB.Exec(r.Context(), `INSERT INTO subscriptions (tenant_id, plan) VALUES ($1, 'FREE')`, tenantID)

	token, err := h.generateToken(userID, tenantID, req.Email, "TENANT_OWNER")
	if err != nil {
		recordSignupFailedAttempt(ip)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate token"})
		return
	}

	resetSignupLockout(ip)
	logging.Auth(logging.LevelInfo, "signup success", itoa(tenantID), itoa(userID), "TENANT_OWNER", r.RemoteAddr,
		map[string]interface{}{"email": req.Email, "tenant_name": req.TenantName})

	writeJSON(w, http.StatusCreated, AuthResponse{
		Token:     token,
		TokenType: "bearer",
		UserID:    userID,
		TenantID:  tenantID,
		Email:     req.Email,
		Role:      "TENANT_OWNER",
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password are required"})
		return
	}

	if isLockedOut(req.Email) {
		logging.Auth(logging.LevelWarn, "login blocked — account locked", "", "", "", r.RemoteAddr,
			map[string]interface{}{"email": req.Email})
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "too many login attempts, try again later"})
		return
	}

	var userID, tenantID int
	var passwordHash, role string
	err := h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, password_hash, rol FROM users WHERE email = $1`,
		req.Email,
	).Scan(&userID, &tenantID, &passwordHash, &role)
	if err != nil {
		recordFailedAttempt(req.Email)
		logging.Auth(logging.LevelWarn, "login failed — invalid email", "", "", "", r.RemoteAddr,
			map[string]interface{}{"email": req.Email})
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid email or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		recordFailedAttempt(req.Email)
		logging.Auth(logging.LevelWarn, "login failed — wrong password", itoa(tenantID), itoa(userID), role, r.RemoteAddr,
			map[string]interface{}{"email": req.Email})
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid email or password"})
		return
	}

	resetLockout(req.Email)
	logging.Auth(logging.LevelInfo, "login success", itoa(tenantID), itoa(userID), role, r.RemoteAddr,
		map[string]interface{}{"email": req.Email})

	token, err := h.generateToken(userID, tenantID, req.Email, role)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to generate token"})
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{
		Token:     token,
		TokenType: "bearer",
		UserID:    userID,
		TenantID:  tenantID,
		Email:     req.Email,
		Role:      role,
	})
}

func (h *AuthHandler) generateToken(userID, tenantID int, email, role string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":   userID,
		"tenant_id": tenantID,
		"email":     email,
		"role":      role,
		"exp":       time.Now().Add(24 * time.Hour).Unix(),
		"iat":       time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.JWTSecret))
}

func cleanSlug(s string) string {
	return strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return -1
	}, s)
}

var (
	loginAttempts   = sync.Map{}
	lockoutDuration = 15 * time.Minute
	maxAttempts     = 5
)

type lockoutEntry struct {
	count     int
	lockedAt  time.Time
}

func recordFailedAttempt(email string) {
	v, _ := loginAttempts.LoadOrStore(email, &lockoutEntry{})
	entry := v.(*lockoutEntry)
	entry.count++
	if entry.count >= maxAttempts {
		entry.lockedAt = time.Now()
	}
	loginAttempts.Store(email, entry)
}

func resetLockout(email string) {
	loginAttempts.Delete(email)
}

func isLockedOut(email string) bool {
	v, ok := loginAttempts.Load(email)
	if !ok {
		return false
	}
	entry := v.(*lockoutEntry)
	if entry.count >= maxAttempts && time.Since(entry.lockedAt) < lockoutDuration {
		return true
	}
	if entry.count >= maxAttempts && time.Since(entry.lockedAt) >= lockoutDuration {
		loginAttempts.Delete(email)
	}
	return false
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func itoa(v int) string {
	if v == 0 { return "0" }
	s := ""
	for v > 0 {
		s = string(rune('0'+v%10)) + s
		v /= 10
	}
	return s
}

var (
	signupAttempts   = sync.Map{}
	signupLockoutDur = 15 * time.Minute
	maxSignupAttempts = 5
)

type signupLockoutEntry struct {
	count    int
	lockedAt time.Time
}

func recordSignupFailedAttempt(ip string) {
	v, _ := signupAttempts.LoadOrStore(ip, &signupLockoutEntry{})
	entry := v.(*signupLockoutEntry)
	entry.count++
	if entry.count >= maxSignupAttempts {
		entry.lockedAt = time.Now()
	}
	signupAttempts.Store(ip, entry)
}

func resetSignupLockout(ip string) {
	signupAttempts.Delete(ip)
}

func isSignupLockedOut(ip string) bool {
	v, ok := signupAttempts.Load(ip)
	if !ok {
		return false
	}
	entry := v.(*signupLockoutEntry)
	if entry.count >= maxSignupAttempts && time.Since(entry.lockedAt) < signupLockoutDur {
		return true
	}
	if entry.count >= maxSignupAttempts && time.Since(entry.lockedAt) >= signupLockoutDur {
		signupAttempts.Delete(ip)
	}
	return false
}

func extractIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
