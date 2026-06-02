#!/usr/bin/env bash
# ============================================================
# Unysol Pre-Deployment Safety Check
# Run BEFORE triggering production deploy: ./scripts/pre-deploy-check.sh
# Compares QA (local) vs Production (AWS ECS) and gates deploy
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

pass() { echo -e "  ${GREEN}✓${NC} $1"; PASS=$((PASS+1)); }
fail() { echo -e "  ${RED}✗${NC} $1"; FAIL=$((FAIL+1)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; WARN=$((WARN+1)); }

echo "========================================"
echo " Unysol Pre-Deployment Safety Check"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

# ── 1. Branch check ──
echo "── 1. Branch & Commit ──"
BRANCH=$(git -C "$PROJECT_DIR" branch --show-current)
LOCAL_SHA=$(git -C "$PROJECT_DIR" rev-parse HEAD)
LOCAL_SHORT=$(git -C "$PROJECT_DIR" rev-parse --short HEAD)
REMOTE_SHA=$(git -C "$PROJECT_DIR" rev-parse origin/main 2>/dev/null || echo "unknown")

if [ "$BRANCH" != "main" ]; then
  fail "Branch is '$BRANCH', not 'main'. Deploy only from main."
  warn "To fix: git checkout main && git merge $BRANCH"
else
  pass "Branch is main"
fi

if [ "$LOCAL_SHA" != "$REMOTE_SHA" ] && [ "$REMOTE_SHA" != "unknown" ]; then
  warn "Local main differs from origin/main. Push first?"
  echo "       Local:  $LOCAL_SHORT"
  echo "       Remote: $(echo $REMOTE_SHA | head -c 7)"
else
  pass "Local and remote main are in sync"
fi

echo "  Commit: $LOCAL_SHORT — $(git -C "$PROJECT_DIR" log -1 --format='%s')"
echo ""

# ── 2. QA environment health ──
echo "── 2. QA Environment Health ──"
if docker compose -f "$PROJECT_DIR/docker-compose.qa.yml" ps --status running 2>/dev/null | grep -q "unysol-qa"; then
  pass "QA containers are running"
else
  fail "QA environment is NOT running. Start with: ./qa.sh up"
  echo "       You MUST test changes on QA before deploying."
fi

if curl -sf http://localhost/api/system/health > /dev/null 2>&1; then
  pass "QA backend health check passed"
else
  fail "QA backend health check FAILED"
fi

if curl -sf -o /dev/null http://localhost/ 2>&1; then
  pass "QA frontend is reachable"
else
  fail "QA frontend is NOT reachable"
fi
echo ""

# ── 3. CI tests on current commit ──
echo "── 3. CI Test Status ──"
# Check if this commit has a passing CI run
CI_STATUS=$(gh run list \
  --repo ugry/unysol \
  --branch main \
  --workflow test.yml \
  --limit 3 \
  --json status,conclusion,headSha \
  --jq "[.[] | select(.headSha == \"$LOCAL_SHA\")] | first | .conclusion // \"no-run\"" 2>/dev/null || echo "unknown")

case "$CI_STATUS" in
  success)   pass "CI tests passed for this commit";;
  failure)   fail "CI tests FAILED for this commit. Fix before deploying.";;
  no-run)    warn "No CI run found for this commit. Tests may not have run.";;
  *)         warn "CI status unknown: $CI_STATUS";;
esac
echo ""

# ── 4. What would change? (diff since last deploy) ──
echo "── 4. Changes Since Last Deploy ──"
# Get deployed SHA from ECR (if AWS CLI available)
DEPLOYED_SHA=""
if command -v aws &>/dev/null; then
  DEPLOYED_SHA=$(aws ecr describe-images \
    --repository-name unysol/backend \
    --region eu-central-1 \
    --query 'sort_by(imageDetails,&imagePushedAt)[-1].imageTags' \
    --output text 2>/dev/null | tr '\t' '\n' | grep '^sha-' | sed 's/sha-//' || echo "")
fi

