package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"

	"unysol/internal/middleware"
)

type UserManagementHandler struct {
	DB *pgxpool.Pool
}

type PermissionEntry struct {
	ModuleKey string `json:"module_key"`
	CanView   bool   `json:"can_view"`
	CanCreate bool   `json:"can_create"`
	CanEdit   bool   `json:"can_edit"`
	CanDelete bool   `json:"can_delete"`
}

func (h *UserManagementHandler) Routes() chi.Router {
	r := chi.NewRouter()
	r.Get("/permissions/{userId}", h.GetPermissions)
	r.Put("/permissions/{userId}", h.SavePermissions)
	r.Post("/", h.CreateUser)
	r.Delete("/{id}", h.DeleteUser)
	return r
}

func (h *UserManagementHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())

	var req struct {
		AdSoyad  string `json:"ad_soyad"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Rol      string `json:"rol"`
		Telefon  string `json:"telefon"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}
	if req.AdSoyad == "" || req.Email == "" || req.Password == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Ad soyad, e-posta ve şifre zorunludur"})
		return
	}
	if req.Rol == "" {
		req.Rol = "DRIVER"
	}

	hash, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)

	var userID int
	tid, _ := strconv.Atoi(tenantID)
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif)
		 VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
		tid, req.Email, string(hash), req.AdSoyad, req.Rol, req.Telefon,
	).Scan(&userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Kullanıcı oluşturulamadı. E-posta zaten kayıtlı olabilir."})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"id":       userID,
		"ad_soyad": req.AdSoyad,
		"email":    req.Email,
		"rol":      req.Rol,
	})
}

func (h *UserManagementHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := chi.URLParam(r, "id")

	_, err := h.DB.Exec(r.Context(),
		`DELETE FROM users WHERE id=$1 AND tenant_id=$2 AND rol != 'TENANT_OWNER'`,
		userID, tenantID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Kullanıcı bulunamadı veya silinemez"})
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"status": "deleted"})
}

func (h *UserManagementHandler) GetPermissions(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := chi.URLParam(r, "userId")

	// Get all modules
	modRows, _ := h.DB.Query(r.Context(),
		`SELECT module_key, module_name, category FROM modules ORDER BY category, module_key`)
	defer modRows.Close()

	perms := make([]map[string]interface{}, 0)
	for modRows.Next() {
		var key, name, cat string
		modRows.Scan(&key, &name, &cat)
		perm := map[string]interface{}{
			"module_key":  key,
			"module_name": name,
			"category":    cat,
			"can_view":    true,
			"can_create":  false,
			"can_edit":    false,
			"can_delete":  false,
		}
		perms = append(perms, perm)
	}

	// Load existing permissions for this user
	permRows, _ := h.DB.Query(r.Context(),
		`SELECT module_key, can_view, can_create, can_edit, can_delete
		 FROM user_permissions WHERE tenant_id=$1 AND user_id=$2`, tenantID, userID)

	for permRows.Next() {
		var key string
		var v, c, e, d bool
		permRows.Scan(&key, &v, &c, &e, &d)
		for _, p := range perms {
			if p["module_key"] == key {
				p["can_view"] = v
				p["can_create"] = c
				p["can_edit"] = e
				p["can_delete"] = d
			}
		}
	}
	permRows.Close()

	writeJSON(w, http.StatusOK, perms)
}

func (h *UserManagementHandler) SavePermissions(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.GetTenantID(r.Context())
	userID := chi.URLParam(r, "userId")

	var perms []PermissionEntry
	if err := json.NewDecoder(r.Body).Decode(&perms); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Geçersiz istek"})
		return
	}

	for _, p := range perms {
		_, _ = h.DB.Exec(r.Context(),
			`INSERT INTO user_permissions (tenant_id, user_id, module_key, can_view, can_create, can_edit, can_delete)
			 VALUES ($1,$2,$3,$4,$5,$6,$7)
			 ON CONFLICT (user_id, module_key) DO UPDATE SET
			 can_view=$4, can_create=$5, can_edit=$6, can_delete=$7`,
			tenantID, userID, p.ModuleKey, p.CanView, p.CanCreate, p.CanEdit, p.CanDelete)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "message": "İzinler kaydedildi"})
}

func (h *UserManagementHandler) GetAllPermissions(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	role := middleware.GetRole(r.Context())

	// TENANT_OWNER has all permissions
	if role == "TENANT_OWNER" {
		writeJSON(w, http.StatusOK, map[string]interface{}{"role": "TENANT_OWNER", "all_access": true})
		return
	}

	rows, err := h.DB.Query(r.Context(),
		`SELECT module_key, can_view, can_create, can_edit, can_delete
		 FROM user_permissions WHERE user_id=$1`, userID)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]interface{}{"permissions": []PermissionEntry{}})
		return
	}
	defer rows.Close()

	perms := make([]PermissionEntry, 0)
	for rows.Next() {
		var p PermissionEntry
		rows.Scan(&p.ModuleKey, &p.CanView, &p.CanCreate, &p.CanEdit, &p.CanDelete)
		perms = append(perms, p)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"role":        role,
		"all_access":  false,
		"permissions": perms,
	})
}
