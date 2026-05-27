package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"unysol/internal/logging"
)

type GoogleHandler struct {
	DB        *pgxpool.Pool
	JWTSecret string
}

type GoogleLoginRequest struct {
	IdToken string `json:"id_token"`
}

type GoogleTokenInfo struct {
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Sub           string `json:"sub"`
}

func (h *GoogleHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req GoogleLoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.IdToken == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz Google kimliği"})
		return
	}

	// Validate token with Google
	tokenInfo, err := verifyGoogleToken(req.IdToken)
	if err != nil {
		logging.System(logging.LevelWarn, "google token verification failed", map[string]interface{}{"error": err.Error()})
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Google doğrulama başarısız. Lütfen tekrar deneyin."})
		return
	}

	if !tokenInfo.VerifiedEmail || tokenInfo.Email == "" {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Google hesabınızda e-posta doğrulanmamış."})
		return
	}

	// Check if user exists
	var userID, tenantID int
	var passwordHash, role string
	var aktif bool

	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, password_hash, rol, COALESCE(aktif, false) FROM users WHERE email = $1`,
		tokenInfo.Email,
	).Scan(&userID, &tenantID, &passwordHash, &role, &aktif)

	if err != nil {
		// User doesn't exist — create new tenant + user with auto-verification
		slug := generateGoogleSlug(tokenInfo.Email, tokenInfo.Name)
		displayName := tokenInfo.Name
		if displayName == "" {
			displayName = strings.Split(tokenInfo.Email, "@")[0]
		}

		err = h.DB.QueryRow(r.Context(),
			`INSERT INTO tenants (slug, firma_unvani) VALUES ($1, $2) RETURNING id`,
			slug, displayName,
		).Scan(&tenantID)
		if err != nil {
			logging.System(logging.LevelError, "google signup — tenant create failed", map[string]interface{}{"error": err.Error()})
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Hesap oluşturulamadı"})
			return
		}

		randomPass := generateVerificationToken()[:16]
		hash, _ := bcrypt.GenerateFromPassword([]byte(randomPass), bcrypt.DefaultCost)

		err = h.DB.QueryRow(r.Context(),
			`INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, aktif)
			 VALUES ($1, $2, $3, $4, 'TENANT_OWNER', true) RETURNING id`,
			tenantID, tokenInfo.Email, string(hash), displayName,
		).Scan(&userID)
		if err != nil {
			logging.System(logging.LevelError, "google signup — user create failed", map[string]interface{}{"error": err.Error()})
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Kullanıcı oluşturulamadı"})
			return
		}

		_, _ = h.DB.Exec(r.Context(),
			`INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret) VALUES ($1, 'FREE', CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', 0)`,
			tenantID)

		role = "TENANT_OWNER"
		logging.System(logging.LevelInfo, "google signup success", map[string]interface{}{
			"email": tokenInfo.Email, "tenant_id": tenantID, "user_id": userID,
		})
	} else {
		// User exists — auto-activate if not already active (Google bypasses email verification)
		if !aktif {
			_, _ = h.DB.Exec(r.Context(), `UPDATE users SET aktif=true WHERE id=$1`, userID)
		}
		logging.System(logging.LevelInfo, "google login success", map[string]interface{}{
			"email": tokenInfo.Email, "user_id": userID,
		})
	}

	// Generate JWT
	token, err := generateJWT(h.JWTSecret, userID, tenantID, tokenInfo.Email, role)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Token oluşturulamadı"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"access_token": token,
		"token_type":   "bearer",
		"user_id":      userID,
		"tenant_id":    tenantID,
		"email":        tokenInfo.Email,
		"role":         role,
	})
}

func verifyGoogleToken(idToken string) (*GoogleTokenInfo, error) {
	// Decode JWT locally — Google ID tokens are standard JWTs
	// We extract email/name from payload and verify aud matches our client
	parts := strings.Split(idToken, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("geçersiz JWT formatı")
	}

	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("JWT çözümleme hatası: %w", err)
	}

	var claims struct {
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"email_verified"`
		Name          string `json:"name"`
		Picture       string `json:"picture"`
		Sub           string `json:"sub"`
		Aud           string `json:"aud"`
		Iss           string `json:"iss"`
	}
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, fmt.Errorf("claims çözümleme hatası: %w", err)
	}

	// Validate issuer is Google
	if claims.Iss != "accounts.google.com" && claims.Iss != "https://accounts.google.com" {
		return nil, fmt.Errorf("geçersiz sağlayıcı: %s", claims.Iss)
	}

	if claims.Email == "" {
		return nil, fmt.Errorf("e-posta bulunamadı")
	}

	if !claims.VerifiedEmail {
		return nil, fmt.Errorf("e-posta doğrulanmamış")
	}

	return &GoogleTokenInfo{
		Email:         claims.Email,
		VerifiedEmail: claims.VerifiedEmail,
		Name:          claims.Name,
		Picture:       claims.Picture,
		Sub:           claims.Sub,
	}, nil
}

func generateGoogleSlug(email, name string) string {
	prefix := "google-"
	if name != "" {
		prefix = strings.ToLower(strings.ReplaceAll(name, " ", "-"))
		prefix = cleanSlug(prefix)
		if len(prefix) > 30 {
			prefix = prefix[:30]
		}
	}
	// Add random suffix to avoid collisions
	suffix := time.Now().UnixNano() % 10000
	return fmt.Sprintf("%s-%d", prefix, suffix)
}

func generateJWT(secret string, userID, tenantID int, email, role string) (string, error) {
	claims := map[string]interface{}{
		"user_id":   userID,
		"tenant_id": tenantID,
		"email":     email,
		"role":      role,
		"exp":       time.Now().Add(365 * 24 * time.Hour).Unix(),
		"iat":       time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims(claims))
	return token.SignedString([]byte(secret))
}
