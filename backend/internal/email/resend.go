package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

var resendAPIKey string

func SetResendAPIKey(key string) {
	resendAPIKey = key
}

type resendEmail struct {
	From    string   `json:"from"`
	To      []string `json:"to"`
	Subject string   `json:"subject"`
	Html    string   `json:"html"`
}

func sendViaResend(from, to, subject, body string) error {
	if resendAPIKey == "" {
		return fmt.Errorf("Resend API key not configured")
	}

	payload := resendEmail{
		From:    from,
		To:      []string{to},
		Subject: subject,
		Html:    body,
	}

	jsonBody, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("Resend marshal error: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(jsonBody))
	if err != nil {
		return fmt.Errorf("Resend request error: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+resendAPIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("Resend API error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		var errResp struct {
			Message string `json:"message"`
		}
		json.NewDecoder(resp.Body).Decode(&errResp)
		if errResp.Message != "" {
			return fmt.Errorf("Resend API: %s", errResp.Message)
		}
		return fmt.Errorf("Resend API returned status %d", resp.StatusCode)
	}

	return nil
}
