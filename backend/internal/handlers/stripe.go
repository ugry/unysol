package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/logging"
	"unysol/internal/middleware"
)

type StripeHandler struct {
	DB *pgxpool.Pool
}

type CheckoutRequest struct {
	PriceID string `json:"price_id"`
	Plan    string `json:"plan"`
}

func getStripeSecretKey(h *StripeHandler, r *http.Request) string {
	// Try env var first (for local/dev), fall back to database (for production)
	sk := os.Getenv("STRIPE_SECRET_KEY")
	if sk != "" {
		return sk
	}
	// Read from DB email_config
	var dbKey string
	_ = h.DB.QueryRow(r.Context(), `SELECT COALESCE(stripe_secret_key,'') FROM email_config WHERE id=1`).Scan(&dbKey)
	return dbKey
}

func getStripePublishableKey() string {
	return os.Getenv("STRIPE_PUBLISHABLE_KEY")
}

func (h *StripeHandler) CreateCheckoutSession(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := middleware.GetUserID(r.Context())

	var req CheckoutRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	sk := getStripeSecretKey(h, r)
	if sk == "" {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Stripe yapılandırılmamış"})
		return
	}

	var userEmail string
	_ = h.DB.QueryRow(r.Context(), `SELECT email FROM users WHERE id=$1`, userID).Scan(&userEmail)

	if req.PriceID == "" {
		// Look up price from DB config
		var monthlyPrice, yearlyPrice string
		_ = h.DB.QueryRow(r.Context(),
			`SELECT COALESCE(stripe_price_monthly,''), COALESCE(stripe_price_yearly,'') FROM email_config WHERE id=1`,
		).Scan(&monthlyPrice, &yearlyPrice)
		if req.Plan == "PRO" {
			req.PriceID = yearlyPrice
		}
		if req.PriceID == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Fiyat ID bulunamadı. Lütfen admin panelinden Stripe ayarlarını yapın."})
			return
		}
	}

	// Create Stripe checkout session via form-encoded
	// Build body manually to avoid encoding {CHECKOUT_SESSION_ID} braces
	formBody := fmt.Sprintf(
		"mode=subscription&customer_email=%s&line_items[0][price]=%s&line_items[0][quantity]=1&"+
			"success_url=%s&cancel_url=%s&metadata[tenant_id]=%s&metadata[user_id]=%s&metadata[plan]=%s",
		url.QueryEscape(userEmail),
		url.QueryEscape(req.PriceID),
		url.QueryEscape("https://unysolar.com/dashboard/settings?session_id={CHECKOUT_SESSION_ID}"),
		url.QueryEscape("https://unysolar.com/dashboard/settings?canceled=true"),
		url.QueryEscape(tenantID),
		url.QueryEscape(userID),
		url.QueryEscape(req.Plan),
	)

	stripeReq, _ := http.NewRequest("POST", "https://api.stripe.com/v1/checkout/sessions", bytes.NewReader([]byte(formBody)))
	stripeReq.SetBasicAuth(sk, "")
	stripeReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(stripeReq)
	if err != nil {
		logging.System(logging.LevelError, "stripe checkout failed", map[string]interface{}{"error": err.Error()})
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Ödeme oturumu oluşturulamadı"})
		return
	}
	defer resp.Body.Close()

	var session map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&session)

	if resp.StatusCode != 200 {
		errMsg := fmt.Sprintf("Stripe error: HTTP %d", resp.StatusCode)
		if session != nil {
			errMsg = fmt.Sprintf("%v", session["error"])
		}
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": errMsg})
		return
	}

	sessionURL, _ := session["url"].(string)
	writeJSON(w, http.StatusOK, map[string]string{"url": sessionURL})
}

