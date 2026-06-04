package handlers

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"unysol/internal/email"
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
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	req.Email = strings.TrimSpace(req.Email)
	req.TenantName = strings.TrimSpace(req.TenantName)
	req.Telefon = strings.TrimSpace(req.Telefon)
	req.Password = strings.TrimSpace(req.Password)

	if req.TenantName == "" || req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Firma adı, e-posta ve şifre zorunludur"})
		return
	}

	if len(req.TenantName) < 2 || len(req.TenantName) > 250 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Firma adı 2-250 karakter arasında olmalıdır"})
		return
	}

	if !validator.IsValidEmail(req.Email) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz e-posta adresi"})
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
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "Çok fazla kayıt denemesi. 15 dakika sonra tekrar deneyin."})
		return
	}
	recordSignupFailedAttempt(ip)

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		recordSignupFailedAttempt(ip)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Şifre oluşturulamadı"})
		return
	}

	slug := strings.ToLower(strings.ReplaceAll(req.TenantName, " ", "-"))
	slug = cleanSlug(slug)

	// Check for duplicate — use generic message to prevent enumeration
	var existing int
	h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM tenants WHERE slug=$1`, slug).Scan(&existing)
	h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM users WHERE email=$1`, req.Email).Scan(&existing)
	h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM pending_registrations WHERE email=$1`, req.Email).Scan(&existing)
	if existing > 0 {
		writeJSON(w, http.StatusCreated, map[string]interface{}{
			"success":              true,
			"message":              "Doğrulama kodu e-posta adresinize gönderildi. Hesabınızı aktifleştirmek için kodu girin.",
			"email":                req.Email,
			"requires_verification": true,
		})
		return
	}

	// Generate verification code
	verificationCode := generateVerificationCode()
	verificationToken := generateVerificationToken()

	// Store in pending_registrations (tenant+user created only after verification)
	_, err = h.DB.Exec(r.Context(),
		`INSERT INTO pending_registrations (email, password_hash, tenant_name, telefon, code, token, expires_at)
		 VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '1 hour')
		 ON CONFLICT (email) DO UPDATE SET code=$5, token=$6, expires_at=NOW() + INTERVAL '1 hour'`,
		req.Email, string(passwordHash), req.TenantName, req.Telefon, verificationCode, verificationToken)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Kayıt oluşturulamadı"})
		return
	}

	// Send verification email
	go func() {
		if err := email.SendVerificationEmail(req.Email, verificationCode, verificationToken); err != nil {
			logging.System(logging.LevelWarn, "verification email failed", map[string]interface{}{
				"error": err.Error(), "email": req.Email,
			})
		}
	}()

	logging.Auth(logging.LevelInfo, "signup pending verification", "", "", "", r.RemoteAddr,
		map[string]interface{}{"email": req.Email, "tenant_name": req.TenantName})

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"success":              true,
		"message":              "Doğrulama kodu e-posta adresinize gönderildi. Hesabınızı aktifleştirmek için kodu girin.",
		"email":                req.Email,
		"requires_verification": true,
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
		writeJSON(w, http.StatusTooManyRequests, map[string]string{"error": "Çok fazla giriş denemesi. Lütfen daha sonra tekrar deneyin."})
		return
	}

	var userID, tenantID int
	var passwordHash, role string
	var aktif bool
	err := h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, password_hash, rol, COALESCE(aktif, false) FROM users WHERE email = $1`,
		req.Email,
	).Scan(&userID, &tenantID, &passwordHash, &role, &aktif)
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

	if !aktif {
		writeJSON(w, http.StatusForbidden, map[string]interface{}{
			"error":                  "Hesabınız henüz doğrulanmadı. Lütfen e-posta adresinize gönderilen doğrulama linkine tıklayın.",
			"requires_verification": true,
			"email":                  req.Email,
		})
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
		"exp":       time.Now().Add(365 * 24 * time.Hour).Unix(),
		"iat":       time.Now().Unix(),
	}

	// If tenant user, query plan_modules for allowed modules
	if role != "SUPER_ADMIN" && tenantID > 0 {
		var plan string
		ctx := context.Background()
		h.DB.QueryRow(ctx, `SELECT COALESCE(plan::text,'FREE') FROM tenants WHERE id=$1`, tenantID).Scan(&plan)
		
		rows, err := h.DB.Query(ctx,
			`SELECT m.module_key FROM plan_modules pm
			 JOIN modules m ON m.id = pm.module_id
			 WHERE pm.plan = $1 AND pm.enabled = TRUE`, plan)
		if err == nil {
			defer rows.Close()
			var allowed []string
			for rows.Next() {
				var key string
				rows.Scan(&key)
				allowed = append(allowed, key)
			}
			claims["allowed_modules"] = allowed
		}
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

func generateVerificationToken() string {
	b := make([]byte, 32)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func generateVerificationCode() string {
	code := ""
	for i := 0; i < 6; i++ {
		n, _ := rand.Int(rand.Reader, big.NewInt(10))
		code += fmt.Sprintf("%d", n.Int64())
	}
	return code
}

func (h *AuthHandler) VerifyCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Doğrulama kodu gereklidir"})
		return
	}

	// First check pending_registrations (new signup, tenant+user not created yet)
	var pendingEmail, pendingPass, pendingName, pendingPhone string
	var pendingExpires time.Time
	err := h.DB.QueryRow(r.Context(),
		`SELECT email, password_hash, tenant_name, telefon, expires_at FROM pending_registrations WHERE code=$1`, req.Code,
	).Scan(&pendingEmail, &pendingPass, &pendingName, &pendingPhone, &pendingExpires)

	if err == nil && time.Now().Before(pendingExpires) {
		// Create tenant + user from pending registration
		slug := cleanSlug(pendingName)
		if slug == "" { slug = "user" + pendingEmail[:4] }

		var tenantID int
		err = h.DB.QueryRow(r.Context(),
			`INSERT INTO tenants (slug, firma_unvani) VALUES ($1, $2) RETURNING id`, slug, pendingName,
		).Scan(&tenantID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Firma oluşturulamadı. Lütfen tekrar deneyin."})
			return
		}

		var userID int
		err = h.DB.QueryRow(r.Context(),
			`INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif) 
			 VALUES ($1, $2, $3, $4, 'TENANT_OWNER', $5, true) RETURNING id`,
			tenantID, pendingEmail, pendingPass, pendingName, pendingPhone,
		).Scan(&userID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Kullanıcı oluşturulamadı"})
			return
		}

		// Create subscription
		h.DB.Exec(r.Context(), `INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret) VALUES ($1, 'FREE', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 0)`, tenantID)

		// Clean up pending registration
		h.DB.Exec(r.Context(), `DELETE FROM pending_registrations WHERE email=$1`, pendingEmail)

		logging.Auth(logging.LevelInfo, "signup verified — account created", itoa(tenantID), itoa(userID), "TENANT_OWNER", r.RemoteAddr,
			map[string]interface{}{"email": pendingEmail})

		jwtToken, _ := h.generateToken(userID, tenantID, pendingEmail, "TENANT_OWNER")
		writeJSON(w, http.StatusOK, AuthResponse{
			Token: jwtToken, TokenType: "bearer", UserID: userID,
			TenantID: tenantID, Email: pendingEmail, Role: "TENANT_OWNER",
		})
		return
	}

	// Fallback: check email_verification_tokens (old flow for existing users)
	var userID, tenantID int
	var emailAddr, role string
	var expiresAt time.Time
	var used bool
	err = h.DB.QueryRow(r.Context(), `
		SELECT v.user_id, v.expires_at, v.used, u.email, u.tenant_id, u.rol
		FROM email_verification_tokens v
		JOIN users u ON u.id = v.user_id
		WHERE v.code = $1 ORDER BY v.created_at DESC LIMIT 1
	`, req.Code).Scan(&userID, &expiresAt, &used, &emailAddr, &tenantID, &role)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz doğrulama kodu"})
		return
	}
	if used || time.Now().After(expiresAt) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Bu kod geçersiz veya süresi dolmuş"})
		return
	}

	h.DB.Exec(r.Context(), `UPDATE email_verification_tokens SET used=true WHERE code=$1 AND user_id=$2`, req.Code, userID)
	h.DB.Exec(r.Context(), `UPDATE users SET aktif=true WHERE id=$1`, userID)

	jwtToken, _ := h.generateToken(userID, tenantID, emailAddr, role)
	writeJSON(w, http.StatusOK, AuthResponse{
		Token: jwtToken, TokenType: "bearer", UserID: userID,
		TenantID: tenantID, Email: emailAddr, Role: role,
	})
}

