package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type TripsHandler struct {
	DB *pgxpool.Pool
}

func (h *TripsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{id}", h.Get)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	r.Put("/{id}/status", h.UpdateStatus)
	r.Post("/{id}/auto-invoice", h.AutoInvoice)
	return r
}

func (h *TripsHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	durum := r.URL.Query().Get("durum")

	query := `SELECT t.id, t.tenant_id, t.truck_id, t.customer_id, t.baslangic_tarih, t.bitis_tarih,
		t.durum, t.ucret, t.payment_method, t.invoice_id, t.sofor, t.yukleme, t.teslimat, t.created_at,
		COALESCE(tr.plaka, '') as truck_plaka,
		COALESCE(c.firma_unvani, '') as customer_name
	 FROM trips t
	 LEFT JOIN trucks tr ON tr.id = t.truck_id
	 LEFT JOIN customers c ON c.id = t.customer_id
	 WHERE t.tenant_id = $1`

	args := []interface{}{tenantID}
	if durum != "" {
		query += " AND t.durum = $2"
		args = append(args, durum)
	}
	query += " ORDER BY t.created_at DESC LIMIT 500"

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to list trips", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to list trips")
		return
	}
	defer rows.Close()

	trips := make([]models.Trip, 0)
	for rows.Next() {
		var t models.Trip
		var createdAt time.Time
		var baslangic *time.Time
		var bitis *time.Time
		if err := rows.Scan(&t.ID, &t.TenantID, &t.TruckID, &t.CustomerID, &baslangic,
			&bitis, &t.Durum, &t.Ucret, &t.PaymentMethod, &t.InvoiceID,
			&t.Sofor, &t.Yukleme, &t.Teslimat, &createdAt,
			&t.TruckPlaka, &t.Musteri); err != nil {
			slog.Error("failed to scan trip", "error", err)
			continue
		}
		if baslangic != nil {
			sBaslangic := baslangic.Format(time.RFC3339)
			t.Baslangic = &sBaslangic
		}
		if bitis != nil {
			sBitis := bitis.Format(time.RFC3339)
			t.Bitis = &sBitis
		}
		t.CreatedAt = createdAt
		trips = append(trips, t)
	}

	writeJSON(w, http.StatusOK, trips)
}

