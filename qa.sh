#!/usr/bin/env bash
# ============================================================
# Unysol QA Environment Manager
# Mirrors production AWS setup locally via Docker Compose
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.qa.yml"
ENV_FILE="$SCRIPT_DIR/.env.qa"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

export COMPOSE_FILE
export $(grep -v '^#' "$ENV_FILE" | xargs) 2>/dev/null || true

cmd="${1:-help}"

case "$cmd" in
  up|start)
    echo -e "${GREEN}=== Starting Unysol QA Environment ===${NC}"
    echo "  DB:      postgres:16-alpine (mirrors RDS 16.6)"
    echo "  Cache:   redis:7-alpine (mirrors ElastiCache 7.1)"
    echo "  Proxy:   caddy:2-alpine (mirrors ALB routing)"
    echo "  Routes:  /api/* → backend:8080, /* → frontend:5173"
    echo ""
    docker compose -f "$COMPOSE_FILE" up -d --build
    echo ""
    echo -e "${GREEN}=== QA Environment Started ===${NC}"
    echo ""
    echo "  URLs:"
    echo "    App:       http://localhost"
    echo "    API:       http://localhost/api/system/health"
    echo "    Login:     http://localhost/login"
    echo "    Dashboard: http://localhost/dashboard"
    ;;
  
  down|stop)
    echo -e "${YELLOW}=== Stopping Unysol QA Environment ===${NC}"
    docker compose -f "$COMPOSE_FILE" down
    ;;
  
  restart)
    echo -e "${YELLOW}=== Restarting Unysol QA Environment ===${NC}"
    docker compose -f "$COMPOSE_FILE" down
    docker compose -f "$COMPOSE_FILE" up -d --build
    ;;
  
  rebuild)
    echo -e "${YELLOW}=== Rebuilding Unysol QA Environment ===${NC}"
    docker compose -f "$COMPOSE_FILE" build --no-cache backend frontend
    docker compose -f "$COMPOSE_FILE" up -d
    ;;
  
  logs)
    docker compose -f "$COMPOSE_FILE" logs -f --tail 100 "${@:2}"
    ;;
  
  status|ps)
    docker compose -f "$COMPOSE_FILE" ps
    ;;
  
  health)
    echo -e "${GREEN}=== Health Checks ===${NC}"
    echo -n "  Backend API: "
    curl -sf http://localhost/api/system/health 2>/dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}"
    echo -n "  Frontend:    "
    curl -sf -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo -e "${RED}FAIL${NC}"
    echo ""
    echo -n "  DB ping:     "
    docker exec unysol-qa-db pg_isready -U unysol 2>/dev/null && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}"
    echo -n "  Redis ping:  "
    docker exec unysol-qa-redis redis-cli ping 2>/dev/null | grep -q PONG && echo -e "${GREEN}OK${NC}" || echo -e "${RED}FAIL${NC}"
    ;;
  
  db-shell)
    docker exec -it unysol-qa-db psql -U unysol -d unysol
    ;;
  
  db-seed)
    echo "Seeding QA database..."
    docker exec -i unysol-qa-db psql -U unysol -d unysol < "$SCRIPT_DIR/database/01-schema.sql"
    echo "Schema applied."
    if [ -f "$SCRIPT_DIR/database/02-seed-demo.sql" ]; then
      docker exec -i unysol-qa-db psql -U unysol -d unysol < "$SCRIPT_DIR/database/02-seed-demo.sql"
      echo "Demo data seeded."
    fi
    ;;
  
  db-reset)
    echo -e "${RED}=== Resetting QA Database ===${NC}"
    read -p "This will DELETE all QA data. Continue? (y/N) " confirm
    if [ "$confirm" = "y" ]; then
      docker compose -f "$COMPOSE_FILE" down -v
      docker compose -f "$COMPOSE_FILE" up -d db redis
      sleep 3
      docker compose -f "$COMPOSE_FILE" up -d
      echo -e "${GREEN}Database reset complete.${NC}"
    fi
    ;;
  
  help|*)
    echo "Unysol QA Environment Manager"
    echo ""
    echo "Usage: ./qa.sh <command>"
    echo ""
    echo "Commands:"
    echo "  up|start     Start QA environment"
    echo "  down|stop    Stop QA environment"
    echo "  restart      Restart all services"
    echo "  rebuild      Rebuild backend + frontend images"
    echo "  logs [svc]   View logs (optional: service name)"
    echo "  status|ps    Show service status"
    echo "  health       Run health checks on all services"
    echo "  db-shell     Open PostgreSQL shell"
    echo "  db-seed      Apply schema + demo seed data"
    echo "  db-reset     Destroy and recreate database"
    echo ""
    echo "Environment file: .env.qa"
    echo "Compose file:     docker-compose.qa.yml"
    echo ""
    echo "Production comparison:"
    echo "  AWS ALB  → Caddy reverse proxy"
    echo "  RDS      → postgres:16-alpine"
    echo "  ElastiCache → redis:7-alpine"
    echo "  ECS BE   → backend (Go binary, :8080)"
    echo "  ECS FE   → frontend (serve, :5173)"
    ;;
esac
