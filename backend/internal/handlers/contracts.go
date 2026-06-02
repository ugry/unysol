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

type ContractsHandler struct{ DB *pgxpool.Pool }

func (h *ContractsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List); r.Post("/", h.Create); r.Put("/{id}", h.Update); r.Delete("/{id}", h.Delete)
	return r
}

func (h *ContractsHandler) List(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `
		SELECT c.id, c.sozlesme_no, c.baslik, c.tur, c.baslangic_tarihi, c.bitis_tarihi, c.tutar, c.durum,
			COALESCE(c.musteri_id,0), COALESCE(cu.firma_unvani,'')
		FROM contracts c LEFT JOIN customers cu ON cu.id=c.musteri_id
		WHERE c.tenant_id=$1 ORDER BY c.created_at DESC`, tid)
	if err != nil { writeError(w, 500, "failed"); return }
	defer rows.Close()
	var data []map[string]interface{}
	for rows.Next() {
		var id, mid int; var no, baslik, tur, durum, cname string; var tutar float64; var bs, bt *time.Time
		if err := rows.Scan(&id, &no, &baslik, &tur, &bs, &bt, &tutar, &durum, &mid, &cname); err != nil { continue }
		item := map[string]interface{}{"id":id,"sozlesme_no":no,"baslik":baslik,"tur":tur,"tutar":tutar,"durum":durum,"musteri_id":mid,"musteri_adi":cname}
		if bs != nil { item["baslangic_tarihi"] = bs.Format("2006-01-02") }
		if bt != nil { item["bitis_tarihi"] = bt.Format("2006-01-02") }
		data = append(data, item)
	}
	if data == nil { data = []map[string]interface{}{} }
	writeJSON(w, 200, models.APIResponse{Success:true, Data:data})
}

func (h *ContractsHandler) Create(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	var req struct { MusteriID int `json:"musteri_id"`; Baslik string `json:"baslik"`; Tur string `json:"tur"`; Tutar float64 `json:"tutar"`; Baslangic string `json:"baslangic_tarihi"`; Bitis string `json:"bitis_tarihi"`; Aciklama string `json:"aciklama"` }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Baslik == "" { writeError(w, 400, "baslik zorunludur"); return }
	if req.Tur == "" { req.Tur = "NAKLIYE" }
	if req.Baslangic == "" { req.Baslangic = time.Now().Format("2006-01-02") }
	var seq int; h.DB.QueryRow(r.Context(), `SELECT COUNT(*)+1 FROM contracts WHERE tenant_id=$1`, tid).Scan(&seq)
	no := fmt.Sprintf("SOZ-%s-%04d", time.Now().Format("20060102"), seq)
	var id int
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO contracts (tenant_id, sozlesme_no, baslik, tur, tutar, baslangic_tarihi, bitis_tarihi, aciklama, musteri_id)
		 VALUES ($1,$2,$3,$4,$5,$6,NULLIF($7,'')::date,NULLIF($8,''),NULLIF($9,0)) RETURNING id`,
		tid, no, req.Baslik, req.Tur, req.Tutar, req.Baslangic, req.Bitis, req.Aciklama, req.MusteriID).Scan(&id)
	if err != nil { slog.Error("contract create failed","error",err); writeError(w, 500, "failed"); return }
	writeJSON(w, 201, map[string]interface{}{"id":id,"success":true})
}

func (h *ContractsHandler) Update(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context()); id, _ := strconv.Atoi(chi.URLParam(r,"id"))
	var req struct { Baslik string `json:"baslik"`; Tur string `json:"tur"`; Tutar float64 `json:"tutar"`; Bitis string `json:"bitis_tarihi"`; Aciklama string `json:"aciklama"`; MusteriID int `json:"musteri_id"`; Durum string `json:"durum"` }
	json.NewDecoder(r.Body).Decode(&req)
	_, err := h.DB.Exec(r.Context(),
		`UPDATE contracts SET baslik=COALESCE(NULLIF($1,''),baslik), tur=COALESCE(NULLIF($2,''),tur), tutar=$3,
		 bitis_tarihi=COALESCE(NULLIF($4,'')::date,bitis_tarihi), aciklama=$5,
		 musteri_id=CASE WHEN $6 > 0 THEN $6 ELSE musteri_id END,
		 durum=COALESCE(NULLIF($7,''),durum), updated_at=NOW()
		 WHERE id=$8 AND tenant_id=$9`,
		req.Baslik, req.Tur, req.Tutar, req.Bitis, req.Aciklama, req.MusteriID, req.Durum, id, tid)
	if err != nil { writeError(w, 500, "failed"); return }
	writeJSON(w, 200, models.SuccessResponse{Success:true,Message:"updated"})
}

func (h *ContractsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context()); id, _ := strconv.Atoi(chi.URLParam(r,"id"))
	h.DB.Exec(r.Context(), `DELETE FROM contracts WHERE id=$1 AND tenant_id=$2`, id, tid)
	writeJSON(w, 200, models.SuccessResponse{Success:true,Message:"deleted"})
}