func (h *TripsHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req models.TripCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TruckID == 0 {
		writeError(w, http.StatusBadRequest, "truck_id is required")
		return
	}
	if req.CustomerID == 0 {
		writeError(w, http.StatusBadRequest, "customer_id is required")
		return
	}

	var trip models.Trip
	var baslangic *time.Time
	var bitis *time.Time
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO trips (tenant_id, truck_id, customer_id, sofor, yukleme, teslimat, ucret, payment_method, invoice_id, durum, baslangic)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		 RETURNING id, tenant_id, truck_id, customer_id, sofor, yukleme, teslimat, ucret, payment_method, invoice_id, durum, baslangic_tarih, bitis_tarih, created_at`,
		tenantID, req.TruckID, req.CustomerID, req.Sofor, req.Yukleme, req.Teslimat,
		req.Ucret, req.PaymentMethod, req.InvoiceID, strings.ToUpper(req.Durum), time.Now().UTC(),
	).Scan(&trip.ID, &trip.TenantID, &trip.TruckID, &trip.CustomerID,
		&trip.Sofor, &trip.Yukleme, &trip.Teslimat, &trip.Ucret, &trip.PaymentMethod, &trip.InvoiceID,
		&trip.Durum, &baslangic, &bitis, &trip.CreatedAt)
	if baslangic != nil {
		sBaslangic := baslangic.Format(time.RFC3339)
		trip.Baslangic = &sBaslangic
	}
	if bitis != nil {
		sBitis := bitis.Format(time.RFC3339)
		trip.Bitis = &sBitis
	}
	if err != nil {
		slog.Error("failed to create trip", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to create trip")
		return
	}

	writeJSON(w, http.StatusCreated, trip)
}

func (h *TripsHandler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var trip models.Trip
	var baslangic *time.Time
	var bitis *time.Time
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, truck_id, customer_id, sofor, yukleme, teslimat,
			baslangic_tarih, bitis_tarih, durum, ucret, payment_method, invoice_id, created_at
		 FROM trips WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&trip.ID, &trip.TenantID, &trip.TruckID, &trip.CustomerID,
		&trip.Sofor, &trip.Yukleme, &trip.Teslimat,
		&baslangic, &bitis, &trip.Durum, &trip.Ucret,
		&trip.PaymentMethod, &trip.InvoiceID, &trip.CreatedAt)
	if baslangic != nil {
		sBaslangic := baslangic.Format(time.RFC3339)
		trip.Baslangic = &sBaslangic
	}
	if bitis != nil {
		sBitis := bitis.Format(time.RFC3339)
		trip.Bitis = &sBitis
	}
	if err != nil {
		writeError(w, http.StatusNotFound, "trip not found")
		return
	}

	writeJSON(w, http.StatusOK, trip)
}

func (h *TripsHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req models.TripStatusUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Durum == "" {
		writeError(w, http.StatusBadRequest, "durum is required")
		return
	}

	_, err = h.DB.Exec(r.Context(),
		`UPDATE trips SET durum = $1, bitis = CASE WHEN $1 = 'tamamlandi' THEN NOW() ELSE bitis END
		 WHERE id = $2 AND tenant_id = $3`,
		req.Durum, id, tenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update trip status")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *TripsHandler) AutoInvoice(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	// Get trip details
	var ucret float64
	var customerID int
	var customerName string
	err = h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(t.ucret, 0), t.customer_id, COALESCE(c.firma_unvani, 'Müşteri')
		 FROM trips t LEFT JOIN customers c ON c.id = t.customer_id
		 WHERE t.id = $1 AND t.tenant_id = $2`, id, tenantID,
	).Scan(&ucret, &customerID, &customerName)
	if err != nil {
		writeError(w, http.StatusNotFound, "trip not found")
		return
	}

	// Create invoice with new schema
	faturaNo := fmt.Sprintf("FTR-%d-%d", time.Now().Year(), id)
	kdvTutar := ucret * 0.20
	genelToplam := ucret + kdvTutar
	vade := time.Now().AddDate(0, 0, 30)

	var invoiceID int
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO invoices (tenant_id, customer_id, musteri, fatura_no, ara_toplam, kdv, kdv_oran, genel_toplam, durum, odeme_durumu, tarih, vade)
		 VALUES ($1, $2, $3, $4, $5, $6, 20.00, $7, 'onaylandi', 'bekleyen', NOW(), $8)
		 RETURNING id`,
		tenantID, customerID, customerName, faturaNo, ucret, kdvTutar, genelToplam, vade,
	).Scan(&invoiceID)
	if err != nil {
		slog.Error("failed to create auto invoice", "error", err)
		writeError(w, http.StatusInternalServerError, fmt.Sprintf("failed to create invoice: %v", err))
		return
	}

	// Add line item
	h.DB.Exec(r.Context(),
		`INSERT INTO invoice_items (invoice_id, sira, urun_adi, miktar, birim, birim_fiyat, kdv_oran, kdv_tutar, tutar)
		 VALUES ($1, 1, 'Nakliye Hizmeti', 1, 'ADET', $2, 20.00, $3, $2)`,
		invoiceID, ucret, kdvTutar)

	// Link invoice to trip
	h.DB.Exec(r.Context(),
		`UPDATE trips SET invoice_id = $1 WHERE id = $2 AND tenant_id = $3`,
		invoiceID, id, tenantID)

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"invoice_id":   invoiceID,
		"fatura_no":    faturaNo,
		"tutar":        ucret,
		"genel_toplam": genelToplam,
		"status":       "created",
	})
}

func (h *TripsHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req models.TripCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	_, err = h.DB.Exec(r.Context(),
		`UPDATE trips SET truck_id=$1, customer_id=$2, sofor=$3, yukleme=$4, teslimat=$5, ucret=$6, payment_method=$7
		 WHERE id=$8 AND tenant_id=$9`,
		req.TruckID, req.CustomerID, req.Sofor, req.Yukleme, req.Teslimat, req.Ucret, req.PaymentMethod, id, tenantID)
	if err != nil {
		slog.Error("failed to update trip", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update trip")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

func (h *TripsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	_, err = h.DB.Exec(r.Context(), `DELETE FROM trips WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if err != nil {
		slog.Error("failed to delete trip", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete trip")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
