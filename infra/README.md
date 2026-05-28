# Unysol AWS Migration

## Architecture

```
                    ┌─────────────────┐
                    │   Route 53      │
                    │ unysolar.com    │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   ALB (HTTPS)   │
                    │   ACM SSL Cert  │
                    └───┬─────────┬───┘
                        │         │
              /api/*    │         │    /*
                        │         │
              ┌─────────▼──┐  ┌──▼─────────┐
              │  Backend   │  │  Frontend   │
              │  (Fargate) │  │  (Fargate)  │
              └──┬──────┬──┘  └─────────────┘
                 │      │
         ┌───────▼──┐ ┌▼────────────┐
         │ RDS PG16 │ │ ElastiCache │
         │ (private)│ │   Redis 7   │
         └──────────┘ └─────────────┘
```

## Cost Estimate (~$35-50/mo)

| Service | Monthly |
|---------|---------|
| ALB | ~$16 |
| Fargate (2 tasks, 0.25 vCPU / 512MB) | ~$10 |
| RDS t4g.micro (free tier year 1) | $0-13 |
| ElastiCache t3.micro (free tier year 1) | $0-12 |
| Route 53 | ~$0.50 |
| ECR | ~$1 |
| **Total** | **~$28-52** |

## Step-by-Step Deployment

### 1. Setup AWS CLI & Terraform

```bash
./infra/scripts/setup-aws.sh
```

This will:
- Install AWS CLI (if not present)
- Configure your AWS credentials
- Install Terraform (if not present)
- Create the S3 state bucket and DynamoDB lock table

### 2. Configure Variables

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` — set strong passwords for `db_password` and `jwt_secret`.

### 3. Deploy Infrastructure

```bash
terraform init
terraform plan        # review what will be created
terraform apply       # type 'yes' to confirm
```

Wait ~10 minutes for RDS and certificate validation.

### 4. Initialize Database

```bash
./infra/scripts/init-db.sh
```

Note: RDS is in a private subnet. You'll need to either:
- Run this from an EC2 bastion in the same VPC, or
- Temporarily add your IP to the RDS security group

### 5. Build & Deploy Containers

```bash
./infra/scripts/deploy.sh
```

This builds both Docker images, pushes to ECR, and triggers ECS deployment.

### 6. Verify

Visit https://unysolar.com — should load the frontend.
Test API at https://unysolar.com/api/health.

## Subsequent Deployments

After code changes, just run:

```bash
./infra/scripts/deploy.sh
```

## Teardown

```bash
cd infra/terraform
terraform destroy
```
