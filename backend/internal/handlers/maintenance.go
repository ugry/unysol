package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
)

type MaintenanceHandler struct {
	DB *pgxpool.Pool
}

type MaintenanceEntry struct {
	ID                int       `json:"id"`
	TenantID          int       `json:"tenant_id"`
	TruckID           int       `json:"truck_id"`
	TruckPlaka        string    `json:"truck_plaka"`
	Tarih             string    `json:"tarih"`
	Km                int       `json:"km"`
	Turu              string    `json:"turu"`
	YapilanIslemler   string    `json:"yapilan_islemler"`
	ToplamTutar       float64   `json:"toplam_tutar"`
	FaturaNo          string    `json:"fatura_no"`
	ServisAdi         string    `json:"servis_adi"`
	SonrakiBakimKm    int       `json:"sonraki_bakim_km"`
		SonrakiBakimTarih string    `json:"sonraki_bakim_tarih"`
		CreatedAt         time.Time `json:"created_at"`
	}

	type maintRow struct {
		ID                int
		TenantID          int
		TruckID           int
		TruckPlaka        string
		Tarih             time.Time
		Km                int
		Turu              string
		YapilanIslemler   string
		ToplamTutar       float64
		FaturaNo          string
		ServisAdi         string
		SonrakiBakimKm    int
		SonrakiBakimTarih *time.Time
		CreatedAt         time.Time
	}

func (h *MaintenanceHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *MaintenanceHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	rows, err := h.DB.Query(r.Context(),
		`SELECT m.id, m.tenant_id, m.truck_id, COALESCE(t.plaka,''), m.tarih, COALESCE(m.km,0),
		 m.turu, COALESCE(m.yapilan_islemler,''), COALESCE(m.toplam_tutar,0), COALESCE(m.fatura_no,''),
		 COALESCE(m.servis_adi,''), COALESCE(m.sonraki_bakim_km,0), COALESCE(m.sonraki_bakim_tarih,''), m.created_at
		 FROM maintenance_records m LEFT JOIN trucks t ON t.id = m.truck_id
		 WHERE m.tenant_id = $1 ORDER BY m.tarih DESC LIMIT 500`, tenantID)
	if err != nil {
		slog.Error("maintenance: list failed", "error", err)
		writeError(w, http.StatusInternalServerError, "Bakım kayıtları yüklenemedi")
		return
	}
	defer rows.Close()

	records := make([]MaintenanceEntry, 0)
	for rows.Next() {
		var row maintRow
		if err := rows.Scan(&row.ID, &row.TenantID, &row.TruckID, &row.TruckPlaka, &row.Tarih, &row.Km,
			&row.Turu, &row.YapilanIslemler, &row.ToplamTutar, &row.FaturaNo,
			&row.ServisAdi, &row.SonrakiBakimKm, &row.SonrakiBakimTarih, &row.CreatedAt); err != nil {
			continue
		}
		nbt := ""
		if row.SonrakiBakimTarih != nil {
			nbt = row.SonrakiBakimTarih.Format("2006-01-02")
		}
		records = append(records, MaintenanceEntry{
			ID: row.ID, TenantID: row.TenantID, TruckID: row.TruckID, TruckPlaka: row.TruckPlaka,
			Tarih: row.Tarih.Format("2006-01-02"), Km: row.Km, Turu: row.Turu,
			YapilanIslemler: row.YapilanIslemler, ToplamTutar: row.ToplamTutar,
			FaturaNo: row.FaturaNo, ServisAdi: row.ServisAdi,
			SonrakiBakimKm: row.SonrakiBakimKm, SonrakiBakimTarih: nbt, CreatedAt: row.CreatedAt,
		})
	}
	writeJSON(w, http.StatusOK, records)
}

