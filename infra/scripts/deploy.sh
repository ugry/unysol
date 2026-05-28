#!/usr/bin/env bash
set -euo pipefail

PROJECT="unysol"
REGION="eu-central-1"
AWS_PROFILE="${AWS_PROFILE:-unysol}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

export AWS_PROFILE
export AWS_DEFAULT_REGION="$REGION"

echo "=== Unysol Deploy ==="
echo "Region: $REGION"
echo "Profile: $AWS_PROFILE"
echo ""

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$REGION" | \
  docker login --username AWS --password-stdin "$ECR_BASE"

# Build and push backend
echo ""
echo "Building backend..."
docker build -t "${ECR_BASE}/${PROJECT}/backend:latest" "$PROJECT_ROOT/backend"
echo "Pushing backend..."
docker push "${ECR_BASE}/${PROJECT}/backend:latest"

# Build frontend with production API URL
echo ""
echo "Building frontend..."
docker build \
  --build-arg VITE_API_URL="${FRONTEND_API_URL:-https://unysolar.com}" \
  -t "${ECR_BASE}/${PROJECT}/frontend:latest" \
  "$PROJECT_ROOT/frontend"
echo "Pushing frontend..."
docker push "${ECR_BASE}/${PROJECT}/frontend:latest"

# Force new deployment on ECS
echo ""
echo "Deploying to ECS..."
aws ecs update-service \
  --cluster "${PROJECT}-cluster" \
  --service "${PROJECT}-backend" \
  --force-new-deployment \
  --no-cli-pager

aws ecs update-service \
  --cluster "${PROJECT}-cluster" \
  --service "${PROJECT}-frontend" \
  --force-new-deployment \
  --no-cli-pager

echo ""
echo "=== Deployment triggered ==="
echo "Monitor at: https://${REGION}.console.aws.amazon.com/ecs/v2/clusters/${PROJECT}-cluster/services"
echo ""

# Wait for services to stabilize
echo "Waiting for services to stabilize (this may take 2-3 minutes)..."
aws ecs wait services-stable \
  --cluster "${PROJECT}-cluster" \
  --services "${PROJECT}-backend" "${PROJECT}-frontend"

echo ""
echo "=== Deployment Complete ==="
echo "App is live at: https://unysolar.com"
