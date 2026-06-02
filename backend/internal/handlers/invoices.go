package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math"

	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/efatura"
	"unysol/internal/middleware"
	"unysol/internal/models"
)

type InvoicesHandler struct {
	DB *pgxpool.Pool

	// TCMB cache
	kurCache map[string]float64
	kurTarih time.Time
}

func (h *InvoicesHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant(h.DB))

	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/aging", h.AgingReport)
	r.Get("/recurrences", h.ListRecurrences)
	r.Post("/recurrences", h.CreateRecurrence)
	r.Delete("/recurrences/{id}", h.DeleteRecurrence)
	r.Get("/tcbm-rates", h.GetTCMBRates)
	r.Get("/{id}", h.Get)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	r.Put("/{id}/status", h.UpdateStatus)
	r.Post("/{id}/payments", h.AddPayment)
	r.Delete("/{id}/payments/{pid}", h.DeletePayment)
	r.Post("/{id}/e-fatura", h.SendEFatura)
	r.Post("/{id}/e-fatura/check", h.CheckEFatura)
	r.Get("/{id}/pdf", h.GeneratePDF)
	r.Post("/{id}/credit-note", h.CreateCreditNote)

	return r
}

// ============================================================
// LIST with server-side pagination, search, multi-filter
// ============================================================
func (h *InvoicesHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	q := r.URL.Query()

	page, _ := strconv.Atoi(q.Get("page"))
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(q.Get("page_size"))
	if pageSize < 1 || pageSize > 500 {
		pageSize = 50
	}

	where := "WHERE tenant_id = $1"
	args := []interface{}{tenantID}
	argIdx := 2

	if durum := q.Get("durum"); durum != "" {
		where += fmt.Sprintf(" AND durum = $%d", argIdx)
		args = append(args, durum)
		argIdx++
	}
	if odemeDurum := q.Get("odeme_durumu"); odemeDurum != "" {
		where += fmt.Sprintf(" AND odeme_durumu = $%d", argIdx)
		args = append(args, odemeDurum)
		argIdx++
	}
	if tip := q.Get("tip"); tip != "" {
		where += fmt.Sprintf(" AND tip = $%d", argIdx)
		args = append(args, tip)
		argIdx++
	}
	if musteri := q.Get("musteri"); musteri != "" {
		where += fmt.Sprintf(" AND LOWER(musteri) LIKE LOWER($%d)", argIdx)
		args = append(args, "%"+musteri+"%")
		argIdx++
	}
	if faturaNo := q.Get("fatura_no"); faturaNo != "" {
		where += fmt.Sprintf(" AND fatura_no ILIKE $%d", argIdx)
		args = append(args, "%"+faturaNo+"%")
		argIdx++
	}
	if dateFrom := q.Get("tarih_from"); dateFrom != "" {
		where += fmt.Sprintf(" AND tarih >= $%d", argIdx)
		args = append(args, dateFrom)
		argIdx++
	}
	if dateTo := q.Get("tarih_to"); dateTo != "" {
		where += fmt.Sprintf(" AND tarih <= $%d", argIdx)
		args = append(args, dateTo)
		argIdx++
	}

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM invoices %s", where)
	if err := h.DB.QueryRow(r.Context(), countQuery, args...).Scan(&total); err != nil {
		slog.Error("failed to count invoices", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to count invoices")
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(pageSize)))
	if totalPages < 1 {
		totalPages = 1
	}

	offset := (page - 1) * pageSize
	orderCol := "created_at"
	orderDir := "DESC"
	if sort := q.Get("sort"); sort != "" {
		allowedSorts := map[string]bool{"tarih": true, "vade": true, "genel_toplam": true, "fatura_no": true, "created_at": true, "musteri": true}
		if allowedSorts[sort] {
			orderCol = sort
		}
	}
	if dir := q.Get("order"); dir == "asc" {
		orderDir = "ASC"
	}

	dataQuery := fmt.Sprintf(
		`SELECT id, tenant_id, customer_id, trip_id, tip, iade_fatura_id, musteri, fatura_no,
		 tarih, vade, para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		 kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum, odeme_durumu, odeme_yontemi,
		 ebelge_tip, ebelge_durum, ebelge_uuid, ebelge_ettn, ebelge_yanit,
		 odeme_tarihi, notlar, created_at, updated_at
		 FROM invoices %s ORDER BY %s %s LIMIT $%d OFFSET $%d`,
		where, orderCol, orderDir, argIdx, argIdx+1)
	args = append(args, pageSize, offset)

	rows, err := h.DB.Query(r.Context(), dataQuery, args...)
	if err != nil {
		slog.Error("failed to list invoices", "error", err, "tenant_id", tenantID)
		writeError(w, http.StatusInternalServerError, "failed to list invoices")
		return
	}
	defer rows.Close()

	invoices := make([]models.Invoice, 0)
	for rows.Next() {
		var inv models.Invoice
		var tarihOut, vadeOut, odemeTarihiOut, updatedAt *time.Time
		if err := rows.Scan(
			&inv.ID, &inv.TenantID, &inv.CustomerID, &inv.TripID, &inv.Tip, &inv.IadeFaturaID,
			&inv.Musteri, &inv.FaturaNo, &tarihOut, &vadeOut,
			&inv.ParaBirimi, &inv.Kur, &inv.AraToplam, &inv.IskontoTutar, &inv.IskontoOran,
			&inv.Kdv, &inv.KdvOran, &inv.Tevkifat, &inv.GenelToplam, &inv.ToplamOdenen, &inv.Kalan,
			&inv.Durum, &inv.OdemeDurumu, &inv.OdemeYontemi,
			&inv.EbelgeTip, &inv.EbelgeDurum, &inv.EbelgeUUID, &inv.EbelgeEttn, &inv.EbelgeYanit,
			&odemeTarihiOut, &inv.Notlar, &inv.CreatedAt, &updatedAt,
		); err != nil {
			slog.Error("failed to scan invoice", "error", err)
			continue
		}
		setTimeStr(&inv.Tarih, tarihOut)
		setTimeStr(&inv.Vade, vadeOut)
		setTimeStrFull(&inv.OdemeTarihi, odemeTarihiOut)
		setTimeStrFull(&inv.UpdatedAt, updatedAt)
		invoices = append(invoices, inv)
	}

	writeJSON(w, http.StatusOK, models.PaginatedInvoices{
		Data:       invoices,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	})
}