func (h *MaintenanceHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		TruckID           int     `json:"truck_id"`
		Tarih             string  `json:"tarih"`
		Km                int     `json:"km"`
		Turu              string  `json:"turu"`
		YapilanIslemler   string  `json:"yapilan_islemler"`
		ToplamTutar       float64 `json:"toplam_tutar"`
		FaturaNo          string  `json:"fatura_no"`
		ServisAdi         string  `json:"servis_adi"`
		SonrakiBakimKm    int     `json:"sonraki_bakim_km"`
		SonrakiBakimTarih string  `json:"sonraki_bakim_tarih"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Geçersiz istek")
		return
	}
	if req.TruckID == 0 || req.Tarih == "" {
		writeError(w, http.StatusBadRequest, "Kamyon ve tarih zorunludur")
		return
	}
	if req.Turu == "" {
		req.Turu = "PERIYODIK_BAKIM"
	}

	var nbtParam interface{}
	if req.SonrakiBakimTarih != "" {
		nbtParam = req.SonrakiBakimTarih
	}

	var row maintRow
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO maintenance_records (tenant_id, truck_id, tarih, km, turu, yapilan_islemler, toplam_tutar, fatura_no, servis_adi, sonraki_bakim_km, sonraki_bakim_tarih)
		 VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8,$9,$10,$11::date)
		 RETURNING id, tenant_id, truck_id, '', tarih, COALESCE(km,0), turu, COALESCE(yapilan_islemler,''), COALESCE(toplam_tutar,0), COALESCE(fatura_no,''), COALESCE(servis_adi,''), COALESCE(sonraki_bakim_km,0), sonraki_bakim_tarih, created_at`,
		tenantID, req.TruckID, req.Tarih, req.Km, req.Turu, req.YapilanIslemler, req.ToplamTutar,
		req.FaturaNo, req.ServisAdi, req.SonrakiBakimKm, nbtParam,
	).Scan(&row.ID, &row.TenantID, &row.TruckID, &row.TruckPlaka, &row.Tarih, &row.Km,
		&row.Turu, &row.YapilanIslemler, &row.ToplamTutar, &row.FaturaNo,
		&row.ServisAdi, &row.SonrakiBakimKm, &row.SonrakiBakimTarih, &row.CreatedAt)
	if err != nil {
		slog.Error("maintenance: create failed", "error", err)
		writeError(w, http.StatusInternalServerError, "Bakım kaydı oluşturulamadı")
		return
	}
	nbt := ""
	if row.SonrakiBakimTarih != nil {
		nbt = row.SonrakiBakimTarih.Format("2006-01-02")
	}
	m := MaintenanceEntry{
		ID: row.ID, TenantID: row.TenantID, TruckID: row.TruckID, TruckPlaka: row.TruckPlaka,
		Tarih: row.Tarih.Format("2006-01-02"), Km: row.Km, Turu: row.Turu,
		YapilanIslemler: row.YapilanIslemler, ToplamTutar: row.ToplamTutar,
		FaturaNo: row.FaturaNo, ServisAdi: row.ServisAdi,
		SonrakiBakimKm: row.SonrakiBakimKm, SonrakiBakimTarih: nbt, CreatedAt: row.CreatedAt,
	}
	writeJSON(w, http.StatusCreated, m)
}

func (h *MaintenanceHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req struct {
		Turu              string  `json:"turu"`
		YapilanIslemler   string  `json:"yapilan_islemler"`
		ToplamTutar       float64 `json:"toplam_tutar"`
		SonrakiBakimKm    int     `json:"sonraki_bakim_km"`
		SonrakiBakimTarih string  `json:"sonraki_bakim_tarih"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var m MaintenanceEntry
	var t time.Time
	err := h.DB.QueryRow(r.Context(),
		`UPDATE maintenance_records SET
		 turu=COALESCE(NULLIF($3,''),turu), yapilan_islemler=COALESCE(NULLIF($4,''),yapilan_islemler),
		 toplam_tutar=COALESCE(NULLIF($5,0),toplam_tutar),
		 sonraki_bakim_km=COALESCE(NULLIF($6,0),sonraki_bakim_km),
		 sonraki_bakim_tarih=COALESCE(NULLIF($7,'')::date,sonraki_bakim_tarih)
		 WHERE id=$1 AND tenant_id=$2
		 RETURNING id, tenant_id, truck_id, '', tarih, COALESCE(km,0), turu, COALESCE(yapilan_islemler,''), COALESCE(toplam_tutar,0), COALESCE(fatura_no,''), COALESCE(servis_adi,''), COALESCE(sonraki_bakim_km,0), COALESCE(sonraki_bakim_tarih,''), created_at`,
		id, tenantID, req.Turu, req.YapilanIslemler, req.ToplamTutar, req.SonrakiBakimKm, req.SonrakiBakimTarih,
	).Scan(&m.ID, &m.TenantID, &m.TruckID, &m.TruckPlaka, &t, &m.Km,
		&m.Turu, &m.YapilanIslemler, &m.ToplamTutar, &m.FaturaNo,
		&m.ServisAdi, &m.SonrakiBakimKm, &m.SonrakiBakimTarih, &m.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "Kayıt bulunamadı")
		return
	}
	m.Tarih = t.Format("2006-01-02")
	writeJSON(w, http.StatusOK, m)
}

func (h *MaintenanceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	_, err := h.DB.Exec(r.Context(), `DELETE FROM maintenance_records WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Kayıt bulunamadı")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
