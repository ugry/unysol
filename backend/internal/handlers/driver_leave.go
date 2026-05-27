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

type LeaveHandler struct{ DB *pgxpool.Pool }

func (h *LeaveHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *LeaveHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `SELECT dl.id, dl.tenant_id, dl.user_id, COALESCE(u.ad_soyad,''), dl.baslangic, dl.bitis, dl.turu, dl.onay_durumu, COALESCE(dl.aciklama,''), dl.created_at FROM driver_leave dl LEFT JOIN users u ON u.id=dl.user_id WHERE dl.tenant_id=$1 ORDER BY dl.baslangic DESC LIMIT 500`, tenantID)
	if err != nil { writeError(w, 500, "İzin kayıtları yüklenemedi"); return }
	defer rows.Close()
	result := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id, tid, uid int; var adSoyad, turu, durum, aciklama string; var baslangic, bitis time.Time; var created interface{}
		rows.Scan(&id, &tid, &uid, &adSoyad, &baslangic, &bitis, &turu, &durum, &aciklama, &created)
		result = append(result, map[string]interface{}{"id": id, "tenant_id": tid, "user_id": uid, "ad_soyad": adSoyad, "baslangic": baslangic.Format("2006-01-02"), "bitis": bitis.Format("2006-01-02"), "turu": turu, "onay_durumu": durum, "aciklama": aciklama})
	}
	writeJSON(w, 200, result)
}

func (h *LeaveHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req struct {
		UserID   int    `json:"user_id"`
		Baslangic string `json:"baslangic"`
		Bitis     string `json:"bitis"`
		Turu      string `json:"turu"`
		Aciklama  string `json:"aciklama"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if req.UserID == 0 || req.Baslangic == "" || req.Bitis == "" { writeError(w, 400, "Personel, başlangıç ve bitiş tarihi zorunludur"); return }
	if req.Turu == "" { req.Turu = "YILLIK_IZIN" }
	tid, _ := strconv.Atoi(tenantID)
	var id int
	err := h.DB.QueryRow(r.Context(), `INSERT INTO driver_leave (tenant_id, user_id, baslangic, bitis, turu, aciklama) VALUES ($1,$2,$3::date,$4::date,$5,$6) RETURNING id`, tid, req.UserID, req.Baslangic, req.Bitis, req.Turu, req.Aciklama).Scan(&id)
	if err != nil { slog.Error("leave create failed", "error", err); writeError(w, 500, "İzin kaydı oluşturulamadı"); return }
	writeJSON(w, 201, map[string]interface{}{"id": id})
}

func (h *LeaveHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct{ OnayDurumu string `json:"onay_durumu"` }
	json.NewDecoder(r.Body).Decode(&req)
	_, err := h.DB.Exec(r.Context(), `UPDATE driver_leave SET onay_durumu=$3 WHERE id=$1 AND tenant_id=$2`, id, tenantID, req.OnayDurumu)
	if err != nil { writeError(w, 404, "Kayıt bulunamadı"); return }
	writeJSON(w, 200, map[string]string{"status": "updated"})
}

func (h *LeaveHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.DB.Exec(r.Context(), `DELETE FROM driver_leave WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	writeJSON(w, 200, map[string]string{"status": "deleted"})
}
