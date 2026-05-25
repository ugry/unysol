package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"

	"unysol/internal/middleware"
	"unysol/internal/models"
)

func TestCreateTruck_Validation_InvalidJSON(t *testing.T) {
	handler := &TrucksHandler{DB: nil}

	req := httptest.NewRequest(http.MethodPost, "/api/tenant/trucks", bytes.NewBufferString("not json"))
	req.Header.Set("Content-Type", "application/json")

	// This will fail at JSON parsing, which doesn't use DB — safe
	rec := httptest.NewRecorder()
	handler.Create(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", rec.Code)
	}
}

func TestCreateTruck_Validation_EmptyRequiredFields(t *testing.T) {
	handler := &TrucksHandler{DB: nil}

	body := models.CreateTruckRequest{Plaka: ""}
	bodyJSON, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/tenant/trucks", bytes.NewBuffer(bodyJSON))
	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()
	handler.Create(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty plaka, got %d", rec.Code)
	}

	var resp models.ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err == nil {
		if resp.Error == "" {
			t.Error("expected error message in response")
		} else {
			t.Logf("Got expected error: %s", resp.Error)
		}
	}
}

func TestDeleteTruck_InvalidID(t *testing.T) {
	handler := &TrucksHandler{DB: nil}

	req := httptest.NewRequest(http.MethodDelete, "/api/tenant/trucks/abc", nil)
	req.SetPathValue("id", "abc")

	rec := httptest.NewRecorder()
	handler.Delete(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid id, got %d", rec.Code)
	}

	var resp models.ErrorResponse
	json.NewDecoder(rec.Body).Decode(&resp)
	if resp.Error == "" {
		t.Error("expected error message")
	}
}

func TestGetTruck_InvalidID(t *testing.T) {
	handler := &TrucksHandler{DB: nil}

	req := httptest.NewRequest(http.MethodGet, "/api/tenant/trucks/abc", nil)
	req.SetPathValue("id", "abc")

	rec := httptest.NewRecorder()
	handler.Get(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid id, got %d", rec.Code)
	}
}

func TestUpdateTruck_InvalidID(t *testing.T) {
	handler := &TrucksHandler{DB: nil}

	body := models.CreateTruckRequest{Plaka: "34ABC1234"}
	bodyJSON, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPut, "/api/tenant/trucks/abc", bytes.NewBuffer(bodyJSON))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", "abc")

	rec := httptest.NewRecorder()
	handler.Update(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid id, got %d", rec.Code)
	}
}

func TestUpdateTruck_InvalidJSON(t *testing.T) {
	handler := &TrucksHandler{DB: nil}

	req := httptest.NewRequest(http.MethodPut, "/api/tenant/trucks/1", bytes.NewBufferString("bad json"))
	req.Header.Set("Content-Type", "application/json")
	req.SetPathValue("id", "1")

	rec := httptest.NewRecorder()
	handler.Update(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for invalid JSON, got %d", rec.Code)
	}
}

func TestRoutes_RequireTenantMiddleware(t *testing.T) {
	handler := &TrucksHandler{DB: nil}
	router := handler.Routes()

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Errorf("expected 403 for missing tenant context, got %d", rec.Code)
	}
}

func TestAuthMiddleware_MissingHeader(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/tenant/trucks", nil)

	rec := httptest.NewRecorder()
	mw := middleware.Auth("test-secret")
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for missing auth header, got %d", rec.Code)
	}
}

func TestAuthMiddleware_InvalidFormat(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/tenant/trucks", nil)
	req.Header.Set("Authorization", "InvalidFormat")

	rec := httptest.NewRecorder()
	mw := middleware.Auth("test-secret")
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for invalid auth format, got %d", rec.Code)
	}
}

func TestAuthMiddleware_NoBearerPrefix(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/tenant/trucks", nil)
	req.Header.Set("Authorization", "Token some-token")

	rec := httptest.NewRecorder()
	mw := middleware.Auth("test-secret")
	handler := mw(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for non-Bearer token, got %d", rec.Code)
	}
}

func TestTenantContextExtraction(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.TenantIDKey, "42")
	tenantID := middleware.GetTenantID(ctx)

	if tenantID != "42" {
		t.Errorf("expected tenant_id=42, got %s", tenantID)
	}

	id, err := strconv.Atoi(tenantID)
	if err != nil {
		t.Errorf("failed to parse tenant id to int: %v", err)
	}
	if id != 42 {
		t.Errorf("expected 42, got %d", id)
	}
}

func TestRoleExtraction(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.RoleKey, "TENANT_OWNER")
	role := middleware.GetRole(ctx)

	if role != "TENANT_OWNER" {
		t.Errorf("expected TENANT_OWNER, got %s", role)
	}
}

func TestUserIDExtraction(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.UserIDKey, "99")
	userID := middleware.GetUserID(ctx)

	if userID != "99" {
		t.Errorf("expected user_id=99, got %s", userID)
	}
}

func TestEmailExtraction(t *testing.T) {
	ctx := context.WithValue(context.Background(), middleware.EmailKey, "test@unysol.com")
	email := middleware.GetEmail(ctx)

	if email != "test@unysol.com" {
		t.Errorf("expected email=test@unysol.com, got %s", email)
	}
}

func TestWriteJSON_ResponseFormat(t *testing.T) {
	rec := httptest.NewRecorder()
	writeJSON(rec, http.StatusOK, map[string]string{"status": "ok"})

	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	contentType := rec.Header().Get("Content-Type")
	if contentType != "application/json" {
		t.Errorf("expected application/json, got %s", contentType)
	}

	var resp map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Errorf("failed to decode JSON: %v", err)
	}
	if resp["status"] != "ok" {
		t.Errorf("expected status=ok, got %s", resp["status"])
	}
}

func TestWriteError_ResponseFormat(t *testing.T) {
	rec := httptest.NewRecorder()
	writeError(rec, http.StatusNotFound, "resource not found")

	if rec.Code != http.StatusNotFound {
		t.Errorf("expected 404, got %d", rec.Code)
	}

	var resp models.ErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Errorf("failed to decode JSON: %v", err)
	}
	if resp.Error != "resource not found" {
		t.Errorf("expected 'resource not found', got %s", resp.Error)
	}
}
