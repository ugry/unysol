#!/usr/bin/env bash
# ============================================================
# One-time setup: Add Stripe env vars to ECS task definition
# Run this ONCE to enable Stripe checkout on production.
# After running, deploy normally via GitHub Actions.
# ============================================================
set -euo pipefail

AWS_REGION="eu-central-1"
TASK_FAMILY="unysol-backend"
CLUSTER="unysol-cluster"
SERVICE="unysol-backend"

echo "Adding STRIPE_SECRET_KEY + STRIPE_PUBLISHABLE_KEY to ECS..."
echo ""

# Get current task definition
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition "$TASK_FAMILY" \
  --region "$AWS_REGION" \
  --query 'taskDefinition' \
  --output json)

# Extract current env vars and add Stripe ones
NEW_CONTAINER_DEF=$(echo "$TASK_DEF" | jq -c \
  --arg sk "$STRIPE_SECRET_KEY" \
  --arg pk "$STRIPE_PUBLISHABLE_KEY" \
  '.containerDefinitions[0].environment += [
    {"name":"STRIPE_SECRET_KEY","value":$sk},
    {"name":"STRIPE_PUBLISHABLE_KEY","value":$pk}
  ] | .containerDefinitions')

FAMILY=$(echo "$TASK_DEF" | jq -r '.family')
TASK_ROLE=$(echo "$TASK_DEF" | jq -r '.taskRoleArn')
EXEC_ROLE=$(echo "$TASK_DEF" | jq -r '.executionRoleArn')
CPU=$(echo "$TASK_DEF" | jq -r '.cpu')
MEMORY=$(echo "$TASK_DEF" | jq -r '.memory')

# Register new revision
NEW_ARN=$(aws ecs register-task-definition \
  --family "$FAMILY" \
  --task-role-arn "$TASK_ROLE" \
  --execution-role-arn "$EXEC_ROLE" \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "$CPU" \
  --memory "$MEMORY" \
  --container-definitions "$NEW_CONTAINER_DEF" \
  --region "$AWS_REGION" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)

echo "New task definition: $NEW_ARN"
echo ""

# Update service
aws ecs update-service \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --task-definition "$NEW_ARN" \
  --region "$AWS_REGION"

echo "✅ Done — new tasks will start with Stripe env vars"
echo ""
echo "Now seed the DB price IDs via the admin API:"
echo "  See: scripts/seed-stripe-db.sh"
