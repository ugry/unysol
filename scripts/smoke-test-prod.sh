#!/usr/bin/env bash
# ============================================================
# Unysol Production Smoke Test
# Run AFTER deployment to verify production is healthy
# Usage: ./scripts/smoke-test-prod.sh
# ============================================================
set -euo pipefail

BASE_URL="${1:-https://unysolar.com}"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
  local method="$1" url="$2" expected="$3" desc="$4"
  local code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$BASE_URL$url" 2>/dev/null)
  if echo "$code" | grep -qE "$expected"; then
    echo -e "  ${GREEN}✓${NC} $desc (HTTP $code)"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗${NC} $desc (HTTP $code, expected $expected)"
    FAIL=$((FAIL+1))
  fi
}

check_body() {
  local url="$1" pattern="$2" desc="$3"
  local body=$(curl -sf "$BASE_URL$url" 2>/dev/null || echo "")
  if echo "$body" | grep -q "$pattern"; then
    echo -e "  ${GREEN}✓${NC} $desc"
    PASS=$((PASS+1))
  else
    echo -e "  ${RED}✗${NC} $desc (pattern '$pattern' not found)"
    FAIL=$((FAIL+1))
  fi
}

echo "========================================"
echo " Unysol Production Smoke Test"
echo " Target: $BASE_URL"
echo " $(date -u)"
echo "========================================"
echo ""

# ── Critical: Health ──
echo "── Health Endpoints ──"
check GET "/api/system/health" "200" "Backend health"
check GET "/api/system/health/ready" "200" "Backend readiness"
check GET "/api/system/health/live" "200" "Backend liveness"
echo ""

# ── Frontend reachable ──
echo "── Frontend ──"
check GET "/" "200" "Homepage loads"
check GET "/login" "200" "Login page loads"
check GET "/app" "200" "App shell loads (may redirect)"
echo ""

# ── API Auth endpoints reachable ──
echo "── Auth Endpoints ──"
check POST "/api/auth/login" "400\|401" "Login endpoint responds"
check POST "/api/auth/signup" "400\|422\|409" "Signup endpoint responds"
echo ""

# ── API Admin endpoints (should return 401 without auth) ──
echo "── Admin Endpoints (expect 401 without auth) ──"
check GET "/api/admin/tenants" "401" "Admin tenants (auth required)"
check GET "/api/admin/modules" "401" "Admin modules (auth required)"
echo ""

# ── Tenant API (should return 401 without auth) ──
echo "── Tenant Endpoints (expect 401 without auth) ──"
check GET "/api/tenant/dashboard/summary" "401" "Dashboard (auth required)"
check GET "/api/tenant/trucks" "401" "Trucks (auth required)"
check GET "/api/tenant/invoices" "401" "Invoices (auth required)"
echo ""

# ── SSL ──
echo "── SSL ──"
if curl -sf -o /dev/null "$BASE_URL/api/system/health" 2>/dev/null; then
  echo -e "  ${GREEN}✓${NC} HTTPS connection successful"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}✗${NC} HTTPS connection FAILED"
  FAIL=$((FAIL+1))
fi
echo ""

# ── Response time ──
echo "── Response Time ──"
TIME=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/system/health" 2>/dev/null)
if (( $(echo "$TIME < 3" | bc -l) )); then
  echo -e "  ${GREEN}✓${NC} Health response time: ${TIME}s (< 3s)"
  PASS=$((PASS+1))
else
  echo -e "  ${RED}✗${NC} Health response time: ${TIME}s (SLOW, expected < 3s)"
  FAIL=$((FAIL+1))
fi
echo ""

echo "========================================"
echo " RESULTS: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}SMOKE TEST FAILED — Investigate immediately.${NC}"
  echo "Rollback: gh workflow run rollback.yml --repo ugry/unysol"
  exit 1
else
  echo -e "${GREEN}All smoke tests passed.${NC}"
  exit 0
fi
