package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type PayslipsHandler struct{ DB *pgxpool.Pool }

func (h *PayslipsHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *PayslipsHandler) List(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `
		SELECT p.id, p.donem, p.brut_maas, p.sgk_kesinti, p.vergi_kesinti, p.diger_kesinti, p.net_maas, p.aciklama,
			COALESCE(p.employee_id,0), COALESCE(e.ad_soyad,'')
		FROM payslips p LEFT JOIN employees e ON e.id=p.employee_id
		WHERE p.tenant_id=$1 ORDER BY p.donem DESC, p.created_at DESC`, tid)
	if err != nil { writeError(w, 500, "failed"); return }
	defer rows.Close()
	var data []map[string]interface{}
	for rows.Next() {
		var id, eid int; var donem, aciklama, ad string; var brut, sgk, vergi, diger, net float64
		if err := rows.Scan(&id, &donem, &brut, &sgk, &vergi, &diger, &net, &aciklama, &eid, &ad); err != nil { continue }
		data = append(data, map[string]interface{}{
			"id": id, "donem": donem, "brut_maas": brut, "sgk_kesinti": sgk, "vergi_kesinti": vergi,
			"diger_kesinti": diger, "net_maas": net, "aciklama": aciklama, "employee_id": eid, "employee_name": ad,
		})
	}
	if data == nil { data = []map[string]interface{}{} }
	writeJSON(w, 200, models.APIResponse{Success: true, Data: data})
}

func (h *PayslipsHandler) Create(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	var req struct {
		EmployeeID   int     `json:"employee_id"`
		Donem        string  `json:"donem"`
		BrutMaas     float64 `json:"brut_maas"`
		SgkKesinti   float64 `json:"sgk_kesinti"`
		VergiKesinti float64 `json:"vergi_kesinti"`
		DigerKesinti float64 `json:"diger_kesinti"`
		Aciklama     string  `json:"aciklama"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Donem == "" {
		writeError(w, 400, "donem zorunludur"); return
	}
	net := req.BrutMaas - req.SgkKesinti - req.VergiKesinti - req.DigerKesinti

	var id int
	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO payslips (tenant_id, employee_id, donem, brut_maas, sgk_kesinti, vergi_kesinti, diger_kesinti, net_maas, aciklama)
		VALUES ($1, NULLIF($2,0), $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
		tid, req.EmployeeID, req.Donem, req.BrutMaas, req.SgkKesinti, req.VergiKesinti, req.DigerKesinti, net, req.Aciklama).Scan(&id)
	if err != nil { writeError(w, 500, "failed to create"); return }
	writeJSON(w, 201, map[string]interface{}{"id": id, "net_maas": net, "success": true})
}

func (h *PayslipsHandler) Update(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		BrutMaas     float64 `json:"brut_maas"`
		SgkKesinti   float64 `json:"sgk_kesinti"`
		VergiKesinti float64 `json:"vergi_kesinti"`
		DigerKesinti float64 `json:"diger_kesinti"`
		Aciklama     string  `json:"aciklama"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	net := req.BrutMaas - req.SgkKesinti - req.VergiKesinti - req.DigerKesinti
	h.DB.Exec(r.Context(), `
		UPDATE payslips SET brut_maas=$1, sgk_kesinti=$2, vergi_kesinti=$3, diger_kesinti=$4, net_maas=$5, aciklama=$6
		WHERE id=$7 AND tenant_id=$8`,
		req.BrutMaas, req.SgkKesinti, req.VergiKesinti, req.DigerKesinti, net, req.Aciklama, id, tid)
	writeJSON(w, 200, models.SuccessResponse{Success: true})
}

func (h *PayslipsHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.DB.Exec(r.Context(), `DELETE FROM payslips WHERE id=$1 AND tenant_id=$2`, id, tid)
	writeJSON(w, 200, models.SuccessResponse{Success: true, Message: "deleted"})
}
