package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/email"
	"unysol/internal/logging"
	"unysol/internal/middleware"
)

type EmailHandler struct {
	DB *pgxpool.Pool
}

type SMTPConfig struct {
	Host     string `json:"host"`
	Port     string `json:"port"`
	Username string `json:"username"`
	Password string `json:"password"`
	From     string `json:"from"`
}

func (h *EmailHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	cfg := SMTPConfig{}
	err := h.DB.QueryRow(r.Context(), `
		SELECT COALESCE(host,''), COALESCE(port,''), COALESCE(username,''), COALESCE(password,''), COALESCE(from_email,'')
		FROM email_config WHERE id=1
	`).Scan(&cfg.Host, &cfg.Port, &cfg.Username, &cfg.Password, &cfg.From)
	if err != nil {
		writeJSON(w, http.StatusOK, SMTPConfig{})
		return
	}
	// Mask password in response
	if cfg.Password != "" {
		cfg.Password = "********"
	}
	writeJSON(w, http.StatusOK, cfg)
}

func (h *EmailHandler) SaveConfig(w http.ResponseWriter, r *http.Request) {
	var req SMTPConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	if req.Host == "" || req.Username == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Sunucu, kullanıcı adı ve şifre zorunludur"})
		return
	}

	if req.Port == "" {
		req.Port = "465"
	}

	_, err := h.DB.Exec(r.Context(), `
		INSERT INTO email_config (id, host, port, username, password, from_email)
		VALUES (1, $1, $2, $3, $4, $5)
		ON CONFLICT (id) DO UPDATE SET host=$1, port=$2, username=$3, password=$4, from_email=$5
	`, req.Host, req.Port, req.Username, req.Password, req.From)

	if err != nil {
		logging.Error(logging.LevelError, err, "", "", "", "", "email", "save config failed", nil)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Ayarlar kaydedilemedi"})
		return
	}

	// Update runtime config
	email.Configure(email.Config{
		Host:     req.Host,
		Port:     req.Port,
		Username: req.Username,
		Password: req.Password,
		From:     req.From,
	})

	logging.System(logging.LevelInfo, "email config updated", map[string]interface{}{
		"host": req.Host,
		"user": req.Username,
		"by":   middleware.GetUserID(r.Context()),
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "E-posta ayarları kaydedildi"})
}

func (h *EmailHandler) TestConfig(w http.ResponseWriter, r *http.Request) {
	var req SMTPConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	// Temporarily configure for test
	email.Configure(email.Config{
		Host:     req.Host,
		Port:     req.Port,
		Username: req.Username,
		Password: req.Password,
		From:     req.From,
	})

	err := email.Send(req.From, "Unysol — Test E-postası", "<h3>E-posta ayarlarınız başarıyla yapılandırıldı!</h3><p>Bu bir test e-postasıdır.</p>")
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Test e-postası gönderildi!"})
}
