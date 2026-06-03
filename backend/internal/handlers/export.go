package handlers

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type ExportHandler struct {
	DB *pgxpool.Pool
}

func (h *ExportHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant(h.DB))
	r.Get("/{module}", h.Export)
	return r
}

func (h *ExportHandler) Export(w http.ResponseWriter, r *http.Request) {
	module := chi.URLParam(r, "module")
	tenantID := middleware.GetTenantID(r.Context())

	type exportRow struct {
		Column string `json:"column"`
	}

	switch module {
	case "trucks":
		rows, err := h.DB.Query(r.Context(),
			"SELECT plaka, marka, model, yil, tracking_source FROM trucks WHERE tenant_id=$1", tenantID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "export failed")
			return
		}
		defer rows.Close()
		var data []map[string]interface{}
		for rows.Next() {
			var plaka, marka, model, ts string
			var yil int
			rows.Scan(&plaka, &marka, &model, &yil, &ts)
			data = append(data, map[string]interface{}{
				"plaka": plaka, "marka": marka, "model": model,
				"yil": yil, "tracking_source": ts,
			})
		}
		writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})

	case "customers":
		rows, err := h.DB.Query(r.Context(),
			"SELECT firma_unvani, telefon, vergi_dairesi, vergi_no FROM customers WHERE tenant_id=$1", tenantID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "export failed")
			return
		}
		defer rows.Close()
		var data []map[string]interface{}
		for rows.Next() {
			var unvan, telefon, vd, vn string
			rows.Scan(&unvan, &telefon, &vd, &vn)
			data = append(data, map[string]interface{}{
				"firma_unvani": unvan, "telefon": telefon,
				"vergi_dairesi": vd, "vergi_no": vn,
			})
		}
		writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})

	case "expenses":
		rows, err := h.DB.Query(r.Context(),
			"SELECT kategori::text, tarih, tutar, aciklama FROM expenses WHERE tenant_id=$1 ORDER BY tarih DESC", tenantID)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "export failed")
			return
		}
		defer rows.Close()
		var data []map[string]interface{}
		for rows.Next() {
			var kategori, aciklama string
			var tarih string
			var tutar float64
			rows.Scan(&kategori, &tarih, &tutar, &aciklama)
			data = append(data, map[string]interface{}{
				"kategori": kategori, "tarih": tarih,
				"tutar": tutar, "aciklama": aciklama,
			})
		}
		writeJSON(w, http.StatusOK, models.APIResponse{Success: true, Data: data})

	default:
		writeError(w, http.StatusBadRequest, "unknown module for export")
	}
}
