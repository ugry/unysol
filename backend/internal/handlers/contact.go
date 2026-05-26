package handlers

import (
	"encoding/json"
	"net/http"

	"unysol/internal/logging"
)

type ContactHandler struct{}

type ContactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
	Plan    string `json:"plan"`
	Message string `json:"message"`
}

func (h *ContactHandler) Submit(w http.ResponseWriter, r *http.Request) {
	var req ContactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if req.Name == "" || req.Email == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name and email are required"})
		return
	}

	logging.System(logging.LevelInfo, "contact form submitted", map[string]interface{}{
		"name":    req.Name,
		"email":   req.Email,
		"phone":   req.Phone,
		"plan":    req.Plan,
		"message": req.Message,
		"ip":      r.RemoteAddr,
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Mesajınız iletildi. 24 saat içinde dönüş yapacağız.",
	})
}
