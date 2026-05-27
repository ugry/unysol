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

type FuelLogHandler struct {
	DB *pgxpool.Pool
}

	type FuelLogEntry struct {
		ID           int       `json:"id"`
		TenantID     int       `json:"tenant_id"`
		TruckID      int       `json:"truck_id"`
		TruckPlaka   string    `json:"truck_plaka"`
		Tarih        string    `json:"tarih"`
		MiktarLitre  float64   `json:"miktar_litre"`
		BirimFiyat   float64   `json:"birim_fiyat"`
		ToplamTutar  float64   `json:"toplam_tutar"`
		AlinanYer    string    `json:"alinan_yer"`
		KmOkuma      int       `json:"km_okuma"`
		CreatedAt    time.Time `json:"created_at"`
	}

	type fuelLogRow struct {
		ID          int
		TenantID    int
		TruckID     int
		TruckPlaka  string
		Tarih       time.Time
		MiktarLitre float64
		BirimFiyat  float64
		ToplamTutar float64
		AlinanYer   string
		KmOkuma     int
		CreatedAt   time.Time
	}

func (h *FuelLogHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *FuelLogHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	truckID := r.URL.Query().Get("truck_id")

	query := `SELECT fl.id, fl.tenant_id, fl.truck_id, COALESCE(t.plaka,''), fl.tarih, fl.miktar_litre,
		fl.birim_fiyat, fl.toplam_tutar, COALESCE(fl.alinan_yer,''), COALESCE(fl.km_okuma,0), fl.created_at
		FROM fuel_logs fl LEFT JOIN trucks t ON t.id = fl.truck_id
		WHERE fl.tenant_id = $1`
	args := []interface{}{tenantID}
	argN := 2

	if truckID != "" {
		query += ` AND fl.truck_id = $` + itoa(argN)
		args = append(args, truckID)
		argN++
	}
	query += ` ORDER BY fl.tarih DESC LIMIT 500`

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("fuel logs: list failed", "error", err)
		writeError(w, http.StatusInternalServerError, "Yakıt kayıtları yüklenemedi")
		return
	}
	defer rows.Close()

	logs := make([]FuelLogEntry, 0)
	for rows.Next() {
		var row fuelLogRow
		if err := rows.Scan(&row.ID, &row.TenantID, &row.TruckID, &row.TruckPlaka, &row.Tarih,
			&row.MiktarLitre, &row.BirimFiyat, &row.ToplamTutar, &row.AlinanYer, &row.KmOkuma, &row.CreatedAt); err != nil {
			continue
		}
		logs = append(logs, FuelLogEntry{
			ID: row.ID, TenantID: row.TenantID, TruckID: row.TruckID, TruckPlaka: row.TruckPlaka,
			Tarih: row.Tarih.Format("2006-01-02"), MiktarLitre: row.MiktarLitre,
			BirimFiyat: row.BirimFiyat, ToplamTutar: row.ToplamTutar,
			AlinanYer: row.AlinanYer, KmOkuma: row.KmOkuma, CreatedAt: row.CreatedAt,
		})
	}
	writeJSON(w, http.StatusOK, logs)
}

