package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
)

type TrailerHandler struct{ DB *pgxpool.Pool }

func (h *TrailerHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *TrailerHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	rows, err := h.DB.Query(r.Context(), `SELECT id, tenant_id, plaka, COALESCE(marka,''), COALESCE(model,''), COALESCE(yil,0), COALESCE(tip,'TENTELI_PERDELI'), COALESCE(muayene_bitis::text,''), COALESCE(aktif,true), created_at FROM trailers WHERE tenant_id=$1 ORDER BY id DESC LIMIT 500`, tenantID)
	if err != nil { slog.Error("trailers list failed", "error", err); writeError(w, 500, "Dorse listesi yüklenemedi"); return }
	defer rows.Close()
	result := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id, tid, yil int; var plaka, marka, model, tip, muayene string; var aktif bool; var created interface{}
		if err := rows.Scan(&id, &tid, &plaka, &marka, &model, &yil, &tip, &muayene, &aktif, &created); err != nil {
			slog.Error("trailers scan failed", "error", err)
			continue
		}
		result = append(result, map[string]interface{}{"id": id, "tenant_id": tid, "plaka": plaka, "marka": marka, "model": model, "yil": yil, "tip": tip, "muayene_bitis": muayene, "aktif": aktif})
	}
	writeJSON(w, 200, result)
}

func (h *TrailerHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	var req struct {
		Plaka string `json:"plaka"`
		Marka string `json:"marka"`
		Model string `json:"model"`
		Yil   int    `json:"yil"`
		Tip   string `json:"tip"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	if req.Plaka == "" { writeError(w, 400, "Plaka zorunludur"); return }
	if req.Tip == "" { req.Tip = "TENTELI_PERDELI" }
	var id int
	err := h.DB.QueryRow(r.Context(), `INSERT INTO trailers (tenant_id, plaka, marka, model, yil, tip) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, tenantID, req.Plaka, req.Marka, req.Model, req.Yil, req.Tip).Scan(&id)
	if err != nil { slog.Error("trailer create failed", "error", err); writeError(w, 500, "Dorse oluşturulamadı"); return }
	writeJSON(w, 201, map[string]interface{}{"id": id, "plaka": req.Plaka})
}

func (h *TrailerHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	var req struct {
		Plaka        string `json:"plaka"`
		Marka        string `json:"marka"`
		Model        string `json:"model"`
		Tip          string `json:"tip"`
		MuayeneBitis string `json:"muayene_bitis"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	_, err := h.DB.Exec(r.Context(), `UPDATE trailers SET plaka=COALESCE(NULLIF($3,''),plaka), marka=COALESCE(NULLIF($4,''),marka), model=COALESCE(NULLIF($5,''),model), tip=COALESCE(NULLIF($6,''),tip) WHERE id=$1 AND tenant_id=$2`, id, tenantID, req.Plaka, req.Marka, req.Model, req.Tip)
	if err != nil { writeError(w, 404, "Kayıt bulunamadı"); return }
	writeJSON(w, 200, map[string]string{"status": "updated"})
}

func (h *TrailerHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, _ := strconv.Atoi(chi.URLParam(r, "id"))
	h.DB.Exec(r.Context(), `DELETE FROM trailers WHERE id=$1 AND tenant_id=$2`, id, tenantID)
	writeJSON(w, 200, map[string]string{"status": "deleted"})
}