func (h *AuthHandler) ResendCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "E-posta adresi gereklidir"})
		return
	}

	// Check pending_registrations first
	var pendingID int
	err := h.DB.QueryRow(r.Context(), `SELECT id FROM pending_registrations WHERE email=$1`, req.Email).Scan(&pendingID)
	if err == nil {
		// Generate new code for pending registration
		code := generateVerificationCode()
		token := generateVerificationToken()
		h.DB.Exec(r.Context(), `UPDATE pending_registrations SET code=$1, token=$2, expires_at=NOW() + INTERVAL '1 hour' WHERE id=$3`, code, token, pendingID)
		go func() {
			email.SendVerificationEmail(req.Email, code, token)
		}()
		writeJSON(w, http.StatusOK, map[string]string{"success": "true", "message": "Yeni doğrulama kodu gönderildi"})
		return
	}

	// Fallback: existing user flow
	var userID int
	var aktif bool
	err = h.DB.QueryRow(r.Context(), `SELECT id, COALESCE(aktif, false) FROM users WHERE email = $1`, req.Email).Scan(&userID, &aktif)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Bu e-posta adresiyle kayıtlı hesap bulunamadı"})
		return
	}
	if aktif {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Bu hesap zaten doğrulanmış"})
		return
	}

	// Invalidate old codes
	_, _ = h.DB.Exec(r.Context(), `UPDATE email_verification_tokens SET used = true WHERE user_id = $1 AND used = false`, userID)

	// Generate new code
	code := generateVerificationCode()
	token := generateVerificationToken()
	_, _ = h.DB.Exec(r.Context(), `INSERT INTO email_verification_tokens (user_id, token, code, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour')`, userID, token, code)

	go func() {
		if err := email.SendVerificationEmail(req.Email, code, token); err != nil {
			logging.System(logging.LevelWarn, "resend verification email failed", map[string]interface{}{"error": err.Error(), "email": req.Email})
		}
	}()

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Yeni doğrulama kodu e-posta adresinize gönderildi. Kod 1 saat geçerlidir.",
	})
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

