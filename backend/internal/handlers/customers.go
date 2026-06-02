package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type CustomersHandler struct {
	DB *pgxpool.Pool
}

func (h *CustomersHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant(h.DB))
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	r.Get("/{id}/detail", h.Detail)
	r.Get("/{id}/payments", h.ListPayments)
	r.Post("/{id}/payments", h.AddPayment)
	return r
}

func (h *CustomersHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	search := r.URL.Query().Get("search")
	kategori := r.URL.Query().Get("kategori")

	query := `SELECT id, tenant_id, firma_unvani, COALESCE(yetkili,''), COALESCE(telefon,''), 
		COALESCE(email,''), COALESCE(adres,''), COALESCE(fatura_adresi,''),
		COALESCE(vergi_dairesi,''), COALESCE(vergi_no,''),
		COALESCE(kategori,'GENEL'), COALESCE(bakiye,0), COALESCE(acik_hesap_limiti,0),
		COALESCE(risk_skoru,'DUSUK'), COALESCE(vade_gun,30),
		depo_adresleri, fiyat_katalogu, COALESCE(sozlesme_url,''),
		COALESCE(musteri_temsilcisi,''), COALESCE(notlar,''),
		COALESCE(durum,'AKTIF'), created_at
		FROM customers WHERE tenant_id = $1`
	args := []interface{}{tenantID}
	argIdx := 2

	if search != "" {
		query += ` AND (firma_unvani ILIKE $` + strconv.Itoa(argIdx) +
			` OR yetkili ILIKE $` + strconv.Itoa(argIdx) +
			` OR telefon ILIKE $` + strconv.Itoa(argIdx) + `)`
		args = append(args, "%"+search+"%")
		argIdx++
	}
	if kategori != "" {
		query += ` AND kategori = $` + strconv.Itoa(argIdx)
		args = append(args, kategori)
	}

	query += " ORDER BY firma_unvani"

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to list customers", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "error": "failed to list customers"})
		return
	}
	defer rows.Close()

	customers := make([]models.Customer, 0)
	for rows.Next() {
		var c models.Customer
		if err := rows.Scan(&c.ID, &c.TenantID, &c.FirmaUnvani, &c.Yetkili, &c.Telefon,
			&c.Email, &c.Adres, &c.FaturaAdresi, &c.VergiDairesi, &c.VergiNo,
			&c.Kategori, &c.Bakiye, &c.AcikHesapLimiti, &c.RiskSkoru, &c.VadeGun,
			&c.DepoAdresleri, &c.FiyatKatalogu, &c.SozlesmeUrl,
			&c.MusteriTemsilcisi, &c.Notlar, &c.Durum, &c.CreatedAt); err != nil {
			slog.Error("failed to scan customer", "error", err)
			continue
		}
		customers = append(customers, c)
	}

	writeJSON(w, http.StatusOK, customers)
}