// ============================================================
// CREATE invoice with line items
// ============================================================
func (h *InvoicesHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req models.InvoiceCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CustomerID == 0 {
		writeError(w, http.StatusBadRequest, "customer_id is required")
		return
	}
	if len(req.Items) == 0 {
		writeError(w, http.StatusBadRequest, "at least one invoice item is required")
		return
	}

	tip := "SATIS"
	if req.Tip != "" {
		tip = req.Tip
	}

	paraBirimi := "TRY"
	if req.ParaBirimi != "" {
		paraBirimi = req.ParaBirimi
	}

	kur := 1.0
	if req.Kur > 0 {
		kur = req.Kur
	} else if paraBirimi != "TRY" {
		kur = h.getCachedKur(paraBirimi)
	}

	vade, err := time.Parse("2006-01-02", req.Vade)
	if err != nil {
		vade = time.Now().AddDate(0, 0, 30)
	}
	tarih := time.Now()
	if req.Tarih != "" {
		if parsed, err := time.Parse("2006-01-02", req.Tarih); err == nil {
			tarih = parsed
		}
	}

	faturaNo, err := h.generateFaturaNo(r.Context(), tenantID)
	if err != nil {
		slog.Error("failed to generate fatura_no", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to generate fatura_no")
		return
	}

	// Calculate from items
	araToplam := 0.0
	toplamKdv := 0.0
	for i, item := range req.Items {
		miktar := item.Miktar
		if miktar <= 0 {
			miktar = 1
		}
		birimFiyat := item.BirimFiyat
		kdvOran := item.KdvOran
		if kdvOran <= 0 {
			kdvOran = 20.0
		}
		iskontoOran := item.IskontoOran
		iskontoTutar := item.IskontoTutar

		tutar := miktar * birimFiyat
		sonTutar := tutar
		if iskontoOran > 0 {
			iskontoTutar = tutar * iskontoOran / 100
		}
		sonTutar -= iskontoTutar
		kdvTutar := sonTutar * kdvOran / 100

		araToplam += sonTutar
		toplamKdv += kdvTutar

		req.Items[i].IskontoTutar = iskontoTutar
	}

	iskontoTutar := req.IskontoTutar
	if req.IskontoOran > 0 {
		iskontoTutar = araToplam * req.IskontoOran / 100
	}
	araToplam -= iskontoTutar
	genelToplam := araToplam + toplamKdv - req.Tevkifat

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to begin transaction")
		return
	}
	defer tx.Rollback(r.Context())

	var invoice models.Invoice
	var tripID *int
	if req.TripID != nil && *req.TripID > 0 {
		tripID = req.TripID
	}
	var customerID *int
	if req.CustomerID > 0 {
		customerID = &req.CustomerID
	}

	var tarihOut, vadeOut, odemeTarihiOut *time.Time
	var updatedAt time.Time

	err = tx.QueryRow(r.Context(),
		`INSERT INTO invoices (tenant_id, customer_id, trip_id, tip, musteri, fatura_no, tarih, vade,
		 para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		 kdv, kdv_oran, tevkifat, genel_toplam, durum, notlar)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'taslak',$18)
		 RETURNING id, tenant_id, customer_id, trip_id, tip, musteri, fatura_no, tarih, vade,
		 para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		 kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum, odeme_durumu,
		 ebelge_tip, ebelge_durum, odeme_tarihi, notlar, created_at, updated_at`,
		tenantID, customerID, tripID, tip, req.Musteri, faturaNo, tarih, vade,
		paraBirimi, kur, araToplam, iskontoTutar, req.IskontoOran,
		toplamKdv, req.Items[0].KdvOran, req.Tevkifat, genelToplam, req.Notlar,
	).Scan(
		&invoice.ID, &invoice.TenantID, &invoice.CustomerID, &invoice.TripID, &invoice.Tip,
		&invoice.Musteri, &invoice.FaturaNo, &tarihOut, &vadeOut,
		&invoice.ParaBirimi, &invoice.Kur, &invoice.AraToplam, &invoice.IskontoTutar, &invoice.IskontoOran,
		&invoice.Kdv, &invoice.KdvOran, &invoice.Tevkifat, &invoice.GenelToplam,
		&invoice.ToplamOdenen, &invoice.Kalan, &invoice.Durum, &invoice.OdemeDurumu,
		&invoice.EbelgeTip, &invoice.EbelgeDurum, &odemeTarihiOut, &invoice.Notlar,
		&invoice.CreatedAt, &updatedAt,
	)

	// Convert date/time pointers to strings
	setTimeStr(&invoice.Tarih, tarihOut)
	setTimeStr(&invoice.Vade, vadeOut)
	setTimeStr(&invoice.OdemeTarihi, odemeTarihiOut)
	setTimeStr(&invoice.UpdatedAt, &updatedAt)
	if err != nil {
		slog.Error("failed to create invoice", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create invoice")
		return
	}

	// Insert line items
	items := make([]models.InvoiceItem, 0, len(req.Items))
	for _, item := range req.Items {
		miktar := item.Miktar
		if miktar <= 0 {
			miktar = 1
		}
		birimFiyat := item.BirimFiyat
		kdvOran := item.KdvOran
		if kdvOran <= 0 {
			kdvOran = 20.0
		}
		tutar := miktar * birimFiyat
		sonTutar := tutar - item.IskontoTutar
		kdvTutar := sonTutar * kdvOran / 100

		var dbItem models.InvoiceItem
		err := tx.QueryRow(r.Context(),
			`INSERT INTO invoice_items (invoice_id, sira, urun_adi, aciklama, miktar, birim,
			 birim_fiyat, kdv_oran, kdv_tutar, iskonto_oran, iskonto_tutar, tutar)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
			 RETURNING id, invoice_id, sira, urun_adi, aciklama, miktar, birim,
			 birim_fiyat, kdv_oran, kdv_tutar, iskonto_oran, iskonto_tutar, tutar, created_at`,
			invoice.ID, item.Sira, item.UrunAdi, item.Aciklama, miktar, item.Birim,
			birimFiyat, kdvOran, kdvTutar, item.IskontoOran, item.IskontoTutar, sonTutar,
		).Scan(
			&dbItem.ID, &dbItem.InvoiceID, &dbItem.Sira, &dbItem.UrunAdi, &dbItem.Aciklama,
			&dbItem.Miktar, &dbItem.Birim, &dbItem.BirimFiyat, &dbItem.KdvOran, &dbItem.KdvTutar,
			&dbItem.IskontoOran, &dbItem.IskontoTutar, &dbItem.Tutar, &dbItem.CreatedAt,
		)
		if err != nil {
			slog.Error("failed to create invoice item", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to create invoice item")
			return
		}
		items = append(items, dbItem)
	}

	if err := tx.Commit(r.Context()); err != nil {
		slog.Error("failed to commit invoice transaction", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create invoice")
		return
	}

	invoice.Items = items
	invoice.Payments = []models.InvoicePayment{}

	writeJSON(w, http.StatusCreated, invoice)
}

// ============================================================
// GET invoice with items and payments
// ============================================================
func (h *InvoicesHandler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var invoice models.Invoice
	var tarihOut, vadeOut, odemeTarihiOut, updatedAt *time.Time
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, customer_id, trip_id, tip, iade_fatura_id, musteri, fatura_no,
		 tarih, vade, para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		 kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum, odeme_durumu, odeme_yontemi,
		 ebelge_tip, ebelge_durum, ebelge_uuid, ebelge_ettn, ebelge_yanit,
		 odeme_tarihi, notlar, created_at, updated_at
		 FROM invoices WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(
		&invoice.ID, &invoice.TenantID, &invoice.CustomerID, &invoice.TripID, &invoice.Tip, &invoice.IadeFaturaID,
		&invoice.Musteri, &invoice.FaturaNo, &tarihOut, &vadeOut,
		&invoice.ParaBirimi, &invoice.Kur, &invoice.AraToplam, &invoice.IskontoTutar, &invoice.IskontoOran,
		&invoice.Kdv, &invoice.KdvOran, &invoice.Tevkifat, &invoice.GenelToplam, &invoice.ToplamOdenen, &invoice.Kalan,
		&invoice.Durum, &invoice.OdemeDurumu, &invoice.OdemeYontemi,
		&invoice.EbelgeTip, &invoice.EbelgeDurum, &invoice.EbelgeUUID, &invoice.EbelgeEttn, &invoice.EbelgeYanit,
		&odemeTarihiOut, &invoice.Notlar, &invoice.CreatedAt, &updatedAt,
	)
	setTimeStr(&invoice.Tarih, tarihOut)
	setTimeStr(&invoice.Vade, vadeOut)
	setTimeStrFull(&invoice.OdemeTarihi, odemeTarihiOut)
	setTimeStrFull(&invoice.UpdatedAt, updatedAt)
	if err != nil {
		slog.Error("failed to get invoice", "error", err)
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	// Lookup customer name
	if invoice.CustomerID != nil {
		var cName string
		h.DB.QueryRow(r.Context(),
			`SELECT firma_unvani FROM customers WHERE id = $1 AND tenant_id = $2`,
			*invoice.CustomerID, tenantID,
		).Scan(&cName)
		if cName != "" {
			invoice.Musteri = &cName
		}
	}

	// Load items
	items := make([]models.InvoiceItem, 0)
	itemRows, _ := h.DB.Query(r.Context(),
		`SELECT id, invoice_id, sira, urun_adi, aciklama, miktar, birim,
		 birim_fiyat, kdv_oran, kdv_tutar, iskonto_oran, iskonto_tutar, tutar, created_at
		 FROM invoice_items WHERE invoice_id = $1 ORDER BY sira`, id,
	)
	if itemRows != nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var it models.InvoiceItem
			if err := itemRows.Scan(&it.ID, &it.InvoiceID, &it.Sira, &it.UrunAdi, &it.Aciklama,
				&it.Miktar, &it.Birim, &it.BirimFiyat, &it.KdvOran, &it.KdvTutar,
				&it.IskontoOran, &it.IskontoTutar, &it.Tutar, &it.CreatedAt); err != nil {
				continue
			}
			items = append(items, it)
		}
	}
	invoice.Items = items

	// Load payments
	payments := make([]models.InvoicePayment, 0)
	payRows, _ := h.DB.Query(r.Context(),
		`SELECT id, invoice_id, tutar, yontem, referans_no, tarih, aciklama, created_at
		 FROM invoice_payments WHERE invoice_id = $1 ORDER BY tarih DESC`, id,
	)
	if payRows != nil {
		defer payRows.Close()
		for payRows.Next() {
			var p models.InvoicePayment
			var pTarihOut time.Time
			if err := payRows.Scan(&p.ID, &p.InvoiceID, &p.Tutar, &p.Yontem,
				&p.ReferansNo, &pTarihOut, &p.Aciklama, &p.CreatedAt); err != nil {
				continue
			}
			setTimeStrFull(&p.Tarih, &pTarihOut)
			payments = append(payments, p)
		}
	}
	invoice.Payments = payments

	writeJSON(w, http.StatusOK, invoice)
}

// ============================================================
// UPDATE invoice
// ============================================================
func (h *InvoicesHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req models.InvoiceUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.CustomerID != nil {
		setClauses = append(setClauses, fmt.Sprintf("customer_id = $%d", argIdx))
		args = append(args, *req.CustomerID)
		argIdx++
	}
	if req.Musteri != nil {
		setClauses = append(setClauses, fmt.Sprintf("musteri = $%d", argIdx))
		args = append(args, *req.Musteri)
		argIdx++
	}
	if req.Tarih != nil {
		setClauses = append(setClauses, fmt.Sprintf("tarih = $%d", argIdx))
		args = append(args, *req.Tarih)
		argIdx++
	}
	if req.Vade != nil {
		setClauses = append(setClauses, fmt.Sprintf("vade = $%d", argIdx))
		args = append(args, *req.Vade)
		argIdx++
	}
	if req.ParaBirimi != nil {
		setClauses = append(setClauses, fmt.Sprintf("para_birimi = $%d", argIdx))
		args = append(args, *req.ParaBirimi)
		argIdx++
	}
	if req.Kur != nil {
		setClauses = append(setClauses, fmt.Sprintf("kur = $%d", argIdx))
		args = append(args, *req.Kur)
		argIdx++
	}
	if req.IskontoOran != nil {
		setClauses = append(setClauses, fmt.Sprintf("iskonto_oran = $%d", argIdx))
		args = append(args, *req.IskontoOran)
		argIdx++
	}
	if req.IskontoTutar != nil {
		setClauses = append(setClauses, fmt.Sprintf("iskonto_tutar = $%d", argIdx))
		args = append(args, *req.IskontoTutar)
		argIdx++
	}
	if req.Tevkifat != nil {
		setClauses = append(setClauses, fmt.Sprintf("tevkifat = $%d", argIdx))
		args = append(args, *req.Tevkifat)
		argIdx++
	}
	if req.Notlar != nil {
		setClauses = append(setClauses, fmt.Sprintf("notlar = $%d", argIdx))
		args = append(args, *req.Notlar)
		argIdx++
	}
	if req.Durum != nil {
		setClauses = append(setClauses, fmt.Sprintf("durum = $%d", argIdx))
		args = append(args, *req.Durum)
		argIdx++
	}

	// Recalculate from items if provided
	if len(req.Items) > 0 {
		araToplam := 0.0
		toplamKdv := 0.0
		kdvOran := 20.0
		for i, item := range req.Items {
			miktar := item.Miktar
			if miktar <= 0 {
				miktar = 1
			}
			birimFiyat := item.BirimFiyat
			if item.KdvOran > 0 {
				kdvOran = item.KdvOran
			}
			iskontoTutar := item.IskontoTutar
			if item.IskontoOran > 0 {
				iskontoTutar = miktar * birimFiyat * item.IskontoOran / 100
			}
			tutar := miktar*birimFiyat - iskontoTutar
			kdvTutar := tutar * kdvOran / 100
			araToplam += tutar
			toplamKdv += kdvTutar
			req.Items[i].IskontoTutar = iskontoTutar
		}

		genelToplam := araToplam + toplamKdv
		tevkifat := 0.0
		if req.Tevkifat != nil {
			tevkifat = *req.Tevkifat
		}
		genelToplam -= tevkifat

		setClauses = append(setClauses,
			fmt.Sprintf("ara_toplam = $%d", argIdx),
			fmt.Sprintf("kdv = $%d", argIdx+1),
			fmt.Sprintf("kdv_oran = $%d", argIdx+2),
			fmt.Sprintf("genel_toplam = $%d", argIdx+3),
		)
		args = append(args, araToplam, toplamKdv, kdvOran, genelToplam)
		argIdx += 4

		// Delete old items and re-insert
		if _, err := h.DB.Exec(r.Context(),
			`DELETE FROM invoice_items WHERE invoice_id = $1`, id); err != nil {
			slog.Error("failed to delete old items", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to update items")
			return
		}
		for _, item := range req.Items {
			miktar := item.Miktar
			if miktar <= 0 {
				miktar = 1
			}
			sonTutar := miktar*item.BirimFiyat - item.IskontoTutar
			kdvTutar := sonTutar * kdvOran / 100
			_, err := h.DB.Exec(r.Context(),
				`INSERT INTO invoice_items (invoice_id, sira, urun_adi, aciklama, miktar, birim,
				 birim_fiyat, kdv_oran, kdv_tutar, iskonto_oran, iskonto_tutar, tutar)
				 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
				id, item.Sira, item.UrunAdi, item.Aciklama, miktar, item.Birim,
				item.BirimFiyat, kdvOran, kdvTutar, item.IskontoOran, item.IskontoTutar, sonTutar)
			if err != nil {
				slog.Error("failed to insert item", "error", err)
			}
		}
	}

	setClauses = append(setClauses, fmt.Sprintf("updated_at = NOW()"))
	query := fmt.Sprintf("UPDATE invoices SET %s WHERE id = $%d AND tenant_id = $%d",
		strings.Join(setClauses, ", "), argIdx, argIdx+1)
	args = append(args, id, tenantID)

	tag, err := h.DB.Exec(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to update invoice", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update invoice")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	// Return updated
	h.Get(w, r)
}

// ============================================================
// DELETE invoice
// ============================================================
func (h *InvoicesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`DELETE FROM invoices WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if err != nil {
		slog.Error("failed to delete invoice", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete invoice")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Success: true, Message: "invoice deleted"})
}

// ============================================================
// UPDATE STATUS (approval workflow)
// ============================================================
func (h *InvoicesHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req struct {
		Durum         string `json:"durum"`
		OdemeDurumu   string `json:"odeme_durumu"`
		OdemeYontemi  string `json:"odeme_yontemi"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	validDurum := map[string]bool{"taslak": true, "onayda": true, "onaylandi": true, "gonderildi": true, "odendi": true, "iptal": true}
	validOdemeDurum := map[string]bool{"bekleyen": true, "kismi_odendi": true, "odendi": true, "gecikti": true, "vadesi_gecti": true, "iptal": true}

	setClauses := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Durum != "" {
		if !validDurum[req.Durum] {
			writeError(w, http.StatusBadRequest, "invalid durum")
			return
		}
		setClauses = append(setClauses, fmt.Sprintf("durum = $%d", argIdx))
		args = append(args, req.Durum)
		argIdx++

		if req.Durum == "odendi" {
			setClauses = append(setClauses, fmt.Sprintf("odeme_durumu = $%d", argIdx))
			args = append(args, "odendi")
			argIdx++
			setClauses = append(setClauses, fmt.Sprintf("odeme_tarihi = $%d", argIdx))
			args = append(args, time.Now())
			argIdx++

			// Mark full payment
			var genelToplam float64
			var toplamOdenen float64
			h.DB.QueryRow(r.Context(),
				`SELECT COALESCE(genel_toplam,0), COALESCE(toplam_odenen,0) FROM invoices WHERE id = $1`, id,
			).Scan(&genelToplam, &toplamOdenen)
			kalan := genelToplam - toplamOdenen
			if kalan > 0 {
				h.DB.Exec(r.Context(),
					`INSERT INTO invoice_payments (invoice_id, tutar, yontem, referans_no, tarih, aciklama)
					 VALUES ($1, $2, $3, 'AUTO-FULL', NOW(), 'Otomatik tam tahsilat')`,
					id, kalan, "havale")
				setClauses = append(setClauses,
					fmt.Sprintf("toplam_odenen = $%d", argIdx),
				)
				args = append(args, genelToplam)
				argIdx++
			}
		}
	}

	if req.OdemeDurumu != "" {
		if !validOdemeDurum[req.OdemeDurumu] {
			writeError(w, http.StatusBadRequest, "invalid odeme_durumu")
			return
		}
		setClauses = append(setClauses, fmt.Sprintf("odeme_durumu = $%d", argIdx))
		args = append(args, req.OdemeDurumu)
		argIdx++
	}

	if req.OdemeYontemi != "" {
		setClauses = append(setClauses, fmt.Sprintf("odeme_yontemi = $%d", argIdx))
		args = append(args, req.OdemeYontemi)
		argIdx++
	}

	query := fmt.Sprintf("UPDATE invoices SET %s WHERE id = $%d AND tenant_id = $%d",
		strings.Join(setClauses, ", "), argIdx, argIdx+1)
	args = append(args, id, tenantID)

	tag, err := h.DB.Exec(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to update invoice status", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update status")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "updated"})
}

// ============================================================
// ADD PAYMENT (partial payment support)
// ============================================================
func (h *InvoicesHandler) AddPayment(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req models.PaymentCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.Tutar <= 0 {
		writeError(w, http.StatusBadRequest, "tutar must be positive")
		return
	}
	if req.Yontem == "" {
		req.Yontem = "havale"
	}

	tarih := time.Now()
	if req.Tarih != "" {
		if parsed, err := time.Parse(time.RFC3339, req.Tarih); err == nil {
			tarih = parsed
		} else if parsed, err := time.Parse("2006-01-02", req.Tarih); err == nil {
			tarih = parsed
		}
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to begin transaction")
		return
	}
	defer tx.Rollback(r.Context())

	var payment models.InvoicePayment
	var payTarihOut time.Time
	err = tx.QueryRow(r.Context(),
		`INSERT INTO invoice_payments (invoice_id, tutar, yontem, referans_no, tarih, aciklama)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 RETURNING id, invoice_id, tutar, yontem, referans_no, tarih, aciklama, created_at`,
		id, req.Tutar, req.Yontem, req.ReferansNo, tarih, req.Aciklama,
	).Scan(&payment.ID, &payment.InvoiceID, &payment.Tutar, &payment.Yontem,
		&payment.ReferansNo, &payTarihOut, &payment.Aciklama, &payment.CreatedAt)
	setTimeStrFull(&payment.Tarih, &payTarihOut)
	if err != nil {
		slog.Error("failed to insert payment", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to add payment")
		return
	}

	// Update toplam_odenen and odeme_durumu
	_, err = tx.Exec(r.Context(),
		`UPDATE invoices SET
		 toplam_odenen = COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0),
		 odeme_durumu = CASE
		   WHEN COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0) >= genel_toplam THEN 'odendi'::invoice_odeme_durum_enum
		   WHEN COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0) > 0 THEN 'kismi_odendi'::invoice_odeme_durum_enum
		   ELSE 'bekleyen'::invoice_odeme_durum_enum
		 END,
		 odeme_yontemi = COALESCE(odeme_yontemi, $2),
		 odeme_tarihi = CASE
		   WHEN COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0) >= genel_toplam THEN NOW()
		   ELSE odeme_tarihi
		 END,
		 durum = CASE
		   WHEN COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0) >= genel_toplam AND durum != 'iptal' THEN 'odendi'
		   ELSE durum
		 END,
		 updated_at = NOW()
		 WHERE id = $1 AND tenant_id = $3`,
		id, req.Yontem, tenantID)
	if err != nil {
		slog.Error("failed to update invoice after payment", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update invoice")
		return
	}

	if err := tx.Commit(r.Context()); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to commit payment")
		return
	}

	writeJSON(w, http.StatusCreated, payment)
}

// ============================================================
// DELETE PAYMENT
// ============================================================
func (h *InvoicesHandler) DeletePayment(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	invoiceID, _ := strconv.Atoi(chi.URLParam(r, "id"))
	paymentID, _ := strconv.Atoi(chi.URLParam(r, "pid"))

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to begin transaction")
		return
	}
	defer tx.Rollback(r.Context())

	tag, err := tx.Exec(r.Context(),
		`DELETE FROM invoice_payments WHERE id = $1 AND invoice_id = $2`, paymentID, invoiceID)
	if err != nil || tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "payment not found")
		return
	}

	_, err = tx.Exec(r.Context(),
		`UPDATE invoices SET
		 toplam_odenen = COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0),
		 odeme_durumu = CASE
		   WHEN COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0) >= genel_toplam THEN 'odendi'::invoice_odeme_durum_enum
		   WHEN COALESCE((SELECT SUM(tutar) FROM invoice_payments WHERE invoice_id = $1), 0) > 0 THEN 'kismi_odendi'::invoice_odeme_durum_enum
		   ELSE 'bekleyen'::invoice_odeme_durum_enum
		 END,
		 updated_at = NOW()
		 WHERE id = $1 AND tenant_id = $2`, invoiceID, tenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update invoice")
		return
	}

	tx.Commit(r.Context())
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ============================================================
// E-FATURA / E-ARSIV simulate with GIB entegrator
// ============================================================
func (h *InvoicesHandler) SendEFatura(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req models.EFaturaGonderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.EbelgeTip == "" {
		req.EbelgeTip = "E_ARSIV"
	}

	// Get invoice with full details including items
	var invoice models.Invoice
	var tarihOut, vadeOut *time.Time
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, customer_id, fatura_no, musteri, genel_toplam, kdv, kdv_oran, 
		 ara_toplam, tevkifat, durum, tarih, vade, para_birimi, kur, odeme_yontemi, notlar
		 FROM invoices WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&invoice.ID, &invoice.TenantID, &invoice.CustomerID, &invoice.FaturaNo, &invoice.Musteri,
		&invoice.GenelToplam, &invoice.Kdv, &invoice.KdvOran, &invoice.AraToplam, &invoice.Tevkifat,
		&invoice.Durum, &tarihOut, &vadeOut, &invoice.ParaBirimi, &invoice.Kur, &invoice.OdemeYontemi, &invoice.Notlar)
	if err != nil {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}
	setTimeStr(&invoice.Tarih, tarihOut)
	setTimeStr(&invoice.Vade, vadeOut)

	// Get invoice items
	rows, err := h.DB.Query(r.Context(),
		`SELECT sira, urun_adi, aciklama, miktar, birim, birim_fiyat, kdv_oran, kdv_tutar, tutar, iskonto_oran, iskonto_tutar
		 FROM invoice_items WHERE invoice_id = $1 ORDER BY sira`, id)
	items := []efatura.InvoiceLine{}
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var item efatura.InvoiceLine
			rows.Scan(&item.Sira, &item.UrunAdi, &item.Aciklama, &item.Miktar, &item.Birim,
				&item.BirimFiyat, &item.KdvOran, &item.KdvTutar, &item.Tutar, &item.IskontoOran, &item.IskontoTutar)
			items = append(items, item)
		}
	}

	// Get customer VKN
	var customerVKN, customerUnvan, customerAdres string
	h.DB.QueryRow(r.Context(), `SELECT COALESCE(vergi_no,''), firma_unvani, COALESCE(adres,'') FROM customers WHERE id=$1`, invoice.CustomerID).Scan(&customerVKN, &customerUnvan, &customerAdres)

	// Generate UBL-TR XML
	ettn := fmt.Sprintf("ETTN-%s-%s", time.Now().Format("20060102150405"), invoice.FaturaNo)
	ebelgeUUID := uuid.New().String()

	ublData := efatura.InvoiceData{
		UUID:            ebelgeUUID,
		FaturaNo:        invoice.FaturaNo,
		FaturaTarihi:    derefStr(invoice.Tarih),
		VadeTarihi:      derefStr(invoice.Vade),
		ParaBirimi:      derefStr(invoice.ParaBirimi),
		Kur:             derefFloat(invoice.Kur),
		AraToplam:       derefFloat(invoice.AraToplam),
		Kdv:             derefFloat(invoice.Kdv),
		KdvOran:         derefFloat(invoice.KdvOran),
		Tevkifat:        derefFloat(invoice.Tevkifat),
		GenelToplam:     derefFloat(invoice.GenelToplam),
		OdemeYontemi:    derefStr(invoice.OdemeYontemi),
		Notlar:          derefStr(invoice.Notlar),
		SupplierVKN:     "1234567890",
		SupplierUnvan:   "Unysol Platform Kullanıcısı",
		SupplierAdres:   "Türkiye",
		CustomerVKN:     customerVKN,
		CustomerUnvan:   customerUnvan,
		CustomerAdres:   customerAdres,
		Senaryo:         "TEMELFATURA",
		FaturaTipi:      "SATIS",
		EbelgeTip:       req.EbelgeTip,
		ProfileID:       "TEMELFATURA",
		DocumentCurrency: derefStr(invoice.ParaBirimi),
		Items:           items,
	}
	if ublData.DocumentCurrency == "" {
		ublData.DocumentCurrency = "TRY"
	}

	ublXML, xmlErr := efatura.GenerateUBLTR(ublData)
	xmlBase64 := ""
	if xmlErr == nil {
		xmlBase64 = base64.StdEncoding.EncodeToString(ublXML)
	}

	// Log istek with XML
	istek := map[string]interface{}{
		"fatura_no":    invoice.FaturaNo,
		"tip":          req.EbelgeTip,
		"musteri":      invoice.Musteri,
		"genel_toplam": invoice.GenelToplam,
		"tarih":        invoice.Tarih,
		"ubl_xml_size": len(ublXML),
		"items_count":  len(items),
	}
	istekJSON, _ := json.Marshal(istek)

	yanit := map[string]interface{}{
		"ettn":      ettn,
		"uuid":      ebelgeUUID,
		"durum":     "KABUL",
		"mesaj":     "Fatura GİB sistemine başarıyla iletildi",
		"zarf_id":   "ZRF-" + time.Now().Format("20060102150405"),
		"ubl_base64": xmlBase64,
	}
	yanitJSON, _ := json.Marshal(yanit)

	// Update invoice
	h.DB.Exec(r.Context(),
		`UPDATE invoices SET
		 ebelge_tip = $1, ebelge_durum = 'GONDERILDI', ebelge_uuid = $2, ebelge_ettn = $3,
		 ebelge_yanit = $4, durum = 'gonderildi', updated_at = NOW()
		 WHERE id = $5 AND tenant_id = $6`,
		req.EbelgeTip, ebelgeUUID, ettn, yanitJSON, id, tenantID)

	// Log
	h.DB.Exec(r.Context(),
		`INSERT INTO e_fatura_logs (invoice_id, islem, durum, istek, yanit)
		 VALUES ($1, 'GONDER', 'BASARILI', $2, $3)`,
		id, istekJSON, yanitJSON)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "GONDERILDI",
		"ettn":      ettn,
		"uuid":      ebelgeUUID,
		"ebelge_tip": req.EbelgeTip,
	})
}

// ============================================================
// CHECK E-FATURA STATUS
// ============================================================
func (h *InvoicesHandler) CheckEFatura(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var ebelgeTip, ebelgeDurum, ebelgeEttn *string
	h.DB.QueryRow(r.Context(),
		`SELECT ebelge_tip, ebelge_durum, ebelge_ettn FROM invoices WHERE id = $1 AND tenant_id = $2`,
		id, tenantID,
	).Scan(&ebelgeTip, &ebelgeDurum, &ebelgeEttn)

	// Simulate status check
	var durumStr string
	if ebelgeDurum != nil {
		durumStr = *ebelgeDurum
	}
	if durumStr == "GONDERILDI" || durumStr == "BEKLIYOR" {
		// After some delay, transition to ONAYLANDI (simulate GIB response)
		h.DB.Exec(r.Context(),
			`UPDATE invoices SET ebelge_durum = 'ONAYLANDI', updated_at = NOW()
			 WHERE id = $1 AND tenant_id = $2 AND ebelge_durum = 'GONDERILDI'`,
			id, tenantID)
		durumStr = "ONAYLANDI"
	}

	// Log
	h.DB.Exec(r.Context(),
		`INSERT INTO e_fatura_logs (invoice_id, islem, durum)
		 VALUES ($1, 'SORGULA', $2)`, id, durumStr)

	writeJSON(w, http.StatusOK, map[string]string{
		"belge_tip":   derefStr(ebelgeTip),
		"durum":       durumStr,
		"ettn":        derefStr(ebelgeEttn),
	})
}

// ============================================================
// CREDIT NOTE (iade faturası)
// ============================================================
func (h *InvoicesHandler) CreateCreditNote(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	originalID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	// Get original invoice
	var original models.Invoice
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, customer_id, musteri, fatura_no, para_birimi, kur, ara_toplam,
		 kdv, kdv_oran, tevkifat, genel_toplam, notlar
		 FROM invoices WHERE id = $1 AND tenant_id = $2 AND tip = 'SATIS'`,
		originalID, tenantID,
	).Scan(&original.ID, &original.CustomerID, &original.Musteri, &original.FaturaNo,
		&original.ParaBirimi, &original.Kur, &original.AraToplam, &original.Kdv,
		&original.KdvOran, &original.Tevkifat, &original.GenelToplam, &original.Notlar)
	if err != nil {
		writeError(w, http.StatusNotFound, "original invoice not found or not a SATIS invoice")
		return
	}

	// Get items
	items := make([]models.InvoiceItemCreate, 0)
	itemRows, _ := h.DB.Query(r.Context(),
		`SELECT sira, urun_adi, aciklama, miktar, birim, birim_fiyat, kdv_oran
		 FROM invoice_items WHERE invoice_id = $1 ORDER BY sira`, originalID)
	if itemRows != nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var it models.InvoiceItemCreate
			itemRows.Scan(&it.Sira, &it.UrunAdi, &it.Aciklama, &it.Miktar, &it.Birim, &it.BirimFiyat, &it.KdvOran)
			it.IskontoTutar = 0
			items = append(items, it)
		}
	}

	faturaNo, _ := h.generateFaturaNo(r.Context(), tenantID)
	negAraToplam := 0.0
	if original.AraToplam != nil {
		negAraToplam = -*original.AraToplam
	}
	negGenelToplam := 0.0
	if original.GenelToplam != nil {
		negGenelToplam = -*original.GenelToplam
	}

	var creditInvoice models.Invoice
	var cID *int
	if original.CustomerID != nil {
		cID = original.CustomerID
	}

	var cTarihOut, cVadeOut *time.Time
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO invoices (tenant_id, customer_id, tip, iade_fatura_id, musteri, fatura_no,
		 tarih, vade, para_birimi, kur, ara_toplam, kdv, kdv_oran, tevkifat, genel_toplam, durum, notlar)
		 VALUES ($1,$2,'IADE',$3,$4,$5,CURRENT_DATE,CURRENT_DATE,$6,$7,$8,$9,$10,$11,$12,'taslak',$13)
		 RETURNING id, tenant_id, customer_id, tip, iade_fatura_id, musteri, fatura_no, tarih, vade,
		 para_birimi, kur, ara_toplam, kdv, kdv_oran, genel_toplam, durum, created_at`,
		tenantID, cID, originalID, derefStr(original.Musteri), faturaNo,
		derefStr(original.ParaBirimi), derefFloat(original.Kur),
		negAraToplam, derefFloat(original.Kdv), derefFloat(original.KdvOran), derefFloat(original.Tevkifat),
		negGenelToplam, derefStr(original.Notlar),
	).Scan(&creditInvoice.ID, &creditInvoice.TenantID, &creditInvoice.CustomerID, &creditInvoice.Tip,
		&creditInvoice.IadeFaturaID, &creditInvoice.Musteri, &creditInvoice.FaturaNo,
		&cTarihOut, &cVadeOut, &creditInvoice.ParaBirimi, &creditInvoice.Kur,
		&creditInvoice.AraToplam, &creditInvoice.Kdv, &creditInvoice.KdvOran,
		&creditInvoice.GenelToplam, &creditInvoice.Durum, &creditInvoice.CreatedAt)
	setTimeStr(&creditInvoice.Tarih, cTarihOut)
	setTimeStr(&creditInvoice.Vade, cVadeOut)
	if err != nil {
		slog.Error("failed to create credit note", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create credit note")
		return
	}

	for _, item := range items {
		h.DB.Exec(r.Context(),
			`INSERT INTO invoice_items (invoice_id, sira, urun_adi, aciklama, miktar, birim,
			 birim_fiyat, kdv_oran, kdv_tutar, tutar)
			 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9)`,
			creditInvoice.ID, item.Sira, item.UrunAdi, item.Aciklama, item.Miktar, item.Birim,
			item.BirimFiyat, item.KdvOran, 0)
	}

	writeJSON(w, http.StatusCreated, creditInvoice)
}

// ============================================================
// GENERATE PDF invoice
// ============================================================
func (h *InvoicesHandler) GeneratePDF(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req models.PDFGenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		req.Template = "default"
		req.IncludeLogo = true
		req.Orientation = "portrait"
	}

	// Get invoice with items
	invoice, items, payments := h.fetchInvoiceFull(r.Context(), tenantID, id)
	if invoice == nil {
		writeError(w, http.StatusNotFound, "invoice not found")
		return
	}

	// Build HTML for PDF
	html := h.buildInvoiceHTML(invoice, items, payments, req)

	pdf := generatePDFFromHTML(html, req.Orientation)

	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s.pdf"`, invoice.FaturaNo))
	w.Header().Set("Content-Length", strconv.Itoa(len(pdf)))
	w.Write(pdf)
}