if [ -n "$DEPLOYED_SHA" ]; then
  DEPLOYED_SHORT=$(echo "$DEPLOYED_SHA" | head -c 7)
  pass "Current production SHA: $DEPLOYED_SHORT (fetched from ECR)"
  
  CHANGE_COUNT=$(git -C "$PROJECT_DIR" rev-list --count "$DEPLOYED_SHA..$LOCAL_SHA" 2>/dev/null || echo "?")
  if [ "$CHANGE_COUNT" -gt 0 ] 2>/dev/null; then
    echo ""
    echo "  Commits to be deployed ($CHANGE_COUNT):"
    git -C "$PROJECT_DIR" log --oneline "$DEPLOYED_SHA..$LOCAL_SHA" | head -20 | sed 's/^/    /'
    echo ""
    
    # ── 5. Schema change detection ──
    echo "── 5. Database Schema Changes ──"
    SCHEMA_DIFF=$(git -C "$PROJECT_DIR" diff "$DEPLOYED_SHA..$LOCAL_SHA" -- database/ 2>/dev/null)
    if [ -n "$SCHEMA_DIFF" ]; then
      warn "DATABASE SCHEMA HAS CHANGED since last deploy!"
      echo ""
      echo "  Affected files:"
      git -C "$PROJECT_DIR" diff --name-only "$DEPLOYED_SHA..$LOCAL_SHA" -- database/ | sed 's/^/    /'
      echo ""
      warn "You MUST run migration manually before/after deploy."
      echo "       Migration plan needed for:"
      git -C "$PROJECT_DIR" diff --name-only "$DEPLOYED_SHA..$LOCAL_SHA" -- database/ | sed 's/^/       - /'
    else
      pass "No database schema changes"
    fi
    echo ""
    
    # ── 6. Backend code changes ──
    echo "── 6. Backend Changes ──"
    BACKEND_FILES=$(git -C "$PROJECT_DIR" diff --name-only "$DEPLOYED_SHA..$LOCAL_SHA" -- backend/ 2>/dev/null)
    if [ -n "$BACKEND_FILES" ]; then
      warn "Backend code changed ($(echo "$BACKEND_FILES" | wc -l) files)"
      echo "$BACKEND_FILES" | head -10 | sed 's/^/    /'
      [ "$(echo "$BACKEND_FILES" | wc -l)" -gt 10 ] && echo "    ... and more"
    else
      pass "No backend changes"
    fi
    echo ""
    
    # ── 7. Frontend code changes ──
    echo "── 7. Frontend Changes ──"
    FRONTEND_FILES=$(git -C "$PROJECT_DIR" diff --name-only "$DEPLOYED_SHA..$LOCAL_SHA" -- frontend/ 2>/dev/null)
    if [ -n "$FRONTEND_FILES" ]; then
      warn "Frontend code changed ($(echo "$FRONTEND_FILES" | wc -l) files)"
      echo "$FRONTEND_FILES" | head -10 | sed 's/^/    /'
      [ "$(echo "$FRONTEND_FILES" | wc -l)" -gt 10 ] && echo "    ... and more"
    else
      pass "No frontend changes"
    fi
    echo ""
  else
    pass "No new commits to deploy — production is up to date"
  fi
else
  warn "Could not determine deployed SHA (AWS CLI not available or no images in ECR)"
  echo "       Install AWS CLI or run manually:"
  echo "       aws ecr describe-images --repository-name unysol/backend --region eu-central-1"
fi
echo ""

# ── 8. Deployment checklist ──
echo "── 8. Manual Verification Checklist ──"
echo "  ☐ QA tested: login, core pages, affected modules"
echo "  ☐ QA tested: new features (if any)"
echo "  ☐ QA tested: on mobile (responsive)"
echo "  ☐ Database migrations prepared (if needed)"
echo "  ☐ Rollback plan documented"
echo "  ☐ Team notified of upcoming deploy"
echo ""

# ── Summary ──
echo "========================================"
echo " RESULTS: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, ${YELLOW}$WARN warnings${NC}"
echo "========================================"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo -e "${RED}DEPLOY BLOCKED — Fix $FAIL failure(s) above before deploying.${NC}"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}PROCEED WITH CAUTION — Review $WARN warning(s) above.${NC}"
  echo ""
  echo "If all warnings are acceptable, deploy with:"
  echo "  gh workflow run deploy.yml --repo ugry/unysol --ref main -f reason=\"Your reason here\""
  exit 0
else
  echo ""
  echo -e "${GREEN}ALL CHECKS PASSED — Safe to deploy.${NC}"
  echo ""
  echo "Deploy with:"
  echo "  gh workflow run deploy.yml --repo ugry/unysol --ref main -f reason=\"Your reason here\""
  exit 0
fi
