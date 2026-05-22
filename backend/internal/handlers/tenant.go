package handlers

import (
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TenantHandler struct {
	DB *pgxpool.Pool
}

func (h *TenantHandler) List(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "tenant list"})
}

func (h *TenantHandler) Get(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "tenant get"})
}

func (h *TenantHandler) Update(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"message": "tenant update"})
}
