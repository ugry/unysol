package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/email"
	"unysol/internal/logging"
	"unysol/internal/middleware"
)

type EmailHandler struct {
	DB *pgxpool.Pool
}

type GlobalEmailConfig struct {
	EmailAddress      string `json:"email_address"`
	EmailPass         string `json:"email_password"`
	SmtpAddress       string `json:"smtp_address"`
	ImapAddress       string `json:"imap_address"`
	SmtpPort          string `json:"smtp_port"`
	ImapPort          string `json:"imap_port"`
	GoogleClientID    string `json:"google_client_id"`
	StripePubKey      string `json:"stripe_pub_key"`
	StripePriceMonthly string `json:"stripe_price_monthly"`
	StripePriceYearly string `json:"stripe_price_yearly"`
}

func (h *EmailHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	cfg := GlobalEmailConfig{}
	err := h.DB.QueryRow(r.Context(), `
		SELECT COALESCE(email_address,''), COALESCE(password,''), COALESCE(smtp_address,''),
		       COALESCE(imap_address,''), COALESCE(port,'465'), COALESCE(imap_port,'993'),
		       COALESCE(google_client_id,''), COALESCE(stripe_pub_key,''),
		       COALESCE(stripe_price_monthly,''), COALESCE(stripe_price_yearly,'')
		FROM email_config WHERE id=1
	`).Scan(&cfg.EmailAddress, &cfg.EmailPass, &cfg.SmtpAddress, &cfg.ImapAddress, &cfg.SmtpPort, &cfg.ImapPort,
		&cfg.GoogleClientID, &cfg.StripePubKey, &cfg.StripePriceMonthly, &cfg.StripePriceYearly)
	if err != nil {
		writeJSON(w, http.StatusOK, GlobalEmailConfig{SmtpPort: "465", ImapPort: "993"})
		return
	}
	if cfg.EmailPass != "" {
		cfg.EmailPass = "********"
	}
	writeJSON(w, http.StatusOK, cfg)
}

func (h *EmailHandler) SaveConfig(w http.ResponseWriter, r *http.Request) {
	var req GlobalEmailConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	if req.EmailAddress == "" || req.SmtpAddress == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "E-posta adresi ve SMTP adresi zorunludur"})
		return
	}

	if req.SmtpPort == "" {
		req.SmtpPort = "465"
	}
	if req.ImapPort == "" {
		req.ImapPort = "993"
	}

	// If password is masked, keep existing
	passwordVal := req.EmailPass
	if passwordVal == "********" {
		_ = h.DB.QueryRow(r.Context(), `SELECT COALESCE(password,'') FROM email_config WHERE id=1`).Scan(&passwordVal)
	}

	host := strings.TrimPrefix(req.SmtpAddress, "smtp.")

	_, err := h.DB.Exec(r.Context(), `
		INSERT INTO email_config (id, email_address, password, smtp_address, imap_address, port, imap_port, host, username, from_email, google_client_id, stripe_pub_key, stripe_price_monthly, stripe_price_yearly)
		VALUES (1, $1, $2, $3, $4, $5, $6, $7, $1, $1, $8, $9, $10, $11)
		ON CONFLICT (id) DO UPDATE SET
			email_address=$1, password=$2, smtp_address=$3, imap_address=$4,
			port=$5, imap_port=$6, host=$7, username=$1, from_email=$1,
			google_client_id=$8, stripe_pub_key=$9, stripe_price_monthly=$10, stripe_price_yearly=$11
	`, req.EmailAddress, passwordVal, req.SmtpAddress, req.ImapAddress, req.SmtpPort, req.ImapPort, host,
		req.GoogleClientID, req.StripePubKey, req.StripePriceMonthly, req.StripePriceYearly)

	if err != nil {
		logging.Error(logging.LevelError, err, "", "", "", "", "email", "save config failed", nil)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Ayarlar kaydedilemedi"})
		return
	}

	email.Configure(email.Config{
		Host:     host,
		Port:     req.SmtpPort,
		Username: req.EmailAddress,
		Password: passwordVal,
		From:     req.EmailAddress,
	})

	logging.System(logging.LevelInfo, "global email config updated", map[string]interface{}{
		"smtp": req.SmtpAddress,
		"user": req.EmailAddress,
		"by":   middleware.GetUserID(r.Context()),
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Sistem ayarları kaydedildi"})
}

func (h *EmailHandler) TestConfig(w http.ResponseWriter, r *http.Request) {
	var req GlobalEmailConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	host := strings.TrimPrefix(req.SmtpAddress, "smtp.")
	pass := req.EmailPass
	if pass == "********" {
		_ = h.DB.QueryRow(r.Context(), `SELECT COALESCE(password,'') FROM email_config WHERE id=1`).Scan(&pass)
	}

	email.Configure(email.Config{
		Host:     host,
		Port:     req.SmtpPort,
		Username: req.EmailAddress,
		Password: pass,
		From:     req.EmailAddress,
	})

	err := email.Send(req.EmailAddress, "Unysol — Sistem Testi", "<h3>E-posta ayarlarınız başarıyla yapılandırıldı!</h3><p>Bu bir test e-postasıdır.</p>")
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Test e-postası gönderildi!"})
}
