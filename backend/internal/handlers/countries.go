package handlers

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/models"
)

type CountriesHandler struct {
	DB *pgxpool.Pool
}

func (h *CountriesHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/", h.List)
	r.Post("/", h.Create)
	r.Put("/{code}", h.Update)
	r.Get("/{code}/configs", h.GetConfigs)
	r.Put("/{code}/configs", h.UpdateConfigs)
	return r
}

func (h *CountriesHandler) List(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT id, code, name, default_locale, currency, aktif, created_at
		 FROM countries ORDER BY name`)
	if err != nil {
		slog.Error("failed to list countries", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list countries")
		return
	}
	defer rows.Close()

	countries := make([]models.Country, 0)
	for rows.Next() {
		var c models.Country
		if err := rows.Scan(&c.ID, &c.Code, &c.Name, &c.DefaultLocale,
			&c.Currency, &c.Aktif, &c.CreatedAt); err != nil {
			slog.Error("failed to scan country", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan country")
			return
		}
		countries = append(countries, c)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, countries)
}

func (h *CountriesHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateCountryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Code == "" || req.Name == "" {
		writeError(w, http.StatusBadRequest, "code and name are required")
		return
	}

	var country models.Country
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO countries (code, name, default_locale, currency)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, code, name, default_locale, currency, aktif, created_at`,
		req.Code, req.Name, req.DefaultLocale, req.Currency,
	).Scan(&country.ID, &country.Code, &country.Name, &country.DefaultLocale,
		&country.Currency, &country.Aktif, &country.CreatedAt)
	if err != nil {
		slog.Error("failed to create country", "error", err, "code", req.Code)
		writeError(w, http.StatusInternalServerError, "failed to create country")
		return
	}

	writeJSON(w, http.StatusCreated, country)
}

func (h *CountriesHandler) Update(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var req models.UpdateCountryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	query := `UPDATE countries SET updated_at = $1`
	args := []interface{}{time.Now()}
	argIdx := 2
	updates := false

	if req.Name != nil {
		query += `, name = $` + strconv.Itoa(argIdx)
		args = append(args, *req.Name)
		argIdx++
		updates = true
	}
	if req.Currency != nil {
		query += `, currency = $` + strconv.Itoa(argIdx)
		args = append(args, *req.Currency)
		argIdx++
		updates = true
	}
	if req.DefaultLocale != nil {
		query += `, default_locale = $` + strconv.Itoa(argIdx)
		args = append(args, *req.DefaultLocale)
		argIdx++
		updates = true
	}
	if req.Aktif != nil {
		query += `, aktif = $` + strconv.Itoa(argIdx)
		args = append(args, *req.Aktif)
		argIdx++
		updates = true
	}

	if !updates {
		writeError(w, http.StatusBadRequest, "no fields to update")
		return
	}

	query += ` WHERE code = $` + strconv.Itoa(argIdx)
	args = append(args, code)

	tag, err := h.DB.Exec(r.Context(), query, args...)
	if err != nil {
		slog.Error("failed to update country", "error", err, "code", code)
		writeError(w, http.StatusInternalServerError, "failed to update country")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "country not found")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "country updated"})
}

func (h *CountriesHandler) GetConfigs(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	rows, err := h.DB.Query(r.Context(),
		`SELECT id, country_code, config_key, config_value, description, created_at, updated_at
		 FROM country_configs WHERE country_code = $1 ORDER BY config_key`, code)
	if err != nil {
		slog.Error("failed to get country configs", "error", err, "code", code)
		writeError(w, http.StatusInternalServerError, "failed to get country configs")
		return
	}
	defer rows.Close()

	configs := make([]models.CountryConfig, 0)
	for rows.Next() {
		var c models.CountryConfig
		if err := rows.Scan(&c.ID, &c.CountryCode, &c.ConfigKey, &c.ConfigValue,
			&c.Description, &c.CreatedAt, &c.UpdatedAt); err != nil {
			slog.Error("failed to scan country config", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan country config")
			return
		}
		configs = append(configs, c)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, configs)
}

func (h *CountriesHandler) UpdateConfigs(w http.ResponseWriter, r *http.Request) {
	code := chi.URLParam(r, "code")

	var req struct {
		Configs []models.CountryConfigEntry `json:"configs"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(req.Configs) == 0 {
		writeError(w, http.StatusBadRequest, "configs array is required")
		return
	}

	tx, err := h.DB.Begin(r.Context())
	if err != nil {
		slog.Error("failed to begin transaction", "error", err)
		writeError(w, http.StatusInternalServerError, "database error")
		return
	}
	defer tx.Rollback(r.Context())

	for _, cfg := range req.Configs {
		_, err := tx.Exec(r.Context(),
			`INSERT INTO country_configs (country_code, config_key, config_value, description)
			 VALUES ($1, $2, $3, $4)
			 ON CONFLICT (country_code, config_key) DO UPDATE SET
				config_value = $3, description = $4, updated_at = $5`,
			code, cfg.ConfigKey, cfg.ConfigValue, cfg.Description, time.Now())
		if err != nil {
			slog.Error("failed to upsert country config", "error", err, "code", code, "key", cfg.ConfigKey)
			writeError(w, http.StatusInternalServerError, "failed to update configs")
			return
		}
	}

	if err := tx.Commit(r.Context()); err != nil {
		slog.Error("failed to commit transaction", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to commit configs update")
		return
	}

	writeJSON(w, http.StatusOK, models.SuccessResponse{Message: "configs updated"})
}