func (h *CustomersHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		FirmaUnvani      string          `json:"firma_unvani"`
		Yetkili          string          `json:"yetkili"`
		Telefon          string          `json:"telefon"`
		Email            string          `json:"email"`
		Adres            string          `json:"adres"`
		FaturaAdresi     string          `json:"fatura_adresi"`
		VergiDairesi     string          `json:"vergi_dairesi"`
		VergiNo          string          `json:"vergi_no"`
		Kategori         string          `json:"kategori"`
		AcikHesapLimiti  float64         `json:"acik_hesap_limiti"`
		RiskSkoru        string          `json:"risk_skoru"`
		VadeGun          int             `json:"vade_gun"`
		DepoAdresleri    json.RawMessage `json:"depo_adresleri"`
		MusteriTemsilcisi string         `json:"musteri_temsilcisi"`
		Notlar           string          `json:"notlar"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "invalid request body"})
		return
	}
	if req.FirmaUnvani == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "firma_unvani is required"})
		return
	}
	if req.Kategori == "" { req.Kategori = "GENEL" }
	if req.RiskSkoru == "" { req.RiskSkoru = "DUSUK" }
	if req.VadeGun == 0 { req.VadeGun = 30 }

	var c models.Customer
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO customers (tenant_id, firma_unvani, yetkili, telefon, email, adres, fatura_adresi,
		 vergi_dairesi, vergi_no, kategori, acik_hesap_limiti, risk_skoru, vade_gun,
		 depo_adresleri, musteri_temsilcisi, notlar)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
		 RETURNING id, tenant_id, firma_unvani, COALESCE(yetkili,''), COALESCE(telefon,''), COALESCE(email,''),
		 COALESCE(adres,''), COALESCE(fatura_adresi,''), COALESCE(vergi_dairesi,''), COALESCE(vergi_no,''),
		 COALESCE(kategori,'GENEL'), COALESCE(bakiye,0), COALESCE(acik_hesap_limiti,0),
		 COALESCE(risk_skoru,'DUSUK'), COALESCE(vade_gun,30), depo_adresleri, NULL::jsonb,
		 COALESCE(sozlesme_url,''), COALESCE(musteri_temsilcisi,''), COALESCE(notlar,''),
		 COALESCE(durum,'AKTIF'), created_at`,
		tenantID, req.FirmaUnvani, req.Yetkili, req.Telefon, req.Email, req.Adres, req.FaturaAdresi,
		req.VergiDairesi, req.VergiNo, req.Kategori, req.AcikHesapLimiti, req.RiskSkoru, req.VadeGun,
		req.DepoAdresleri, req.MusteriTemsilcisi, req.Notlar,
	).Scan(&c.ID, &c.TenantID, &c.FirmaUnvani, &c.Yetkili, &c.Telefon, &c.Email,
		&c.Adres, &c.FaturaAdresi, &c.VergiDairesi, &c.VergiNo,
		&c.Kategori, &c.Bakiye, &c.AcikHesapLimiti, &c.RiskSkoru, &c.VadeGun,
		&c.DepoAdresleri, &c.FiyatKatalogu, &c.SozlesmeUrl,
		&c.MusteriTemsilcisi, &c.Notlar, &c.Durum, &c.CreatedAt)
	if err != nil {
		slog.Error("failed to create customer", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "error": "failed to create customer"})
		return
	}

	writeJSON(w, http.StatusCreated, c)
}

func (h *CustomersHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "invalid id"})
		return
	}

	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"success": false, "error": "invalid request body"})
		return
	}

	_, err = h.DB.Exec(r.Context(),
		`UPDATE customers SET firma_unvani=COALESCE(NULLIF($1::text,''),firma_unvani),
		 yetkili=COALESCE(NULLIF($2::text,''),yetkili), telefon=COALESCE(NULLIF($3::text,''),telefon),
		 bakiye=COALESCE($4::decimal,bakiye), kategori=COALESCE(NULLIF($5::text,''),kategori),
		 risk_skoru=COALESCE(NULLIF($6::text,''),risk_skoru), vade_gun=COALESCE($7::int,vade_gun),
		 notlar=COALESCE(NULLIF($8::text,''),notlar)
		 WHERE id=$9 AND tenant_id=$10`,
		req["firma_unvani"], req["yetkili"], req["telefon"],
		req["bakiye"], req["kategori"], req["risk_skoru"], req["vade_gun"],
		req["notlar"], id, tenantID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"success": false, "error": "failed to update customer"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *CustomersHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.DB.Exec(r.Context(), `UPDATE customers SET durum='PASIF' WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	writeJSON(w, http.StatusOK, map[string]string{"status": "deactivated"})
}

func (h *CustomersHandler) Detail(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var c models.Customer
	h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, firma_unvani, COALESCE(yetkili,''), COALESCE(telefon,''), COALESCE(email,''),
		 COALESCE(adres,''), COALESCE(fatura_adresi,''), COALESCE(vergi_dairesi,''), COALESCE(vergi_no,''),
		 COALESCE(kategori,'GENEL'), COALESCE(bakiye,0), COALESCE(acik_hesap_limiti,0),
		 COALESCE(risk_skoru,'DUSUK'), COALESCE(vade_gun,30),
		 depo_adresleri, fiyat_katalogu, COALESCE(sozlesme_url,''),
		 COALESCE(musteri_temsilcisi,''), COALESCE(notlar,''),
		 COALESCE(durum,'AKTIF'), created_at
		 FROM customers WHERE id=$1 AND tenant_id=$2`, id, tenantID,
	).Scan(&c.ID, &c.TenantID, &c.FirmaUnvani, &c.Yetkili, &c.Telefon, &c.Email,
		&c.Adres, &c.FaturaAdresi, &c.VergiDairesi, &c.VergiNo,
		&c.Kategori, &c.Bakiye, &c.AcikHesapLimiti, &c.RiskSkoru, &c.VadeGun,
		&c.DepoAdresleri, &c.FiyatKatalogu, &c.SozlesmeUrl,
		&c.MusteriTemsilcisi, &c.Notlar, &c.Durum, &c.CreatedAt)

	// Also fetch related data
	type CustomerDetail struct {
		models.Customer
		TotalTrips    int     `json:"toplam_sefer"`
		TotalInvoices int     `json:"toplam_fatura"`
		TotalRevenue  float64 `json:"toplam_ciro"`
		PendingDebt   float64 `json:"bekleyen_tahsilat"`
	}
	detail := CustomerDetail{Customer: c}
	h.DB.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM trips WHERE customer_id=$1 AND tenant_id=$2`, id, tenantID).Scan(&detail.TotalTrips)
	h.DB.QueryRow(r.Context(),
		`SELECT COUNT(*), COALESCE(SUM(genel_toplam),0) FROM invoices WHERE customer_id=$1 AND tenant_id=$2`, id, tenantID).Scan(&detail.TotalInvoices, &detail.TotalRevenue)
	h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(genel_toplam),0) FROM invoices WHERE customer_id=$1 AND tenant_id=$2 AND durum NOT IN ('odendi')`, id, tenantID).Scan(&detail.PendingDebt)

	writeJSON(w, http.StatusOK, detail)
}