func (h *AuthHandler) VerifyEmail(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	token := r.URL.Query().Get("token")

	if code == "" && token == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Doğrulama kodu eksik"})
		return
	}

	var userID, tenantID int
	var emailAddr, role string
	var expiresAt time.Time
	var used bool
	var err error

	if token != "" {
		err = h.DB.QueryRow(r.Context(), `
			SELECT v.user_id, v.expires_at, v.used, u.email, u.tenant_id, u.rol
			FROM email_verification_tokens v
			JOIN users u ON u.id = v.user_id
			WHERE v.token = $1
		`, token).Scan(&userID, &expiresAt, &used, &emailAddr, &tenantID, &role)
	} else {
		err = h.DB.QueryRow(r.Context(), `
			SELECT v.user_id, v.expires_at, v.used, u.email, u.tenant_id, u.rol
			FROM email_verification_tokens v
			JOIN users u ON u.id = v.user_id
			WHERE v.code = $1
			ORDER BY v.created_at DESC LIMIT 1
		`, code).Scan(&userID, &expiresAt, &used, &emailAddr, &tenantID, &role)
	}

	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz doğrulama kodu"})
		return
	}

	if used {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Bu doğrulama kodu zaten kullanılmış"})
		return
	}

	if time.Now().After(expiresAt) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin."})
		return
	}

	// Mark as used and activate user
	if token != "" {
		_, _ = h.DB.Exec(r.Context(), `UPDATE email_verification_tokens SET used = true WHERE token = $1`, token)
	} else {
		_, _ = h.DB.Exec(r.Context(), `UPDATE email_verification_tokens SET used = true WHERE code = $1 AND user_id = $2`, code, userID)
	}
	_, _ = h.DB.Exec(r.Context(), `UPDATE users SET aktif = true WHERE id = $1 AND aktif = false`, userID)

	logging.System(logging.LevelInfo, "email verified", map[string]interface{}{"user_id": userID, "email": emailAddr})

	// Auto-login: generate JWT and return it
	jwtToken, err := h.generateToken(userID, tenantID, emailAddr, role)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"success": true,
			"message": "E-posta adresiniz başarıyla doğrulandı! Şimdi giriş yapabilirsiniz.",
		})
		return
	}

	writeJSON(w, http.StatusOK, AuthResponse{
		Token:     jwtToken,
		TokenType: "bearer",
		UserID:    userID,
		TenantID:  tenantID,
		Email:     emailAddr,
		Role:      role,
	})
}

