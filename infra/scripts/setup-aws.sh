#!/usr/bin/env bash
set -euo pipefail

echo "=== Unysol AWS Setup ==="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
  echo "Installing AWS CLI v2..."
  curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "/tmp/awscliv2.zip"
  unzip -q /tmp/awscliv2.zip -d /tmp/aws-install
  sudo /tmp/aws-install/aws/install
  rm -rf /tmp/awscliv2.zip /tmp/aws-install
  echo "AWS CLI installed successfully."
fi

echo ""
echo "AWS CLI version: $(aws --version)"
echo ""

# Configure AWS credentials
echo "Configuring AWS credentials..."
echo "You'll need your AWS Access Key ID and Secret Access Key."
echo "Create them at: https://console.aws.amazon.com/iam/home#/security_credentials"
echo ""
aws configure --profile unysol

export AWS_PROFILE=unysol

# Verify credentials
echo ""
echo "Verifying credentials..."
aws sts get-caller-identity
echo ""
echo "AWS credentials configured successfully!"

# Install Terraform if needed
if ! command -v terraform &> /dev/null; then
  echo ""
  echo "Installing Terraform..."
  sudo apt-get update && sudo apt-get install -y gnupg software-properties-common
  wget -O- https://apt.releases.hashicorp.com/gpg | \
    gpg --dearmor | \
    sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null
  echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
    https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
    sudo tee /etc/apt/sources.list.d/hashicorp.list
  sudo apt-get update && sudo apt-get install terraform
  echo "Terraform installed: $(terraform --version)"
fi

# Create S3 bucket for Terraform state
REGION="eu-central-1"
STATE_BUCKET="unysol-terraform-state"
LOCK_TABLE="unysol-terraform-locks"

echo ""
echo "Creating Terraform state backend..."

aws s3api create-bucket \
  --bucket "$STATE_BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION" \
  2>/dev/null || echo "State bucket already exists."

aws s3api put-bucket-versioning \
  --bucket "$STATE_BUCKET" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "$STATE_BUCKET" \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

aws dynamodb create-table \
  --table-name "$LOCK_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "$REGION" \
  2>/dev/null || echo "Lock table already exists."

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. cd infra/terraform"
echo "  2. cp terraform.tfvars.example terraform.tfvars"
echo "  3. Edit terraform.tfvars with your secrets"
echo "  4. terraform init"
echo "  5. terraform plan"
echo "  6. terraform apply"
echo "  7. Run ./infra/scripts/deploy.sh to build and deploy containers"