func (h *CustomersHandler) ListPayments(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	rows, _ := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, customer_id, tutar, odeme_tarihi, COALESCE(odeme_yontemi,''), COALESCE(aciklama,''), created_at
		 FROM customer_payments WHERE customer_id=$1 AND tenant_id=$2 ORDER BY odeme_tarihi DESC LIMIT 50`,
		id, tenantID)
	defer rows.Close()

	type Payment struct {
		ID           int     `json:"id"`
		TenantID     int     `json:"tenant_id"`
		CustomerID   int     `json:"customer_id"`
		Tutar        float64 `json:"tutar"`
		OdemeTarihi  string  `json:"odeme_tarihi"`
		OdemeYontemi string  `json:"odeme_yontemi"`
		Aciklama     string  `json:"aciklama"`
		CreatedAt    string  `json:"created_at"`
	}
	payments := make([]Payment, 0)
	for rows.Next() {
		var p Payment
		rows.Scan(&p.ID, &p.TenantID, &p.CustomerID, &p.Tutar, &p.OdemeTarihi, &p.OdemeYontemi, &p.Aciklama, &p.CreatedAt)
		payments = append(payments, p)
	}
	writeJSON(w, http.StatusOK, payments)
}

func (h *CustomersHandler) AddPayment(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req struct {
		Tutar        float64 `json:"tutar"`
		OdemeYontemi string  `json:"odeme_yontemi"`
		Aciklama     string  `json:"aciklama"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var paymentID int
	h.DB.QueryRow(r.Context(),
		`INSERT INTO customer_payments (tenant_id, customer_id, tutar, odeme_yontemi, aciklama)
		 VALUES ($1,$2,$3,$4,$5) RETURNING id`,
		tenantID, id, req.Tutar, req.OdemeYontemi, req.Aciklama).Scan(&paymentID)

	// Update customer balance
	h.DB.Exec(r.Context(),
		`UPDATE customers SET bakiye = bakiye - $1 WHERE id=$2 AND tenant_id=$3`,
		req.Tutar, id, tenantID)

	writeJSON(w, http.StatusCreated, map[string]interface{}{"payment_id": paymentID, "status": "recorded"})
}