func (h *StripeHandler) VerifySession(w http.ResponseWriter, r *http.Request) {
	var req struct {
		SessionID string `json:"session_id"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if req.SessionID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "session_id gerekli"})
		return
	}

	sk := getStripeSecretKey(h, r)
	if sk == "" {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Stripe yapılandırılmamış"})
		return
	}

	stripeReq, _ := http.NewRequest("GET", "https://api.stripe.com/v1/checkout/sessions/"+req.SessionID, nil)
	stripeReq.SetBasicAuth(sk, "")
	resp, err := http.DefaultClient.Do(stripeReq)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Oturum kontrol edilemedi"})
		return
	}
	defer resp.Body.Close()

	var session map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&session)

	paymentStatus, _ := session["payment_status"].(string)
	metadata, _ := session["metadata"].(map[string]interface{})

	if paymentStatus == "paid" && metadata != nil {
		tenantID, _ := metadata["tenant_id"].(string)
		plan, _ := metadata["plan"].(string)
		customer, _ := session["customer"].(string)
		subscription, _ := session["subscription"].(string)
		amountTotal, _ := session["amount_total"].(float64)

		if tenantID != "" && plan != "" {
			tid, _ := strconv.Atoi(tenantID)
			h.DB.Exec(r.Context(),
				`INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret) VALUES ($1,$2,CURRENT_DATE,CURRENT_DATE+INTERVAL '1 year',$3) ON CONFLICT DO NOTHING`,
				tid, plan, amountTotal/100)
			h.DB.Exec(r.Context(),
				`UPDATE tenants SET plan='PRO', stripe_customer_id=$1, stripe_subscription_id=$2 WHERE id=$3`,
				customer, subscription, tid)

			// Generate new JWT with PRO modules
			var email, role string
			var uid int
			h.DB.QueryRow(r.Context(), `SELECT id, email, COALESCE(rol::text,'TENANT_OWNER') FROM users WHERE tenant_id=$1 AND rol='TENANT_OWNER' LIMIT 1`, tid).Scan(&uid, &email, &role)

			claims := jwt.MapClaims{
				"user_id": uid, "tenant_id": tid, "email": email, "role": role,
				"exp": time.Now().Add(365 * 24 * time.Hour).Unix(),
				"iat": time.Now().Unix(),
			}
			// Add PRO modules
			rows, _ := h.DB.Query(r.Context(), `SELECT m.module_key FROM plan_modules pm JOIN modules m ON m.id=pm.module_id WHERE pm.plan='PRO' AND pm.enabled=true`)
			if rows != nil {
				defer rows.Close()
				var allowed []string
				for rows.Next() { var k string; rows.Scan(&k); allowed = append(allowed, k) }
				claims["allowed_modules"] = allowed
			}
			jwtToken, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(os.Getenv("JWT_SECRET")))

			writeJSON(w, http.StatusOK, map[string]interface{}{
				"success": true, "plan": plan,
				"access_token": jwtToken, "user_id": uid, "tenant_id": tid, "email": email, "role": role,
				"message": "Plan PRO'ya yükseltildi!",
			})
			return
		}
	}
	writeJSON(w, http.StatusOK, map[string]string{"success": "false", "status": paymentStatus})
}

func (h *StripeHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	payload, _ := io.ReadAll(r.Body)

	var event map[string]interface{}
	json.Unmarshal(payload, &event)

	eventType, _ := event["type"].(string)
	data, _ := event["data"].(map[string]interface{})
	obj, _ := data["object"].(map[string]interface{})
	metadata, _ := obj["metadata"].(map[string]interface{})

	tenantID := ""
	plan := ""
	if metadata != nil {
		tenantID, _ = metadata["tenant_id"].(string)
		plan, _ = metadata["plan"].(string)
	}

	logging.System(logging.LevelInfo, "stripe webhook received", map[string]interface{}{
		"type":      eventType,
		"tenant_id": tenantID,
		"plan":      plan,
	})

	switch eventType {
	case "checkout.session.completed":
		customer, _ := obj["customer"].(string)
		subscription, _ := obj["subscription"].(string)
		amountTotal, _ := obj["amount_total"].(float64)

		if tenantID != "" && plan != "" {
			tid, _ := strconv.Atoi(tenantID)
			// Update subscription
			_, _ = h.DB.Exec(r.Context(),
				`INSERT INTO subscriptions (tenant_id, plan, baslangic, bitis, ucret)
				 VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 year', $3)
				 ON CONFLICT DO NOTHING`,
				tid, plan, amountTotal/100)

			// Update tenant plan to PRO
			_, _ = h.DB.Exec(r.Context(),
				`UPDATE tenants SET plan='PRO', stripe_customer_id=$1, stripe_subscription_id=$2 WHERE id=$3`,
				customer, subscription, tid)

			logging.System(logging.LevelInfo, "subscription updated via stripe", map[string]interface{}{
				"tenant_id": tid, "plan": plan, "customer": customer,
			})
		}

	case "customer.subscription.deleted":
		subscription, _ := obj["id"].(string)
		if subscription != "" {
			_, _ = h.DB.Exec(r.Context(),
				`UPDATE subscriptions SET plan='FREE', ucret=0 WHERE tenant_id=(SELECT id FROM tenants WHERE stripe_subscription_id=$1)`,
				subscription)
		}
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *StripeHandler) GetConfig(w http.ResponseWriter, r *http.Request) {
	var pubKey, secretKey, priceMonthly, priceYearly string
	_ = h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(stripe_pub_key,''), COALESCE(stripe_secret_key,''), COALESCE(stripe_price_monthly,''), COALESCE(stripe_price_yearly,'') FROM email_config WHERE id=1`,
	).Scan(&pubKey, &secretKey, &priceMonthly, &priceYearly)

	writeJSON(w, http.StatusOK, map[string]string{
		"publishable_key":    pubKey,
		"secret_key_set":     boolToString(secretKey != ""),
		"price_monthly":      priceMonthly,
		"price_yearly":       priceYearly,
	})
}

func boolToString(b bool) string {
	if b { return "true" }
	return "false"
}
