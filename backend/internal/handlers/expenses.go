package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

type ExpensesHandler struct {
	DB *pgxpool.Pool
}

func (h *ExpensesHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Use(middleware.RequireTenant)
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Get("/{id}", h.Get)
	r.Put("/{id}", h.Update)
	r.Delete("/{id}", h.Delete)
	return r
}

func (h *ExpensesHandler) List(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	kategori := strings.ToUpper(r.URL.Query().Get("kategori"))

	query := `SELECT id, tenant_id, truck_id, kategori, tutar, aciklama, tarih, plaka, fatura_no, odeme_durumu, created_at
		FROM expenses WHERE tenant_id = $1`
	args := []interface{}{tenantID}
	argIdx := 2

	if kategori != "" {
		query += " AND kategori = $" + strconv.Itoa(argIdx)
		args = append(args, kategori)
		argIdx++
	}

	query += " ORDER BY tarih DESC LIMIT 500"

	rows, err := h.DB.Query(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to list expenses", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list expenses")
		return
	}
	defer rows.Close()

	expenses := make([]models.Expense, 0)
	for rows.Next() {
		var e models.Expense
		var tarihOut time.Time
		if err := rows.Scan(&e.ID, &e.TenantID, &e.TruckID, &e.Kategori, &e.Tutar,
			&e.Aciklama, &tarihOut, &e.Plaka, &e.FaturaNo, &e.OdemeDurumu, &e.CreatedAt); err != nil {
			slog.Error("failed to scan expense", "error", err)
			continue
		}
		e.Tarih = tarihOut.Format("2006-01-02")
		expenses = append(expenses, e)
	}

	writeJSON(w, http.StatusOK, expenses)
}

func (h *ExpensesHandler) Create(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req models.ExpenseCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Kategori == "" {
		writeError(w, http.StatusBadRequest, "kategori is required")
		return
	}
	if req.Tutar <= 0 {
		writeError(w, http.StatusBadRequest, "tutar must be positive")
		return
	}

	tarih, err := time.Parse("2006-01-02", req.Tarih)
	if err != nil {
		tarih = time.Now()
	}

	var e models.Expense
	var tarihOut time.Time
	var truckID *int
	if req.TruckID > 0 {
		truckID = &req.TruckID
	}
	err = h.DB.QueryRow(r.Context(),
		`INSERT INTO expenses (tenant_id, truck_id, kategori, tutar, aciklama, tarih, plaka, fatura_no, odeme_durumu)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'odendi')
		 RETURNING id, tenant_id, truck_id, kategori, tutar, aciklama, tarih, plaka, fatura_no, odeme_durumu, created_at`,
		tenantID, truckID, strings.ToUpper(req.Kategori), req.Tutar, req.Aciklama, tarih, req.Plaka, req.FaturaNo,
	).Scan(&e.ID, &e.TenantID, &e.TruckID, &e.Kategori, &e.Tutar,
		&e.Aciklama, &tarihOut, &e.Plaka, &e.FaturaNo, &e.OdemeDurumu, &e.CreatedAt)
	if err != nil {
		slog.Error("failed to create expense", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create expense")
		return
	}

	e.Tarih = tarihOut.Format("2006-01-02")
	writeJSON(w, http.StatusCreated, e)
}

func (h *ExpensesHandler) Get(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var e models.Expense
	var tarihOut time.Time
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, tenant_id, truck_id, kategori, tutar, aciklama, tarih, plaka, fatura_no, odeme_durumu, created_at
		 FROM expenses WHERE id = $1 AND tenant_id = $2`, id, tenantID,
	).Scan(&e.ID, &e.TenantID, &e.TruckID, &e.Kategori, &e.Tutar,
		&e.Aciklama, &tarihOut, &e.Plaka, &e.FaturaNo, &e.OdemeDurumu, &e.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "expense not found")
		return
	}

	e.Tarih = tarihOut.Format("2006-01-02")
	writeJSON(w, http.StatusOK, e)
}

func (h *ExpensesHandler) Update(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req models.ExpenseCreate
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	var tarih *time.Time
	if req.Tarih != "" {
		if parsed, err := time.Parse("2006-01-02", req.Tarih); err == nil {
			tarih = &parsed
		}
	}

	var e models.Expense
	var tarihOut time.Time
	err = h.DB.QueryRow(r.Context(),
		`UPDATE expenses SET
		 truck_id = COALESCE(NULLIF($1, 0), truck_id),
		 kategori = COALESCE(NULLIF($2, ''), kategori::text)::expense_kategori_enum,
		 tutar = COALESCE(NULLIF($3, 0), tutar),
		 aciklama = COALESCE(NULLIF($4, ''), aciklama),
		 tarih = COALESCE($5, tarih),
		 plaka = COALESCE(NULLIF($6, ''), plaka),
		 fatura_no = COALESCE(NULLIF($7, ''), fatura_no)
		 WHERE id = $8 AND tenant_id = $9
		 RETURNING id, tenant_id, truck_id, kategori, tutar, aciklama, tarih, plaka, fatura_no, odeme_durumu, created_at`,
		req.TruckID, strings.ToUpper(req.Kategori), req.Tutar, req.Aciklama, tarih, req.Plaka, req.FaturaNo, id, tenantID,
	).Scan(&e.ID, &e.TenantID, &e.TruckID, &e.Kategori, &e.Tutar,
		&e.Aciklama, &tarihOut, &e.Plaka, &e.FaturaNo, &e.OdemeDurumu, &e.CreatedAt)
	if err != nil {
		slog.Error("failed to update expense", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to update expense")
		return
	}

	e.Tarih = tarihOut.Format("2006-01-02")
	writeJSON(w, http.StatusOK, e)
}

func (h *ExpensesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`DELETE FROM expenses WHERE id = $1 AND tenant_id = $2`, id, tenantID)
	if err != nil {
		slog.Error("failed to delete expense", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to delete expense")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "expense not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Success: true, Message: "expense deleted"})
}