// ============================================================
// AGING REPORT
// ============================================================
func (h *InvoicesHandler) AgingReport(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT
		 COALESCE(musteri, 'Bilinmeyen') as musteri,
		 COALESCE(SUM(CASE WHEN vade >= CURRENT_DATE OR vade IS NULL THEN COALESCE(kalan, genel_toplam) ELSE 0 END), 0) as vadesi_gecmemis,
		 COALESCE(SUM(CASE WHEN vade < CURRENT_DATE AND vade >= CURRENT_DATE - INTERVAL '30 days' THEN COALESCE(kalan, genel_toplam) ELSE 0 END), 0) as gun_1_30,
		 COALESCE(SUM(CASE WHEN vade < CURRENT_DATE - INTERVAL '30 days' AND vade >= CURRENT_DATE - INTERVAL '60 days' THEN COALESCE(kalan, genel_toplam) ELSE 0 END), 0) as gun_31_60,
		 COALESCE(SUM(CASE WHEN vade < CURRENT_DATE - INTERVAL '60 days' AND vade >= CURRENT_DATE - INTERVAL '90 days' THEN COALESCE(kalan, genel_toplam) ELSE 0 END), 0) as gun_61_90,
		 COALESCE(SUM(CASE WHEN vade < CURRENT_DATE - INTERVAL '90 days' THEN COALESCE(kalan, genel_toplam) ELSE 0 END), 0) as gun_90_ustu,
		 COALESCE(SUM(COALESCE(kalan, genel_toplam)), 0) as toplam
		 FROM invoices
		 WHERE tenant_id = $1 AND odeme_durumu != 'odendi' AND odeme_durumu != 'iptal' AND kalan > 0
		 GROUP BY musteri
		 ORDER BY toplam DESC`, tenantID)
	if err != nil {
		slog.Error("failed to get aging report", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to get aging report")
		return
	}
	defer rows.Close()

	report := make([]models.AgingReportRow, 0)
	for rows.Next() {
		var row models.AgingReportRow
		if err := rows.Scan(&row.Musteri, &row.VadesiGecmemis, &row.Gun_1_30, &row.Gun_31_60, &row.Gun_61_90, &row.Gun_90_ustu, &row.Toplam); err != nil {
			continue
		}
		report = append(report, row)
	}

	writeJSON(w, http.StatusOK, report)
}

// ============================================================
// RECURRING INVOICES
// ============================================================
func (h *InvoicesHandler) ListRecurrences(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT r.id, r.tenant_id, r.customer_id, r.frekans, r.sonraki_tarih, r.bitis_tarihi, r.sablon, r.aktif, r.created_at,
		 COALESCE(c.firma_unvani, '') as musteri
		 FROM invoice_recurrences r
		 LEFT JOIN customers c ON c.id = r.customer_id
		 WHERE r.tenant_id = $1
		 ORDER BY r.sonraki_tarih`, tenantID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list recurrences")
		return
	}
	defer rows.Close()

	type RecurrenceWithName struct {
		models.InvoiceRecurrence
		Musteri string `json:"musteri"`
	}

	recs := make([]RecurrenceWithName, 0)
	for rows.Next() {
		var rec RecurrenceWithName
		var sonrakiOut, bitisOut *time.Time
		if err := rows.Scan(&rec.ID, &rec.TenantID, &rec.CustomerID, &rec.Frekans,
			&sonrakiOut, &bitisOut, &rec.Sablon, &rec.Aktif, &rec.CreatedAt, &rec.Musteri); err != nil {
			continue
		}
		if sonrakiOut != nil {
			rec.SonrakiTarih = sonrakiOut.Format("2006-01-02")
		}
		if bitisOut != nil {
			s := bitisOut.Format("2006-01-02")
			rec.BitisTarihi = &s
		}
		recs = append(recs, rec)
	}

	writeJSON(w, http.StatusOK, recs)
}

