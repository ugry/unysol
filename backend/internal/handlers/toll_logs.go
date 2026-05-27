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

type TollLogHandler struct{ DB *pgxpool.Pool }

func (h *TollLogHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *TollLogHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `SELECT tl.id, tl.tenant_id, tl.truck_id, COALESCE(t.plaka,''), tl.gecis_tarihi, COALESCE(tl.hgs_etiket_no,''), COALESCE(tl.giris_gise,''), COALESCE(tl.cikis_gise,''), COALESCE(tl.gecis_ucreti,0), tl.created_at FROM toll_logs tl LEFT JOIN trucks t ON t.id=tl.truck_id WHERE tl.tenant_id=$1 ORDER BY tl.gecis_tarihi DESC LIMIT 500`, tenantID)
	if err != nil { writeError(w, 500, "HGS kayıtları yüklenemedi"); return }
	defer rows.Close()
	result := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id, tid, truckID int; var plaka, etiket, giris, cikis string; var tarih time.Time; var ucret float64; var created interface{}
		rows.Scan(&id, &tid, &truckID, &plaka, &tarih, &etiket, &giris, &cikis, &ucret, &created)
		dateStr := tarih.Format("2006-01-02")
		result = append(result, map[string]interface{}{"id": id, "tenant_id": tid, "truck_id": truckID, "truck_plaka": plaka, "gecis_tarihi": dateStr, "hgs_etiket_no": etiket, "giris_gise": giris, "cikis_gise": cikis, "gecis_ucreti": ucret})
	}
	writeJSON(w, 200, result)
}

func (h *TollLogHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req struct {
		TruckID     int     `json:"truck_id"`
		GecisTarihi string  `json:"gecis_tarihi"`
		HgsEtiketNo string  `json:"hgs_etiket_no"`
		GirisGise   string  `json:"giris_gise"`
		CikisGise   string  `json:"cikis_gise"`
		GecisUcreti float64 `json:"gecis_ucreti"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if req.TruckID == 0 { writeError(w, 400, "Kamyon zorunludur"); return }
	var id int
	err := h.DB.QueryRow(r.Context(), `INSERT INTO toll_logs (tenant_id, truck_id, gecis_tarihi, hgs_etiket_no, giris_gise, cikis_gise, gecis_ucreti) VALUES ($1,$2,$3::date,$4,$5,$6,$7) RETURNING id`, tenantID, req.TruckID, req.GecisTarihi, req.HgsEtiketNo, req.GirisGise, req.CikisGise, req.GecisUcreti).Scan(&id)
	if err != nil { slog.Error("toll create failed", "error", err); writeError(w, 500, "HGS kaydı oluşturulamadı"); return }
	writeJSON(w, 201, map[string]interface{}{"id": id})
}

func (h *TollLogHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.DB.Exec(r.Context(), `DELETE FROM toll_logs WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	writeJSON(w, 200, map[string]string{"status": "deleted"})
}

func (h *TollLogHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		HgsEtiketNo string  `json:"hgs_etiket_no"`
		GirisGise   string  `json:"giris_gise"`
		CikisGise   string  `json:"cikis_gise"`
		GecisUcreti float64 `json:"gecis_ucreti"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	_, err := h.DB.Exec(r.Context(), `UPDATE toll_logs SET hgs_etiket_no=COALESCE(NULLIF($3,''),hgs_etiket_no), giris_gise=COALESCE(NULLIF($4,''),giris_gise), cikis_gise=COALESCE(NULLIF($5,''),cikis_gise), gecis_ucreti=COALESCE(NULLIF($6,0),gecis_ucreti) WHERE id=$1 AND tenant_id=$2`, id, tenantID, req.HgsEtiketNo, req.GirisGise, req.CikisGise, req.GecisUcreti)
	if err != nil { writeError(w, 404, "Kayıt bulunamadı"); return }
	writeJSON(w, 200, map[string]string{"status": "updated"})
}