// ForgotPassword sends a password reset email with a 6-digit code
func (h *AuthHandler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "E-posta adresi zorunludur"})
		return
	}

	// Check if user exists
	var userID int
	err := h.DB.QueryRow(r.Context(), `SELECT id FROM users WHERE email = $1`, req.Email).Scan(&userID)
	if err != nil {
		// Don't reveal if email exists or not (security)
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"success": true,
			"message": "Eğer bu e-posta sistemde kayıtlıysa, şifre sıfırlama kodu gönderildi.",
		})
		return
	}

	// Generate 6-digit code
	codeNum, _ := rand.Int(rand.Reader, big.NewInt(1000000))
	code := fmt.Sprintf("%06d", codeNum.Int64())

	// Store reset token
	_, _ = h.DB.Exec(r.Context(),
		`INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
		req.Email, code)

	// Send email (non-blocking)
	go func() {
		if err := email.SendPasswordReset(req.Email, code); err != nil {
			logging.System(logging.LevelWarn, "password reset email failed", map[string]interface{}{"email": req.Email, "error": err.Error()})
		}
	}()

	logging.Auth(logging.LevelInfo, "password reset requested", "0", itoa(userID), "", r.RemoteAddr,
		map[string]interface{}{"email": req.Email})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Eğer bu e-posta sistemde kayıtlıysa, şifre sıfırlama kodu gönderildi.",
	})
}

// ResetPassword validates the code and updates the password
func (h *AuthHandler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Code     string `json:"code"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" || req.Code == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "E-posta, kod ve yeni şifre zorunludur"})
		return
	}

	if len(req.Password) < 8 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Şifre en az 8 karakter olmalıdır"})
		return
	}

	// Validate code
	var tokenID int
	err := h.DB.QueryRow(r.Context(),
		`SELECT id FROM password_resets WHERE email=$1 AND token=$2 AND used=false AND expires_at > NOW()`,
		req.Email, req.Code).Scan(&tokenID)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz veya süresi dolmuş kod"})
		return
	}

	// Update password
	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Şifre güncellenemedi"})
		return
	}
	_, err = h.DB.Exec(r.Context(), `UPDATE users SET password_hash=$1 WHERE email=$2`, string(hash), req.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Şifre güncellenemedi"})
		return
	}

	// Mark token as used
	h.DB.Exec(r.Context(), `UPDATE password_resets SET used=true WHERE id=$1`, tokenID)

	logging.Auth(logging.LevelInfo, "password reset completed", "", "", "", r.RemoteAddr,
		map[string]interface{}{"email": req.Email})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Şifreniz başarıyla güncellendi. Şimdi giriş yapabilirsiniz.",
	})
}
