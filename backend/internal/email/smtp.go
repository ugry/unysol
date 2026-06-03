package email

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/smtp"
	"strings"
)

type Config struct {
	Method   string // "smtp" or "ses"
	Host     string
	Port     string
	Username string
	Password string
	From     string
	Region   string
}

var cfg Config

func Configure(c Config) {
	if c.Method == "" {
		c.Method = "smtp"
	}
	cfg = c
}

func Send(to string, subject string, body string) error {
	if cfg.Method == "ses" {
		region := cfg.Region
		if region == "" {
			region = "eu-central-1"
		}
		return sendViaSES(cfg.From, to, subject, body, region)
	}

	if cfg.Host == "" {
		return fmt.Errorf("SMTP yapılandırılmamış. Lütfen admin panelinden e-posta ayarlarını yapın.")
	}

	msg := buildMessage(cfg.From, to, subject, body)

	addr := cfg.Host + ":" + cfg.Port

	var client *smtp.Client
	if cfg.Port == "1025" || cfg.Port == "25" || (cfg.Username == "" && cfg.Password == "") {
		conn, err := net.Dial("tcp", addr)
		if err != nil {
			return fmt.Errorf("SMTP bağlantı hatası: %w", err)
		}
		client, err = smtp.NewClient(conn, cfg.Host)
		if err != nil {
			conn.Close()
			return fmt.Errorf("SMTP client hatası: %w", err)
		}
	} else {
		tlsConfig := &tls.Config{ServerName: cfg.Host}
		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			return fmt.Errorf("SMTP bağlantı hatası: %w", err)
		}
		client, err = smtp.NewClient(conn, cfg.Host)
		if err != nil {
			conn.Close()
			return fmt.Errorf("SMTP client hatası: %w", err)
		}
	}
	defer client.Close()

	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

	if cfg.Username != "" || cfg.Password != "" {
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("SMTP kimlik doğrulama hatası: %w", err)
		}
	}

	if err := client.Mail(cfg.From); err != nil {
		return fmt.Errorf("SMTP gönderici hatası: %w", err)
	}

	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("SMTP alıcı hatası: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("SMTP veri hatası: %w", err)
	}
	defer w.Close()

	if _, err := w.Write([]byte(msg)); err != nil {
		return fmt.Errorf("SMTP yazma hatası: %w", err)
	}

	return nil
}

func buildMessage(from, to, subject, body string) string {
	var msg strings.Builder
	msg.WriteString(fmt.Sprintf("From: %s\r\n", from))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)
	return msg.String()
}

func SendVerificationEmail(to string, code string, token string) error {
	subject := fmt.Sprintf("Unysol — Doğrulama Kodunuz: %s", code)
	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #FF5F03;">Unysol'a Hoş Geldiniz!</h2>
  <p>Hesabınızı aktifleştirmek için doğrulama kodunuz:</p>
  <div style="background: #FFF3E0; border: 2px dashed #FF5F03; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #FF5F03;">%s</span>
  </div>
  <p>Veya aşağıdaki linke tıklayarak doğrulayabilirsiniz:</p>
  <p>
    <a href="http://localhost/verify?token=%s&code=%s"
       style="background: #FF5F03; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Hesabımı Doğrula
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    Bu kod 1 saat süreyle geçerlidir. Eğer bu kaydı siz yapmadıysanız, bu e-postayı görmezden gelin.
  </p>
  <hr style="border: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Unysol — Kamyoncular için yük bulma, takip ve fatura platformu</p>
</body>
</html>`, code, token, code)
	return Send(to, subject, body)
}

func SendPasswordReset(to string, code string) error {
	subject := fmt.Sprintf("Unysol — Şifre Sıfırlama Kodunuz: %s", code)
	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #FF5F03;">Şifre Sıfırlama Talebi</h2>
  <p>Unysol hesabınız için şifre sıfırlama talebi alındı.</p>
  <p>Şifrenizi sıfırlamak için kodunuz:</p>
  <div style="background: #FFF3E0; border: 2px dashed #FF5F03; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
    <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #FF5F03;">%s</span>
  </div>
  <p style="color: #666; font-size: 14px;">
    Bu kod 1 saat süreyle geçerlidir. Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelin.
  </p>
  <hr style="border: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Unysol — Kamyoncular için yük bulma, takip ve fatura platformu</p>
</body>
</html>`, code)
	return Send(to, subject, body)
}