func (h *InvoicesHandler) CreateRecurrence(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req models.InvoiceRecurrenceCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.CustomerID == 0 {
		writeError(w, http.StatusBadRequest, "customer_id is required")
		return
	}
	if req.Frekans == "" {
		req.Frekans = "AYLIK"
	}

	sablonJSON, _ := json.Marshal(req.Sablon)

	var rec models.InvoiceRecurrence
	var bitisTarihi *string
	if req.BitisTarihi != "" {
		bitisTarihi = &req.BitisTarihi
	}

	var sonrakiOut, bitisOut *time.Time
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO invoice_recurrences (tenant_id, customer_id, frekans, sonraki_tarih, bitis_tarihi, sablon)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 RETURNING id, tenant_id, customer_id, frekans, sonraki_tarih, bitis_tarihi, sablon, aktif, created_at`,
		tenantID, req.CustomerID, req.Frekans, req.SonrakiTarih, bitisTarihi, sablonJSON,
	).Scan(&rec.ID, &rec.TenantID, &rec.CustomerID, &rec.Frekans,
		&sonrakiOut, &bitisOut, &rec.Sablon, &rec.Aktif, &rec.CreatedAt)
	if sonrakiOut != nil {
		rec.SonrakiTarih = sonrakiOut.Format("2006-01-02")
	}
	if bitisOut != nil {
		s := bitisOut.Format("2006-01-02")
		rec.BitisTarihi = &s
	}
	if err != nil {
		slog.Error("failed to create recurrence", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create recurrence")
		return
	}

	writeJSON(w, http.StatusCreated, rec)
}

func (h *InvoicesHandler) DeleteRecurrence(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	tag, _ := h.DB.Exec(r.Context(),
		`DELETE FROM invoice_recurrences WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "recurrence not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

// ============================================================
// TCMB RATES (cached)
// ============================================================
func (h *InvoicesHandler) GetTCMBRates(w http.ResponseWriter, r *http.Request) {
	rates := h.fetchTCMBRates()
	writeJSON(w, http.StatusOK, rates)
}

func (h *InvoicesHandler) fetchTCMBRates() []models.TCMBKur {
	if time.Since(h.kurTarih) < 1*time.Hour && len(h.kurCache) > 0 {
		result := make([]models.TCMBKur, 0, len(h.kurCache))
		for c, r := range h.kurCache {
			result = append(result, models.TCMBKur{Currency: c, Rate: r})
		}
		return result
	}

	// Fetch from TCMB XML API
	resp, err := http.Get("https://www.tcmb.gov.tr/kurlar/today.xml")
	if err != nil {
		return h.fallbackKur()
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	rates := parseTCMBXML(body)

	h.kurCache = make(map[string]float64)
	for _, r := range rates {
		h.kurCache[r.Currency] = r.Rate
	}
	h.kurTarih = time.Now()

	return rates
}

func (h *InvoicesHandler) getCachedKur(currency string) float64 {
	rates := h.fetchTCMBRates()
	for _, r := range rates {
		if r.Currency == currency {
			return r.Rate
		}
	}
	return 1.0
}

func (h *InvoicesHandler) fallbackKur() []models.TCMBKur {
	return []models.TCMBKur{
		{Currency: "USD", Rate: 38.0},
		{Currency: "EUR", Rate: 42.0},
		{Currency: "GBP", Rate: 49.0},
	}
}

func parseTCMBXML(data []byte) []models.TCMBKur {
	rates := []models.TCMBKur{}
	content := string(data)

	currencies := map[string]string{
		"USD": "ABD DOLARI", "EUR": "EURO", "GBP": "INGILIZ STERLINI",
		"CHF": "ISVICRE FRANGI", "JPY": "JAPON YENI",
	}

	for code, name := range currencies {
		startTag := fmt.Sprintf(`<CurrencyName>%s</CurrencyName>`, name)
		idx := strings.Index(content, startTag)
		if idx < 0 {
			continue
		}
		chunk := content[idx:]
		sellIdx := strings.Index(chunk, "<ForexSelling>")
		closeIdx := strings.Index(chunk[sellIdx:], "</ForexSelling>")
		if sellIdx < 0 || closeIdx < 0 {
			continue
		}
		rateStr := chunk[sellIdx+14 : sellIdx+closeIdx]
		rateStr = strings.ReplaceAll(rateStr, ".", "")
		rateStr = strings.ReplaceAll(rateStr, ",", ".")
		if r, err := strconv.ParseFloat(rateStr, 64); err == nil && r > 0 {
			rates = append(rates, models.TCMBKur{Currency: code, Rate: r})
		}
	}

	if len(rates) == 0 {
		return []models.TCMBKur{
			{Currency: "USD", Rate: 38.0},
			{Currency: "EUR", Rate: 42.0},
		}
	}
	return rates
}

// ============================================================
// PDF GENERATION
// ============================================================
func (h *InvoicesHandler) buildInvoiceHTML(invoice *models.Invoice, items []models.InvoiceItem, payments []models.InvoicePayment, req models.PDFGenerateRequest) string {
	logoHTML := ""
	if req.IncludeLogo {
		logoHTML = `<div style="text-align:right;"><h1 style="color:#FF5F03;font-size:28px;margin:0;">LOGISOL</h1></div>`
	}

	qrHTML := ""
	if req.IncludeQR {
		qrHTML = `<div style="text-align:right;margin-top:10px;"><img src="data:image/png;base64,` + base64.StdEncoding.EncodeToString(generateQRCode(invoice.FaturaNo)) + `" width="80" height="80"/></div>`
	}

	itemRows := ""
	toplam := 0.0
	for _, item := range items {
		miktar := derefFloat(item.Miktar)
		birimFiyat := derefFloat(item.BirimFiyat)
		tutar := miktar * birimFiyat
		iskonto := derefFloat(item.IskontoTutar)
		sonTutar := tutar - iskonto
		kdvOran := derefFloat(item.KdvOran)
		kdvTutar := sonTutar * kdvOran / 100
		toplam += sonTutar + kdvTutar

		itemRows += fmt.Sprintf(`<tr>
			<td style="padding:8px;border-bottom:1px solid #eee;">%s</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">%.2f</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">%.2f ₺</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">%.2f ₺</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">%%%.0f</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">%.2f ₺</td>
			<td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">%.2f ₺</td>
		</tr>`, item.UrunAdi, miktar, birimFiyat, tutar, kdvOran, kdvTutar, sonTutar+kdvTutar)
	}

	notlarHTML := ""
	if invoice.Notlar != nil && *invoice.Notlar != "" {
		notlarHTML = fmt.Sprintf(`<div style="margin-top:20px;"><strong>Notlar:</strong><br/>%s</div>`, *invoice.Notlar)
	}

	html := fmt.Sprintf(`<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
		body { font-family: 'Helvetica', 'DejaVu Sans', sans-serif; color: #1a1a2e; margin: 40px; }
		table { width: 100%%; border-collapse: collapse; }
		th { background: #FF5F03; color: white; padding: 10px; text-align: left; font-size: 12px; }
		.header { display: flex; justify-content: space-between; margin-bottom: 30px; }
		.invoice-info { font-size: 13px; }
		.invoice-info td { padding: 4px 10px 4px 0; }
		.total-row { font-weight: bold; font-size: 14px; }
		.footer { margin-top: 40px; font-size: 11px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
	</style></head><body>
	<div class="header">
		<div>
			%s
			<h2 style="margin:0;color:#FF5F03;font-size:22px;">FATURA</h2>
			<p style="margin:5px 0;color:#888;">%s</p>
		</div>
		%s
	</div>
	%s
	<table class="invoice-info" style="width:auto;margin-bottom:30px;">
		<tr><td><strong>Müşteri:</strong></td><td>%s</td></tr>
		<tr><td><strong>Tarih:</strong></td><td>%s</td></tr>
		<tr><td><strong>Vade:</strong></td><td>%s</td></tr>
		<tr><td><strong>Para Birimi:</strong></td><td>%s</td></tr>
	</table>
	<table>
		<thead><tr>
			<th>Ürün/Hizmet</th><th>Miktar</th><th>Birim Fiyat</th><th>Tutar</th><th>KDV%%</th><th>KDV Tutar</th><th>Toplam</th>
		</tr></thead>
		<tbody>%s</tbody>
	</table>
	<table style="width:300px;float:right;margin-top:20px;">
		<tr><td style="padding:4px;">Ara Toplam:</td><td style="text-align:right;">%.2f ₺</td></tr>
		<tr><td style="padding:4px;">KDV:</td><td style="text-align:right;">%.2f ₺</td></tr>
		<tr class="total-row"><td style="padding:4px;">Genel Toplam:</td><td style="text-align:right;color:#FF5F03;">%.2f ₺</td></tr>
	</table>
	%s
	<div class="footer">Bu fatura Unysol tarafından elektronik olarak düzenlenmiştir. | %s</div>
	</body></html>`,
		logoHTML,
		invoice.FaturaNo,
		qrHTML,
		qrHTML,
		derefStr(invoice.Musteri),
		derefStr(invoice.Tarih),
		derefStr(invoice.Vade),
		derefStr(invoice.ParaBirimi),
		itemRows,
		derefFloat(invoice.AraToplam),
		derefFloat(invoice.Kdv),
		derefFloat(invoice.GenelToplam),
		notlarHTML,
		time.Now().Format("02.01.2006 15:04"),
	)

	return html
}

func generatePDFFromHTML(html, orientation string) []byte {
	// Placeholder: In production, use wkhtmltopdf or chromedp
	// For now, return a minimal valid PDF with invoice info embedded
	pdf := []byte(fmt.Sprintf("%%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\nxref\n0 1\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%%%EOF"))
	_ = html
	_ = orientation
	return pdf
}

func generateQRCode(data string) []byte {
	// Placeholder: In production, use a QR code library like go-qrcode
	return []byte(fmt.Sprintf("QR:%s", data))
}

// ============================================================
// HELPERS
// ============================================================
func (h *InvoicesHandler) generateFaturaNo(ctx context.Context, tenantID string) (string, error) {
	year := time.Now().Year()

	var nextSeq int
	err := h.DB.QueryRow(ctx,
		`SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE(fatura_no, '^[A-Z]+-\d{4}-', ''), '')::INTEGER), 0) + 1
		 FROM invoices WHERE tenant_id = $1 AND fatura_no LIKE $2`,
		tenantID, fmt.Sprintf("FTR-%d-%%", year),
	).Scan(&nextSeq)
	if err != nil {
		return "", err
	}

	return fmt.Sprintf("FTR-%d-%04d", year, nextSeq), nil
}

func (h *InvoicesHandler) fetchInvoiceFull(ctx context.Context, tenantID string, id int) (*models.Invoice, []models.InvoiceItem, []models.InvoicePayment) {
	var inv models.Invoice
	var tarihOut, vadeOut, odemeTarihiOut, updatedAt *time.Time
	err := h.DB.QueryRow(ctx,
		`SELECT id, tenant_id, customer_id, trip_id, tip, iade_fatura_id, musteri, fatura_no,
		 tarih, vade, para_birimi, kur, ara_toplam, iskonto_tutar, iskonto_oran,
		 kdv, kdv_oran, tevkifat, genel_toplam, toplam_odenen, kalan, durum, odeme_durumu, odeme_yontemi,
		 ebelge_tip, ebelge_durum, ebelge_uuid, ebelge_ettn, ebelge_yanit,
		 odeme_tarihi, notlar, created_at, updated_at
		 FROM invoices WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(
		&inv.ID, &inv.TenantID, &inv.CustomerID, &inv.TripID, &inv.Tip, &inv.IadeFaturaID,
		&inv.Musteri, &inv.FaturaNo, &tarihOut, &vadeOut,
		&inv.ParaBirimi, &inv.Kur, &inv.AraToplam, &inv.IskontoTutar, &inv.IskontoOran,
		&inv.Kdv, &inv.KdvOran, &inv.Tevkifat, &inv.GenelToplam, &inv.ToplamOdenen, &inv.Kalan,
		&inv.Durum, &inv.OdemeDurumu, &inv.OdemeYontemi,
		&inv.EbelgeTip, &inv.EbelgeDurum, &inv.EbelgeUUID, &inv.EbelgeEttn, &inv.EbelgeYanit,
		&odemeTarihiOut, &inv.Notlar, &inv.CreatedAt, &updatedAt,
	)
	setTimeStr(&inv.Tarih, tarihOut)
	setTimeStr(&inv.Vade, vadeOut)
	setTimeStrFull(&inv.OdemeTarihi, odemeTarihiOut)
	setTimeStrFull(&inv.UpdatedAt, updatedAt)
	if err != nil {
		return nil, nil, nil
	}

	items := make([]models.InvoiceItem, 0)
	itemRows, _ := h.DB.Query(ctx,
		`SELECT id, invoice_id, sira, urun_adi, aciklama, miktar, birim,
		 birim_fiyat, kdv_oran, kdv_tutar, iskonto_oran, iskonto_tutar, tutar, created_at
		 FROM invoice_items WHERE invoice_id = $1 ORDER BY sira`, id)
	if itemRows != nil {
		defer itemRows.Close()
		for itemRows.Next() {
			var it models.InvoiceItem
			if err := itemRows.Scan(&it.ID, &it.InvoiceID, &it.Sira, &it.UrunAdi, &it.Aciklama,
				&it.Miktar, &it.Birim, &it.BirimFiyat, &it.KdvOran, &it.KdvTutar,
				&it.IskontoOran, &it.IskontoTutar, &it.Tutar, &it.CreatedAt); err != nil {
				continue
			}
			items = append(items, it)
		}
	}

	payments := make([]models.InvoicePayment, 0)
	payRows, _ := h.DB.Query(ctx,
		`SELECT id, invoice_id, tutar, yontem, referans_no, tarih, aciklama, created_at
		 FROM invoice_payments WHERE invoice_id = $1 ORDER BY tarih DESC`, id)
	if payRows != nil {
		defer payRows.Close()
		for payRows.Next() {
			var p models.InvoicePayment
			var pTarihOut time.Time
			if err := payRows.Scan(&p.ID, &p.InvoiceID, &p.Tutar, &p.Yontem,
				&p.ReferansNo, &pTarihOut, &p.Aciklama, &p.CreatedAt); err != nil {
				continue
			}
			setTimeStrFull(&p.Tarih, &pTarihOut)
			payments = append(payments, p)
		}
	}

	return &inv, items, payments
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func derefFloat(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}

func setTimeStr(dest **string, src *time.Time) {
	if src != nil {
		s := src.Format("2006-01-02")
		*dest = &s
	}
}

func setTimeStrFull(dest **string, src *time.Time) {
	if src != nil {
		s := src.Format(time.RFC3339)
		*dest = &s
	}
}
