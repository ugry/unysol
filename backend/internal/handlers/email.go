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
	EmailMethod       string `json:"email_method"`
	EmailAddress      string `json:"email_address"`
	EmailPass         string `json:"email_password"`
	SmtpAddress       string `json:"smtp_address"`
	ImapAddress       string `json:"imap_address"`
	SmtpPort          string `json:"smtp_port"`
	ImapPort          string `json:"imap_port"`
	AwsRegion         string `json:"aws_region"`
	GoogleClientID    string `json:"google_client_id"`
	StripePubKey      string `json:"stripe_pub_key"`
	StripePriceMonthly string `json:"stripe_price_monthly"`
	StripePriceYearly string `json:"stripe_price_yearly"`
}

func (h *EmailHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	cfg := GlobalEmailConfig{}
	err := h.DB.QueryRow(r.Context(), `
		SELECT COALESCE(email_method,'smtp'), COALESCE(email_address,''), COALESCE(password,''),
		       COALESCE(smtp_address,''), COALESCE(imap_address,''), COALESCE(port,'465'),
		       COALESCE(imap_port,'993'), COALESCE(aws_region,'eu-central-1'),
		       COALESCE(google_client_id,''), COALESCE(stripe_pub_key,''),
		       COALESCE(stripe_price_monthly,''), COALESCE(stripe_price_yearly,'')
		FROM email_config WHERE id=1
	`).Scan(&cfg.EmailMethod, &cfg.EmailAddress, &cfg.EmailPass, &cfg.SmtpAddress,
		&cfg.ImapAddress, &cfg.SmtpPort, &cfg.ImapPort, &cfg.AwsRegion,
		&cfg.GoogleClientID, &cfg.StripePubKey, &cfg.StripePriceMonthly, &cfg.StripePriceYearly)
	if err != nil {
		writeJSON(w, http.StatusOK, GlobalEmailConfig{EmailMethod: "smtp", SmtpPort: "465", ImapPort: "993", AwsRegion: "eu-central-1"})
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

	if req.EmailMethod == "" {
		req.EmailMethod = "smtp"
	}
	if req.EmailMethod == "smtp" && (req.EmailAddress == "" || req.SmtpAddress == "") {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "SMTP yöntemi için e-posta adresi ve SMTP adresi zorunludur"})
		return
	}
	if req.EmailMethod == "ses" && req.EmailAddress == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "SES yöntemi için gönderici e-posta adresi zorunludur"})
		return
	}

	if req.SmtpPort == "" {
		req.SmtpPort = "465"
	}
	if req.ImapPort == "" {
		req.ImapPort = "993"
	}
	if req.AwsRegion == "" {
		req.AwsRegion = "eu-central-1"
	}

	passwordVal := req.EmailPass
	if passwordVal == "********" {
		_ = h.DB.QueryRow(r.Context(), `SELECT COALESCE(password,'') FROM email_config WHERE id=1`).Scan(&passwordVal)
	}

	host := strings.TrimPrefix(req.SmtpAddress, "smtp.")

	_, err := h.DB.Exec(r.Context(), `
		INSERT INTO email_config (id, email_method, email_address, password, smtp_address, imap_address,
			port, imap_port, host, username, from_email, aws_region,
			google_client_id, stripe_pub_key, stripe_price_monthly, stripe_price_yearly)
		VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $2, $2, $9, $10, $11, $12, $13)
		ON CONFLICT (id) DO UPDATE SET
			email_method=$1, email_address=$2, password=$3, smtp_address=$4, imap_address=$5,
			port=$6, imap_port=$7, host=$8, username=$2, from_email=$2, aws_region=$9,
			google_client_id=$10, stripe_pub_key=$11, stripe_price_monthly=$12, stripe_price_yearly=$13
	`, req.EmailMethod, req.EmailAddress, passwordVal, req.SmtpAddress, req.ImapAddress,
		req.SmtpPort, req.ImapPort, host, req.AwsRegion,
		req.GoogleClientID, req.StripePubKey, req.StripePriceMonthly, req.StripePriceYearly)

	if err != nil {
		logging.Error(logging.LevelError, err, "", "", "", "", "email", "save config failed", nil)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Ayarlar kaydedilemedi"})
		return
	}

	email.Configure(email.Config{
		Method:   req.EmailMethod,
		Host:     host,
		Port:     req.SmtpPort,
		Username: req.EmailAddress,
		Password: passwordVal,
		From:     req.EmailAddress,
		Region:   req.AwsRegion,
	})

	logging.System(logging.LevelInfo, "global email config updated", map[string]interface{}{
		"method": req.EmailMethod,
		"smtp":   req.SmtpAddress,
		"user":   req.EmailAddress,
		"by":     middleware.GetUserID(r.Context()),
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Sistem ayarları kaydedildi"})
}

func (h *EmailHandler) TestConfig(w http.ResponseWriter, r *http.Request) {
	var req GlobalEmailConfig
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	if req.EmailMethod == "" {
		req.EmailMethod = "smtp"
	}
	if req.AwsRegion == "" {
		req.AwsRegion = "eu-central-1"
	}

	host := strings.TrimPrefix(req.SmtpAddress, "smtp.")
	pass := req.EmailPass
	if pass == "********" {
		_ = h.DB.QueryRow(r.Context(), `SELECT COALESCE(password,'') FROM email_config WHERE id=1`).Scan(&pass)
	}

	email.Configure(email.Config{
		Method:   req.EmailMethod,
		Host:     host,
		Port:     req.SmtpPort,
		Username: req.EmailAddress,
		Password: pass,
		From:     req.EmailAddress,
		Region:   req.AwsRegion,
	})

	err := email.Send(req.EmailAddress, "Unysol — Sistem Testi", "<h3>E-posta ayarlarınız başarıyla yapılandırıldı!</h3><p>Bu bir test e-postasıdır.</p>")
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{"success": false, "error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "Test e-postası gönderildi!"})
}
