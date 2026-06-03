package handlers

import (
	"encoding/json"
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

type CekSenetHandler struct {
	DB *pgxpool.Pool
}

func (h *CekSenetHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant(h.DB))
	r.Get("/summary", h.Summary)
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{id}", h.Get)
	r.Put("/{id}", h.Update)
	r.Put("/{id}/status", h.UpdateStatus)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *CekSenetHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	query := `SELECT id, tenant_id, customer_id, type, no, tutar, vade_tarihi, status,
		banka, sube, borclu, notlar, created_at
		FROM cek_senet WHERE tenant_id = $1
		ORDER BY vade_tarihi LIMIT 500`
	rows, err := h.DB.Query(r.Context(), query, tenantID)
	if err != nil {
		slog.Error("failed to list cek/senet", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list cek/senet")
		return
	}
	defer rows.Close()

	cekSenetler := make([]models.CekSenet, 0)
	for rows.Next() {
		var cs models.CekSenet
		var vadeTarihiOut time.Time
		if err := rows.Scan(&cs.ID, &cs.TenantID, &cs.CustomerID, &cs.Tur, &cs.SeriNo,
			&cs.Tutar, &vadeTarihiOut, &cs.Status,
			&cs.Banka, &cs.Sube, &cs.Kesideci, &cs.Aciklama, &cs.CreatedAt); err != nil {
			slog.Error("failed to scan cek/senet", "error", err)
			continue
		}
		s := vadeTarihiOut.Format("2006-01-02")
		cs.VadeTarihi = &s
		cekSenetler = append(cekSenetler, cs)
	}
	writeJSON(w, http.StatusOK, cekSenetler)
}

func (h *CekSenetHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req models.CekSenetCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Geçersiz istek")
		return
	}
	req.Tur = strings.ToUpper(req.Tur)
	if req.Tur == "" {
		writeError(w, http.StatusBadRequest, "Tür zorunludur (CEK veya SENET)")
		return
	}
	if req.Tutar <= 0 {
		writeError(w, http.StatusBadRequest, "Tutar sıfırdan büyük olmalıdır")
		return
	}
	vadeTarihi, err := time.Parse("2006-01-02", req.VadeTarihi)
	if err != nil {
		vadeTarihi = time.Now().AddDate(0, 0, 30)
	}
	var cID *int
	if req.CustomerID > 0 {
		cID = &req.CustomerID
	}
	var cs models.CekSenet
	var vadeTarihiOut time.Time
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO cek_senet (tenant_id, customer_id, type, no, tutar, vade_tarihi, status, banka, sube, borclu, notlar)
		 VALUES ($1,$2,$3,$4,$5,$6,'BEKLIYOR',$7,$8,$9,$10)
		 RETURNING id, tenant_id, customer_id, type, no, tutar, vade_tarihi, status,
			banka, sube, borclu, notlar, created_at`,
		tenantID, cID, req.Tur, req.SeriNo, req.Tutar, vadeTarihi,
		req.Banka, req.Sube, req.Kesideci, req.Aciklama,
	).Scan(&cs.ID, &cs.TenantID, &cs.CustomerID, &cs.Tur, &cs.SeriNo,
		&cs.Tutar, &vadeTarihiOut, &cs.Status,
		&cs.Banka, &cs.Sube, &cs.Kesideci, &cs.Aciklama, &cs.CreatedAt)
	if err != nil {
		slog.Error("failed to create cek/senet", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create cek/senet")
		return
	}
	s := vadeTarihiOut.Format("2006-01-02")
	cs.VadeTarihi = &s
	writeJSON(w, http.StatusCreated, cs)
}

func (h *CekSenetHandler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var cs models.CekSenet
	var vadeTarihiOut time.Time
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, customer_id, type, no, tutar, vade_tarihi, status,
			banka, sube, borclu, notlar, created_at
		 FROM cek_senet WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&cs.ID, &cs.TenantID, &cs.CustomerID, &cs.Tur, &cs.SeriNo,
		&cs.Tutar, &vadeTarihiOut, &cs.Status,
		&cs.Banka, &cs.Sube, &cs.Kesideci, &cs.Aciklama, &cs.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "cek/senet not found")
		return
	}
	s := vadeTarihiOut.Format("2006-01-02")
	cs.VadeTarihi = &s
	writeJSON(w, http.StatusOK, cs)
}

func (h *CekSenetHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var req models.CekSenetCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	var vadeTarihi *time.Time
	if req.VadeTarihi != "" {
		if parsed, err := time.Parse("2006-01-02", req.VadeTarihi); err == nil {
			vadeTarihi = &parsed
		}
	}
	var cs models.CekSenet
	var vadeTarihiOut time.Time
	var cID *int
	if req.CustomerID > 0 {
		cID = &req.CustomerID
	}
	err = h.DB.QueryRow(r.Context(),
		`UPDATE cek_senet SET
		 customer_id = COALESCE($1, customer_id),
		 type = COALESCE(NULLIF($2, ''), type),
		 no = COALESCE(NULLIF($3, ''), no),
		 tutar = COALESCE(NULLIF($4, 0), tutar),
		 vade_tarihi = COALESCE($5, vade_tarihi),
		 banka = COALESCE(NULLIF($6, ''), banka),
		 sube = COALESCE(NULLIF($7, ''), sube),
		 borclu = COALESCE(NULLIF($8, ''), borclu),
		 notlar = COALESCE(NULLIF($9, ''), notlar)
		 WHERE id = $10 AND tenant_id = $11
		 RETURNING id, tenant_id, customer_id, type, no, tutar, vade_tarihi, status,
			banka, sube, borclu, notlar, created_at`,
		cID, req.Tur, req.SeriNo, req.Tutar, vadeTarihi,
		req.Banka, req.Sube, req.Kesideci, req.Aciklama, id, tenantID,
	).Scan(&cs.ID, &cs.TenantID, &cs.CustomerID, &cs.Tur, &cs.SeriNo,
		&cs.Tutar, &vadeTarihiOut, &cs.Status,
		&cs.Banka, &cs.Sube, &cs.Kesideci, &cs.Aciklama, &cs.CreatedAt)
	if err != nil {
		slog.Error("failed to update cek/senet", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update cek/senet")
		return
	}
	s := vadeTarihiOut.Format("2006-01-02")
	cs.VadeTarihi = &s
	writeJSON(w, http.StatusOK, cs)
}

func (h *CekSenetHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	var req models.CekSenetStatusUpdate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	var cs models.CekSenet
	var vadeTarihiOut time.Time
	err = h.DB.QueryRow(r.Context(),
		`UPDATE cek_senet SET status = $1
		 WHERE id = $2 AND tenant_id = $3
		 RETURNING id, tenant_id, customer_id, type, no, tutar, vade_tarihi, status,
			banka, sube, borclu, notlar, created_at`,
		req.Status, id, tenantID,
	).Scan(&cs.ID, &cs.TenantID, &cs.CustomerID, &cs.Tur, &cs.SeriNo,
		&cs.Tutar, &vadeTarihiOut, &cs.Status,
		&cs.Banka, &cs.Sube, &cs.Kesideci, &cs.Aciklama, &cs.CreatedAt)
	if err != nil {
		slog.Error("failed to update cek/senet status", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update cek/senet status")
		return
	}
	s := vadeTarihiOut.Format("2006-01-02")
	cs.VadeTarihi = &s
	writeJSON(w, http.StatusOK, cs)
}

func (h *CekSenetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	result, err := h.DB.Exec(r.Context(),
		`DELETE FROM cek_senet WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if err != nil {
		slog.Error("failed to delete cek/senet", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete cek/senet")
		return
	}
	if result.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "cek/senet not found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *CekSenetHandler) Summary(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var summary models.CekSenetSummary
	h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(tutar), 0) FROM cek_senet
		 WHERE tenant_id = $1 AND status = 'BEKLIYOR'`, tenantID,
	).Scan(&summary.ToplamPortfoy)
	h.DB.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM cek_senet
		 WHERE tenant_id = $1 AND status = 'BEKLIYOR'
		 AND vade_tarihi <= CURRENT_DATE + INTERVAL '7 days'`, tenantID,
	).Scan(&summary.YaklasanVadeCount)
	h.DB.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM cek_senet
		 WHERE tenant_id = $1 AND vade_tarihi < CURRENT_DATE AND status = 'BEKLIYOR'`, tenantID,
	).Scan(&summary.GecikmisCount)
	h.DB.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM cek_senet
		 WHERE tenant_id = $1 AND status = 'KARSILIKSIZ'`, tenantID,
	).Scan(&summary.KarsiliksizCount)
	writeJSON(w, http.StatusOK, summary)
}
