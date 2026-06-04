package handlers

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"unysol/internal/logging"
	"unysol/internal/middleware"
	"unysol/internal/models"
)

type AdminHandler struct {
	DB *pgxpool.Pool
}

func (h *AdminHandler) DashboardSummary(w http.ResponseWriter, r *http.Request) {
	var total, active int
	_ = h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM tenants`).Scan(&total)
	_ = h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM tenants WHERE durum='AKTIF'`).Scan(&active)

	var mrr float64
	_ = h.DB.QueryRow(r.Context(), `SELECT COALESCE(SUM(ucret),0) FROM subscriptions WHERE plan!='FREE' AND status='AKTIF'`).Scan(&mrr)

	var newThisMonth int
	_ = h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM tenants WHERE created_at >= date_trunc('month', CURRENT_DATE)`).Scan(&newThisMonth)

	// Real package distribution from tenants table
	pkgRows, _ := h.DB.Query(r.Context(),
		`SELECT COALESCE(plan::text,'FREE'), COUNT(*) FROM tenants GROUP BY plan ORDER BY COUNT(*) DESC`)
	paketDagilimi := make([]map[string]interface{}, 0)
	if pkgRows != nil {
		defer pkgRows.Close()
		for pkgRows.Next() {
			var pkg string; var cnt int
			pkgRows.Scan(&pkg, &cnt)
			paketDagilimi = append(paketDagilimi, map[string]interface{}{"paket": pkg, "sayi": cnt})
		}
	}
	if len(paketDagilimi) == 0 {
		paketDagilimi = append(paketDagilimi, map[string]interface{}{"paket": "FREE", "sayi": total})
	}

	// Real recent registrations (last 5)
	recRows, _ := h.DB.Query(r.Context(),
		`SELECT firma_unvani, plan, created_at FROM tenants ORDER BY created_at DESC LIMIT 5`)
	sonKayitlar := make([]map[string]interface{}, 0)
	if recRows != nil {
		defer recRows.Close()
		for recRows.Next() {
			var unvan, plan string; var createdAt interface{}
			recRows.Scan(&unvan, &plan, &createdAt)
			sonKayitlar = append(sonKayitlar, map[string]interface{}{
				"firma": unvan, "plan": plan, "tarih": createdAt,
			})
		}
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"toplam_firma":      total,
		"aktif_firma":       active,
		"mrr":               mrr,
		"bu_ay_yeni_kayit":  newThisMonth,
		"paket_dagilimi":     paketDagilimi,
		"son_kayitlar":       sonKayitlar,
	})
}

func (h *AdminHandler) ListTenants(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT id, slug, firma_unvani, plan, locale, country_code, durum, created_at
		 FROM tenants ORDER BY id DESC`)
	if err != nil {
		slog.Error("failed to list tenants", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list tenants")
		return
	}
	defer rows.Close()

	tenants := make([]models.Tenant, 0)
	for rows.Next() {
		var t models.Tenant
		if err := rows.Scan(&t.ID, &t.Slug, &t.FirmaUnvani, &t.Plan, &t.Locale,
			&t.CountryCode, &t.Durum, &t.CreatedAt); err != nil {
			slog.Error("failed to scan tenant", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan tenant")
			return
		}
		tenants = append(tenants, t)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, tenants)
}

func (h *AdminHandler) GetTenant(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	var t models.Tenant
	err = h.DB.QueryRow(r.Context(),
		`SELECT id, slug, firma_unvani, plan, locale, country_code, durum, created_at
		 FROM tenants WHERE id = $1`, id).
		Scan(&t.ID, &t.Slug, &t.FirmaUnvani, &t.Plan, &t.Locale,
			&t.CountryCode, &t.Durum, &t.CreatedAt)
	if err != nil {
		slog.Error("failed to get tenant", "error", err, "id", id)
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	writeJSON(w, http.StatusOK, t)
}

func (h *AdminHandler) ChangePlan(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	var input struct {
		Plan string `json:"plan"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if input.Plan != "FREE" && input.Plan != "PRO" && input.Plan != "PREMIUM" {
		writeError(w, http.StatusBadRequest, "invalid plan: must be FREE, PRO, or PREMIUM")
		return
	}

	tag, err := h.DB.Exec(r.Context(),
		`UPDATE tenants SET plan = $1 WHERE id = $2`, input.Plan, id)
	if err != nil {
		slog.Error("failed to update tenant plan", "error", err, "id", id)
		writeError(w, http.StatusInternalServerError, "failed to update tenant plan")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	// Audit log
	h.DB.Exec(r.Context(), `INSERT INTO actions (tenant_id, user_id, action_type, table_name, record_id, summary) VALUES (0, $1, 'UPDATE', 'tenants', $2, $3)`,
		middleware.GetUserID(r.Context()), itoa(id), "Plan değiştirildi: "+input.Plan)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Plan güncellendi",
		"plan":    input.Plan,
	})
}

func (h *AdminHandler) SuspendTenant(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	var input struct {
		Durum string `json:"durum"`
	}
	json.NewDecoder(r.Body).Decode(&input)

	newDurum := "PASIF"
	if input.Durum == "AKTIF" {
		newDurum = "AKTIF"
	}

	tag, err := h.DB.Exec(r.Context(),
		`UPDATE tenants SET durum = $1 WHERE id = $2`, newDurum, id)
	if err != nil {
		slog.Error("failed to update tenant status", "error", err, "id", id)
		writeError(w, http.StatusInternalServerError, "failed to update tenant status")
		return
	}
	if tag.RowsAffected() == 0 {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	// Audit log
	h.DB.Exec(r.Context(), `INSERT INTO actions (tenant_id, user_id, action_type, table_name, record_id, summary) VALUES (0, $1, 'UPDATE', 'tenants', $2, $3)`,
		middleware.GetUserID(r.Context()), itoa(id), "Durum değiştirildi: "+newDurum)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Firma durumu güncellendi",
		"durum":   newDurum,
	})
}

func (h *AdminHandler) ListAuditLog(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT a.id, a.tenant_id, a.user_id, COALESCE(u.ad_soyad,''), a.action_type, a.table_name, a.record_id, a.summary, a.created_at
		 FROM actions a LEFT JOIN users u ON u.id=a.user_id
		 WHERE a.tenant_id=0 ORDER BY a.created_at DESC LIMIT 200`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Denetim kayıtları yüklenemedi")
		return
	}
	defer rows.Close()
	result := make([]map[string]interface{}, 0)
	for rows.Next() {
		var id, tid, uid int; var adSoyad, actionType, tableName, recordID, summary string; var createdAt interface{}
		rows.Scan(&id, &tid, &uid, &adSoyad, &actionType, &tableName, &recordID, &summary, &createdAt)
		result = append(result, map[string]interface{}{
			"id": id, "admin": adSoyad, "action": actionType,
			"table": tableName, "record_id": recordID, "summary": summary,
		})
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *AdminHandler) GetMRR(w http.ResponseWriter, r *http.Request) {
	var data models.MRRData
	err := h.DB.QueryRow(r.Context(),
		`SELECT COALESCE(SUM(ucret), 0), 'TRY', 'monthly'
		 FROM subscriptions
		 WHERE plan != 'FREE' AND status = 'AKTIF'`).
		Scan(&data.MRR, &data.Currency, &data.Period)
	if err != nil {
		slog.Error("failed to calculate MRR", "error", err)
		writeJSON(w, http.StatusInternalServerError, "failed to calculate MRR")
		return
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *AdminHandler) GetChurn(w http.ResponseWriter, r *http.Request) {
	var data models.ChurnData
	var total, active int
	_ = h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM tenants`).Scan(&total)
	_ = h.DB.QueryRow(r.Context(), `SELECT COUNT(*) FROM tenants WHERE durum != 'AKTIF'`).Scan(&active)
	
	data.Total = total
	data.Suspended = active
	if total > 0 {
		data.ChurnRate = float64(active) / float64(total) * 100
	} else {
		data.ChurnRate = 0
	}

	writeJSON(w, http.StatusOK, data)
}

func (h *AdminHandler) GetGrowth(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT to_char(created_at, 'YYYY-MM') AS period, COUNT(*) AS signups
		 FROM tenants
		 WHERE created_at >= (CURRENT_DATE - INTERVAL '12 months')
		 GROUP BY period ORDER BY period`)
	if err != nil {
		slog.Error("failed to query growth", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to query growth")
		return
	}
	defer rows.Close()

	growth := make([]models.GrowthData, 0)
	for rows.Next() {
		var g models.GrowthData
		if err := rows.Scan(&g.Period, &g.Signups); err != nil {
			slog.Error("failed to scan growth data", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan growth data")
			return
		}
		growth = append(growth, g)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, growth)
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.DB.Query(r.Context(),
		`SELECT id, tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif, last_login, created_at
		 FROM users ORDER BY id DESC`)
	if err != nil {
		slog.Error("failed to list users", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to list users")
		return
	}
	defer rows.Close()

	users := make([]models.User, 0)
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.TenantID, &u.Email, &u.PasswordHash, &u.AdSoyad,
			&u.Rol, &u.Telefon, &u.Aktif, &u.LastLogin, &u.CreatedAt); err != nil {
			slog.Error("failed to scan user", "error", err)
			writeError(w, http.StatusInternalServerError, "failed to scan user")
			return
		}
		users = append(users, u)
	}

	if err := rows.Err(); err != nil {
		slog.Error("rows iteration error", "error", err)
		writeError(w, http.StatusInternalServerError, "rows iteration error")
		return
	}

	writeJSON(w, http.StatusOK, users)
}

func (h *AdminHandler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.AdSoyad == "" {
		writeError(w, http.StatusBadRequest, "email, password, and ad_soyad are required")
		return
	}

	var user models.User
	err := h.DB.QueryRow(r.Context(),
		`INSERT INTO users (tenant_id, email, password_hash, ad_soyad, rol, telefon)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING id, tenant_id, email, password_hash, ad_soyad, rol, telefon, aktif, last_login, created_at`,
		req.TenantID, req.Email, req.Password, req.AdSoyad, req.Rol, req.Telefon,
	).Scan(&user.ID, &user.TenantID, &user.Email, &user.PasswordHash, &user.AdSoyad,
		&user.Rol, &user.Telefon, &user.Aktif, &user.LastLogin, &user.CreatedAt)
	if err != nil {
		slog.Error("failed to create user", "error", err)
		writeError(w, http.StatusInternalServerError, "failed to create user")
		return
	}

	writeJSON(w, http.StatusCreated, user)
}

func (h *AdminHandler) ExportTenant(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	var tenantName string
	err = h.DB.QueryRow(r.Context(), `SELECT firma_unvani FROM tenants WHERE id=$1`, id).Scan(&tenantName)
	if err != nil {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	buf, zipErr := exportTenantData(h.DB, r, id, tenantName)
	if zipErr != nil {
		slog.Error("failed to export tenant data", "error", zipErr, "tenant_id", id)
		writeError(w, http.StatusInternalServerError, "failed to export tenant data")
		return
	}
	w.Header().Set("Content-Type", "application/zip")
	w.Header().Set("Content-Disposition", "attachment; filename="+safeFilename(tenantName)+".zip")
	w.Header().Set("Content-Length", strconv.Itoa(buf.Len()))
	w.WriteHeader(http.StatusOK)
	w.Write(buf.Bytes())
}

func (h *AdminHandler) DeleteTenant(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid tenant id")
		return
	}

	var tenantName string
	err = h.DB.QueryRow(r.Context(), `SELECT firma_unvani FROM tenants WHERE id=$1`, id).Scan(&tenantName)
	if err != nil {
		writeError(w, http.StatusNotFound, "tenant not found")
		return
	}

	export := r.URL.Query().Get("export") == "true"

	if export {
		buf, zipErr := exportTenantData(h.DB, r, id, tenantName)
		if zipErr != nil {
			slog.Error("failed to export tenant data", "error", zipErr, "tenant_id", id)
			writeError(w, http.StatusInternalServerError, "failed to export tenant data")
			return
		}
		w.Header().Set("Content-Type", "application/zip")
		w.Header().Set("Content-Disposition", "attachment; filename="+safeFilename(tenantName)+".zip")
		w.WriteHeader(http.StatusOK)
		w.Write(buf.Bytes())
		return
	}

	tables := []struct {
		name  string
		col   string
	}{
		{"invoice_payments", "invoice_id IN (SELECT id FROM invoices WHERE tenant_id=$1)"},
		{"invoice_items", "invoice_id IN (SELECT id FROM invoices WHERE tenant_id=$1)"},
		{"e_fatura_logs", "invoice_id IN (SELECT id FROM invoices WHERE tenant_id=$1)"},
		{"invoice_recurrences", "tenant_id"},
		{"driver_leave", "tenant_id"},
		{"payslips", "tenant_id"},
		{"driver_allowances", "tenant_id"},
		{"fuel_logs", "tenant_id"},
		{"toll_logs", "tenant_id"},
		{"maintenance_records", "tenant_id"},
		{"tire_records", "tenant_id"},
		{"cek_senet", "tenant_id"},
		{"expenses", "tenant_id"},
		{"trips", "tenant_id"},
		{"load_board", "tenant_id"},
		{"proposals", "tenant_id"},
		{"contracts", "tenant_id"},
		{"notifications", "tenant_id"},
		{"predictions", "tenant_id"},
		{"settings", "tenant_id"},
		{"actions", "tenant_id"},
		{"password_resets", "tenant_id"},
		{"user_permissions", "tenant_id"},
		{"tenant_modules", "tenant_id"},
		{"customers", "tenant_id"},
		{"trailers", "tenant_id"},
		{"trucks", "tenant_id"},
		{"employees", "tenant_id"},
		{"users", "tenant_id"},
		{"invoices", "tenant_id"},
		{"subscriptions", "tenant_id"},
	}

	for _, t := range tables {
		_, err := h.DB.Exec(r.Context(), "DELETE FROM "+t.name+" WHERE "+t.col, id)
		if err != nil {
			slog.Warn("delete tenant cascade", "table", t.name, "error", err)
		}
	}

	if _, err = h.DB.Exec(r.Context(), `DELETE FROM tenants WHERE id=$1`, id); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete tenant")
		return
	}

	logging.Auth(logging.LevelInfo, "tenant deleted", "0", strconv.Itoa(id), middleware.GetUserID(r.Context()), r.RemoteAddr,
		map[string]interface{}{"tenant_name": tenantName, "exported": false})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Firma ve tüm verileri silindi",
	})
}

func exportTenantData(db *pgxpool.Pool, r *http.Request, tenantID int, tenantName string) (*bytes.Buffer, error) {
	buf := new(bytes.Buffer)
	zw := zip.NewWriter(buf)

	tables := map[string]string{
		"tenants":           "SELECT * FROM tenants WHERE id=$1",
		"users":             "SELECT * FROM users WHERE tenant_id=$1",
		"trucks":            "SELECT * FROM trucks WHERE tenant_id=$1",
		"trailers":          "SELECT * FROM trailers WHERE tenant_id=$1",
		"trips":             "SELECT * FROM trips WHERE tenant_id=$1",
		"customers":         "SELECT * FROM customers WHERE tenant_id=$1",
		"invoices":          "SELECT * FROM invoices WHERE tenant_id=$1",
		"invoice_items":     "SELECT * FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE tenant_id=$1)",
		"invoice_payments":  "SELECT * FROM invoice_payments WHERE invoice_id IN (SELECT id FROM invoices WHERE tenant_id=$1)",
		"expenses":          "SELECT * FROM expenses WHERE tenant_id=$1",
		"employees":         "SELECT * FROM employees WHERE tenant_id=$1",
		"cek_senet":         "SELECT * FROM cek_senet WHERE tenant_id=$1",
		"fuel_logs":         "SELECT * FROM fuel_logs WHERE tenant_id=$1",
		"toll_logs":         "SELECT * FROM toll_logs WHERE tenant_id=$1",
		"maintenance_records": "SELECT * FROM maintenance_records WHERE tenant_id=$1",
		"predictions":       "SELECT * FROM predictions WHERE tenant_id=$1",
		"subscriptions":     "SELECT * FROM subscriptions WHERE tenant_id=$1",
		"settings":          "SELECT * FROM settings WHERE tenant_id=$1",
		"notifications":     "SELECT * FROM notifications WHERE tenant_id=$1",
		"actions":           "SELECT * FROM actions WHERE tenant_id=$1",
		"load_board":        "SELECT * FROM load_board WHERE tenant_id=$1",
		"driver_leave":      "SELECT * FROM driver_leave WHERE tenant_id=$1",
	}

	for name, query := range tables {
		rows, err := db.Query(r.Context(), query, tenantID)
		if err != nil {
			continue
		}
		defer rows.Close()

		descs := rows.FieldDescriptions()
		var all []map[string]interface{}
		for rows.Next() {
			vals, _ := rows.Values()
			row := make(map[string]interface{})
			for i, v := range vals {
				row[string(descs[i].Name)] = v
			}
			all = append(all, row)
		}
		rows.Close()

		if len(all) == 0 {
			continue
		}

		jsonBytes, _ := json.MarshalIndent(all, "", "  ")
		w, _ := zw.Create(tenantName + "/" + name + ".json")
		w.Write(jsonBytes)
	}

	zw.Close()
	return buf, nil
}

func safeFilename(name string) string {
	result := make([]byte, 0, len(name))
	for _, c := range name {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' || c == '_' {
			result = append(result, byte(c))
		} else if c == ' ' {
			result = append(result, '_')
		}
	}
	if len(result) == 0 {
		return "tenant"
	}
	return string(result)
}
