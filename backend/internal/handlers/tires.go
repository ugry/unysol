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

type TiresHandler struct{ DB *pgxpool.Pool }

func (h *TiresHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *TiresHandler) List(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `
		SELECT t.id, t.lastik_no, t.pozisyon, t.marka, t.model, t.takilma_tarihi, t.takilma_km, t.son_durum, COALESCE(tr.plaka,'')
		FROM tire_records t LEFT JOIN trucks tr ON tr.id=t.truck_id
		WHERE t.tenant_id=$1 ORDER BY t.created_at DESC`, tid)
	if err != nil { writeError(w, 500, "failed"); return }
	defer rows.Close()
	var data []map[string]interface{}
	for rows.Next() {
		var id, km int; var no, poz, marka, model, durum, plaka string; var tdate time.Time
		if err := rows.Scan(&id, &no, &poz, &marka, &model, &tdate, &km, &durum, &plaka); err != nil {
			continue
		}
		data = append(data, map[string]interface{}{
			"id": id, "lastik_no": no, "pozisyon": poz, "marka": marka, "model": model,
			"takilma_tarihi": tdate.Format("2006-01-02"), "takilma_km": km, "son_durum": durum, "plaka": plaka,
		})
	}
	if data == nil { data = []map[string]interface{}{} }
	writeJSON(w, 200, models.APIResponse{Success: true, Data: data})
}

func (h *TiresHandler) Create(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	var req struct {
		TruckID      int    `json:"truck_id"`
		LastikNo     string `json:"lastik_no"`
		Pozisyon     string `json:"pozisyon"`
		Marka        string `json:"marka"`
		Model        string `json:"model"`
		TakilmaTarihi string `json:"takilma_tarihi"`
		TakilmaKm    int    `json:"takilma_km"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, 400, "invalid body"); return
	}
	if req.TakilmaTarihi == "" { req.TakilmaTarihi = time.Now().Format("2006-01-02") }

	var id int
	err := h.DB.QueryRow(r.Context(), `
		INSERT INTO tire_records (tenant_id, truck_id, lastik_no, pozisyon, marka, model, takilma_tarihi, takilma_km)
		VALUES ($1, NULLIF($2,0), $3, $4, $5, $6, $7, $8) RETURNING id`,
		tid, req.TruckID, req.LastikNo, req.Pozisyon, req.Marka, req.Model, req.TakilmaTarihi, req.TakilmaKm).Scan(&id)
	if err != nil { slog.Error("tire create failed", "error", err); writeError(w, 500, "failed to create"); return }
	writeJSON(w, 201, map[string]interface{}{"id": id, "success": true})
}

func (h *TiresHandler) Update(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		LastikNo  string `json:"lastik_no"`
		Pozisyon  string `json:"pozisyon"`
		Marka     string `json:"marka"`
		Model     string `json:"model"`
		TakilmaKm int    `json:"takilma_km"`
		SonDurum  string `json:"son_durum"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	h.DB.Exec(r.Context(), `
		UPDATE tire_records SET lastik_no=COALESCE(NULLIF($1,''),lastik_no), pozisyon=COALESCE(NULLIF($2,''),pozisyon),
		marka=COALESCE(NULLIF($3,''),marka), model=COALESCE(NULLIF($4,''),model),
		takilma_km=CASE WHEN $5>0 THEN $5 ELSE takilma_km END,
		son_durum=COALESCE(NULLIF($6,''),son_durum) WHERE id=$7 AND tenant_id=$8`,
		req.LastikNo, req.Pozisyon, req.Marka, req.Model, req.TakilmaKm, req.SonDurum, id, tid)
	writeJSON(w, 200, models.SuccessResponse{Success: true})
}

func (h *TiresHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tid := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.DB.Exec(r.Context(), `DELETE FROM tire_records WHERE id=$1 AND tenant_id=$2`, id, tid)
	writeJSON(w, 200, models.SuccessResponse{Success: true, Message: "deleted"})
}
