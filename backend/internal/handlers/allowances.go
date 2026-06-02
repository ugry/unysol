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
	"unysol/internal/models"
)

type AllowanceHandler struct{ DB *pgxpool.Pool }

func (h *AllowanceHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *AllowanceHandler) List(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `
		SELECT a.id, a.tutar, a.tarih, a.aciklama, COALESCE(a.employee_id,0), COALESCE(e.ad_soyad,'')
		FROM driver_allowances a LEFT JOIN employees e ON e.id=a.employee_id
		WHERE a.tenant_id=$1 ORDER BY a.created_at DESC`, tid)
	if err != nil { writeError(w, 500, "failed"); return }
	defer rows.Close()
	var data []map[string]interface{}
	for rows.Next() {
		var id, eid int; var tutar float64; var ad, aciklama string; var t time.Time
		if err := rows.Scan(&id, &tutar, &t, &aciklama, &eid, &ad); err != nil { continue }
		data = append(data, map[string]interface{}{"id": id, "tutar": tutar, "tarih": t.Format("2006-01-02"), "aciklama": aciklama, "employee_id": eid, "employee_name": ad})
	}
	if data == nil { data = []map[string]interface{}{} }
	writeJSON(w, 200, models.APIResponse{Success: true, Data: data})
}

func (h *AllowanceHandler) Create(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	var req struct {
		EmployeeID int     `json:"employee_id"`
		Tutar      float64 `json:"tutar"`
		Tarih      string  `json:"tarih"`
		Aciklama   string  `json:"aciklama"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, 400, "invalid body"); return
	}
	if req.Tarih == "" { req.Tarih = time.Now().Format("2006-01-02") }

	var id int
	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO driver_allowances (tenant_id, employee_id, tutar, tarih, aciklama)
		VALUES ($1, NULLIF($2,0), $3, $4, $5) RETURNING id`,
		tid, req.EmployeeID, req.Tutar, req.Tarih, req.Aciklama).Scan(&id)
	if err != nil { slog.Error("allowance create failed", "error", err); writeError(w, 500, "failed to create"); return }
	writeJSON(w, 201, map[string]interface{}{"id": id})
}

func (h *AllowanceHandler) Update(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		Tutar    float64 `json:"tutar"`
		Tarih    string  `json:"tarih"`
		Aciklama string  `json:"aciklama"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	h.DB.Exec(r.Context(), `
		UPDATE driver_allowances SET tutar=$1, tarih=COALESCE(NULLIF($2,'')::date,tarih), aciklama=$3
		WHERE id=$4 AND tenant_id=$5`, req.Tutar, req.Tarih, req.Aciklama, id, tid)
	writeJSON(w, 200, models.SuccessResponse{Success: true})
}

func (h *AllowanceHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.DB.Exec(r.Context(), `DELETE FROM driver_allowances WHERE id=$1 AND tenant_id=$2`, id, tid)
	writeJSON(w, 200, models.SuccessResponse{Success: true, Message: "deleted"})
}