func (h *FuelLogHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		TruckID     int     `json:"truck_id"`
		Tarih       string  `json:"tarih"`
		MiktarLitre float64 `json:"miktar_litre"`
		BirimFiyat  float64 `json:"birim_fiyat"`
		ToplamTutar float64 `json:"toplam_tutar"`
		AlinanYer   string  `json:"alinan_yer"`
		KmOkuma     int     `json:"km_okuma"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Geçersiz istek")
		return
	}
	if req.TruckID == 0 || req.MiktarLitre <= 0 {
		writeError(w, http.StatusBadRequest, "Kamyon ve litre bilgisi zorunludur")
		return
	}
	if req.ToplamTutar == 0 && req.BirimFiyat > 0 {
		req.ToplamTutar = req.MiktarLitre * req.BirimFiyat
	}
	if req.BirimFiyat == 0 && req.ToplamTutar > 0 {
		req.BirimFiyat = req.ToplamTutar / req.MiktarLitre
	}

	var row fuelLogRow
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO fuel_logs (tenant_id, truck_id, tarih, miktar_litre, birim_fiyat, toplam_tutar, alinan_yer, km_okuma)
		 VALUES ($1,$2,$3::date,$4,$5,$6,$7,$8)
		 RETURNING id, tenant_id, truck_id, '', tarih, miktar_litre, birim_fiyat, toplam_tutar, COALESCE(alinan_yer,''), COALESCE(km_okuma,0), created_at`,
		tenantID, req.TruckID, req.Tarih, req.MiktarLitre, req.BirimFiyat, req.ToplamTutar, req.AlinanYer, req.KmOkuma,
	).Scan(&row.ID, &row.TenantID, &row.TruckID, &row.TruckPlaka, &row.Tarih, &row.MiktarLitre,
		&row.BirimFiyat, &row.ToplamTutar, &row.AlinanYer, &row.KmOkuma, &row.CreatedAt)
	if err != nil {
		slog.Error("fuel logs: create failed", "error", err)
		writeError(w, http.StatusInternalServerError, "Yakıt kaydı oluşturulamadı")
		return
	}
	fl := FuelLogEntry{
		ID: row.ID, TenantID: row.TenantID, TruckID: row.TruckID, TruckPlaka: row.TruckPlaka,
		Tarih: row.Tarih.Format("2006-01-02"), MiktarLitre: row.MiktarLitre,
		BirimFiyat: row.BirimFiyat, ToplamTutar: row.ToplamTutar,
		AlinanYer: row.AlinanYer, KmOkuma: row.KmOkuma, CreatedAt: row.CreatedAt,
	}
	writeJSON(w, http.StatusCreated, fl)
}

func (h *FuelLogHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	var req struct {
		MiktarLitre float64 `json:"miktar_litre"`
		BirimFiyat  float64 `json:"birim_fiyat"`
		ToplamTutar float64 `json:"toplam_tutar"`
		AlinanYer   string  `json:"alinan_yer"`
		KmOkuma     int     `json:"km_okuma"`
	}
	json.NewDecoder(r.Body).Decode(&req)

	var fl FuelLogEntry
	err := h.DB.QueryRow(r.Context(),
		`UPDATE fuel_logs SET miktar_litre=COALESCE(NULLIF($3,0),miktar_litre),
		 birim_fiyat=COALESCE(NULLIF($4,0),birim_fiyat), toplam_tutar=COALESCE(NULLIF($5,0),toplam_tutar),
		 alinan_yer=COALESCE(NULLIF($6,''),alinan_yer), km_okuma=COALESCE(NULLIF($7,0),km_okuma)
		 WHERE id=$1 AND tenant_id=$2
		 RETURNING id, tenant_id, truck_id, '', '', miktar_litre, birim_fiyat, toplam_tutar, COALESCE(alinan_yer,''), COALESCE(km_okuma,0), created_at`,
		id, tenantID, req.MiktarLitre, req.BirimFiyat, req.ToplamTutar, req.AlinanYer, req.KmOkuma,
	).Scan(&fl.ID, &fl.TenantID, &fl.TruckID, &fl.TruckPlaka, &fl.Tarih, &fl.MiktarLitre,
		&fl.BirimFiyat, &fl.ToplamTutar, &fl.AlinanYer, &fl.KmOkuma, &fl.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "Kayıt bulunamadı")
		return
	}
	writeJSON(w, http.StatusOK, fl)
}

func (h *FuelLogHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))

	_, err := h.DB.Exec(r.Context(), `DELETE FROM fuel_logs WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	if err != nil {
		writeError(w, http.StatusNotFound, "Kayıt bulunamadı")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}
