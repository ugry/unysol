#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
REGION="eu-central-1"
AWS_PROFILE="${AWS_PROFILE:-unysol}"

export AWS_PROFILE
export AWS_DEFAULT_REGION="$REGION"

echo "=== Initialize RDS Database ==="
echo ""
echo "This script applies the schema to your RDS instance."
echo "Make sure you have psql installed (sudo apt install postgresql-client)."
echo ""

# Get RDS endpoint from Terraform output
cd "$SCRIPT_DIR/../terraform"
RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
DB_HOST=$(echo "$RDS_ENDPOINT" | cut -d: -f1)
DB_PORT=$(echo "$RDS_ENDPOINT" | cut -d: -f2)

echo "RDS Endpoint: $RDS_ENDPOINT"
echo ""

read -rp "DB Username: " DB_USER
read -rsp "DB Password: " DB_PASS
echo ""

export PGPASSWORD="$DB_PASS"

echo "Applying schema..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d unysol \
  -f "$PROJECT_ROOT/database/01-schema.sql"

echo "Applying seed data (tenants)..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d unysol \
  -f "$PROJECT_ROOT/database/03-seed-tenants.sql"

echo ""
echo "=== Database initialized successfully ==="
