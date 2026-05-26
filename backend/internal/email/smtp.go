package email

import (
	"crypto/tls"
	"fmt"
	"net/smtp"
	"strings"
)

type Config struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
}

var cfg Config

func Configure(c Config) {
	cfg = c
}

func Send(to string, subject string, body string) error {
	if cfg.Host == "" {
		return fmt.Errorf("SMTP yapılandırılmamış. Lütfen admin panelinden e-posta ayarlarını yapın.")
	}

	msg := buildMessage(cfg.From, to, subject, body)

	addr := cfg.Host + ":" + cfg.Port
	auth := smtp.PlainAuth("", cfg.Username, cfg.Password, cfg.Host)

	tlsConfig := &tls.Config{
		ServerName: cfg.Host,
	}

	conn, err := tls.Dial("tcp", addr, tlsConfig)
	if err != nil {
		return fmt.Errorf("SMTP bağlantı hatası: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, cfg.Host)
	if err != nil {
		return fmt.Errorf("SMTP client hatası: %w", err)
	}
	defer client.Close()

	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP kimlik doğrulama hatası: %w", err)
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

func SendVerificationEmail(to string, token string) error {
	subject := "Unysol — E-posta Doğrulama"
	body := fmt.Sprintf(`<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #FF5F03;">Unysol'a Hoş Geldiniz!</h2>
  <p>Hesabınızı aktifleştirmek için aşağıdaki linke tıklayın:</p>
  <p>
    <a href="https://unysolar.com/verify?token=%s" 
       style="background: #FF5F03; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Hesabımı Doğrula
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">
    Bu link 24 saat geçerlidir. Eğer bu kaydı siz yapmadıysanız, bu e-postayı görmezden gelin.
  </p>
  <hr style="border: 1px solid #eee; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Unysol — Kamyoncular için yük bulma, takip ve fatura platformu</p>
</body>
</html>`, token)
	return Send(to, subject, body)
}
