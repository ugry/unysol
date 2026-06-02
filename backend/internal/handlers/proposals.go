package handlers

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type ProposalsHandler struct{ DB *pgxpool.Pool }

func (h *ProposalsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	r.Put("/{id}/status", h.UpdateStatus)
	r.Get("/summary", h.Summary)
	return r
}

func (h *ProposalsHandler) List(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `
		SELECT p.id, p.teklif_no, p.baslik, p.tutar, p.durum, p.teklif_tarihi, p.gecerlilik_tarihi,
			COALESCE(p.musteri_id, 0), COALESCE(c.firma_unvani, '')
		FROM proposals p LEFT JOIN customers c ON c.id=p.musteri_id
		WHERE p.tenant_id=$1 ORDER BY p.created_at DESC`, tid)
	if err != nil { writeError(w, 500, "failed to list proposals"); return }
	defer rows.Close()
	var data []map[string]interface{}
	for rows.Next() {
		var id, mid int; var no, baslik, durum, cname string; var tutar float64; var tdate time.Time; var gdate *time.Time
		if err := rows.Scan(&id, &no, &baslik, &tutar, &durum, &tdate, &gdate, &mid, &cname); err != nil { continue }
		item := map[string]interface{}{"id":id,"musteri_id":mid,"musteri_adi":cname,"teklif_no":no,"baslik":baslik,"tutar":tutar,"durum":durum,"teklif_tarihi":tdate.Format("2006-01-02")}
		if gdate != nil { item["gecerlilik_tarihi"] = gdate.Format("2006-01-02") }
		data = append(data, item)
	}
	if data == nil { data = []map[string]interface{}{} }
	writeJSON(w, 200, models.APIResponse{Success:true, Data:data})
}

func (h *ProposalsHandler) Create(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	var req struct {
		MusteriID       int     `json:"musteri_id"`
		Baslik          string  `json:"baslik"`
		Aciklama        string  `json:"aciklama"`
		Tutar           float64 `json:"tutar"`
		TeklifTarihi    string  `json:"teklif_tarihi"`
		GecerlilikTarihi string `json:"gecerlilik_tarihi"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Baslik == "" {
		writeError(w, 400, "baslik zorunludur"); return
	}
	var seq int
	h.DB.QueryRow(r.Context(), `SELECT COUNT(*)+1 FROM proposals WHERE tenant_id=$1`, tid).Scan(&seq)
	no := fmt.Sprintf("TKF-%s-%04d", time.Now().Format("20060102"), seq)

	var musteriID interface{} = nil
	if req.MusteriID > 0 { musteriID = req.MusteriID }
	var gecerlilik interface{} = nil
	if req.GecerlilikTarihi != "" { gecerlilik = req.GecerlilikTarihi }
	tarih := req.TeklifTarihi
	if tarih == "" { tarih = time.Now().Format("2006-01-02") }

	var id int
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO proposals (tenant_id, musteri_id, teklif_no, baslik, aciklama, tutar, teklif_tarihi, gecerlilik_tarihi)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
		tid, musteriID, no, req.Baslik, req.Aciklama, req.Tutar, tarih, gecerlilik).Scan(&id)
	if err != nil { slog.Error("proposal create failed","error",err); writeError(w, 500, "failed to create"); return }
	writeJSON(w, 201, map[string]interface{}{"id":id,"success":true})
}

func (h *ProposalsHandler) Update(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r,"id"))
	var req struct { Baslik string `json:"baslik"`; Aciklama string `json:"aciklama"`; Tutar float64 `json:"tutar"`; GecerlilikTarihi string `json:"gecerlilik_tarihi"`; MusteriID int `json:"musteri_id"` }
	json.NewDecoder(r.Body).Decode(&req)
	_, err := h.DB.Exec(r.Context(), `UPDATE proposals SET baslik=COALESCE(NULLIF($1,''),baslik), aciklama=$2, tutar=$3, gecerlilik_tarihi=COALESCE(NULLIF($4,'')::date,gecerlilik_tarihi), musteri_id=COALESCE(NULLIF($5,0),musteri_id), updated_at=NOW() WHERE id=$6 AND tenant_id=$7`,
		req.Baslik, req.Aciklama, req.Tutar, req.GecerlilikTarihi, req.MusteriID, id, tid)
	if err != nil { writeError(w, 500, "failed to update"); return }
	writeJSON(w, 200, models.SuccessResponse{Success:true,Message:"updated"})
}

func (h *ProposalsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r,"id"))
	_, err := h.DB.Exec(r.Context(), `DELETE FROM proposals WHERE id=$1 AND tenant_id=$2`, id, tid)
	if err != nil { writeError(w, 500, "failed to delete"); return }
	writeJSON(w, 200, models.SuccessResponse{Success:true,Message:"deleted"})
}

func (h *ProposalsHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r,"id"))
	var req struct { Durum string `json:"durum"` }
	json.NewDecoder(r.Body).Decode(&req)
	_, err := h.DB.Exec(r.Context(), `UPDATE proposals SET durum=$1, updated_at=NOW() WHERE id=$2 AND tenant_id=$3`, req.Durum, id, tid)
	if err != nil { writeError(w, 500, "failed to update status"); return }
	writeJSON(w, 200, models.SuccessResponse{Success:true,Message:"status updated"})
}

func (h *ProposalsHandler) Summary(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	var total, bekleyen, onaylanan, reddedilen float64; var count int
	h.DB.QueryRow(r.Context(), `SELECT COUNT(*), COALESCE(SUM(tutar),0) FROM proposals WHERE tenant_id=$1`, tid).Scan(&count, &total)
	h.DB.QueryRow(r.Context(), `SELECT COALESCE(SUM(tutar),0) FROM proposals WHERE tenant_id=$1 AND durum='BEKLIYOR'`, tid).Scan(&bekleyen)
	h.DB.QueryRow(r.Context(), `SELECT COALESCE(SUM(tutar),0) FROM proposals WHERE tenant_id=$1 AND durum='ONAYLANDI'`, tid).Scan(&onaylanan)
	h.DB.QueryRow(r.Context(), `SELECT COALESCE(SUM(tutar),0) FROM proposals WHERE tenant_id=$1 AND durum='REDDEDILDI'`, tid).Scan(&reddedilen)
	writeJSON(w, 200, models.APIResponse{Success:true, Data: map[string]interface{}{"total":total,"count":count,"bekleyen":bekleyen,"onaylanan":onaylanan,"reddedilen":reddedilen}})
}
