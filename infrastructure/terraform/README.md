# AWS production Terraform

This directory provisions the AWS deployment for the existing Mongoose/MongoDB
application. It intentionally uses **Amazon DocumentDB** rather than PostgreSQL:
converting the current models and queries to PostgreSQL is an application rewrite,
not an infrastructure setting.

## Resources

- VPC, public subnets for the ALB, private subnets for ECS/data services
- ALB with ACM TLS, host-based routing, WAF managed rules, and HTTP redirect
- ECR repositories for `backend`, `frontend`, `admin`, and `company`
- ECS Fargate API, three web services, and a Redis worker
- DocumentDB 5.0 with two instances, TLS, encryption, deletion protection, and
  seven-day automated backups
- ElastiCache Redis with TLS, authentication, Multi-AZ, and snapshots
- Private encrypted/versioned S3 buckets for uploads and backups
- Secrets Manager, KMS key rotation, IAM roles, CloudWatch logs, and alarms
- Optional Route53 records when `hosted_zone_id` is supplied

## Apply

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values. Never commit it.
terraform init
terraform fmt -check
terraform validate
terraform plan -out production.tfplan
terraform apply production.tfplan
```

The initial `terraform plan` will create random DocumentDB, Redis, and JWT
credentials in Terraform state. Treat state as sensitive: use an encrypted remote
backend with restricted access before applying this in a shared environment. The
runtime task receives only the generated secret ARN, not static AWS keys.

## Required preparation

1. Create an ACM certificate in the same region covering the four hostnames.
2. Create/push the four immutable ECR image tags and copy their URIs into the
   tfvars file.
3. Set `hosted_zone_id` if DNS records should be managed by Terraform.
4. Set optional third-party keys or leave them empty if those features are not
   enabled. The API still requires `MONGODB_URI`, `JWT_SECRET`, and uses S3 for
   presigned uploads.
5. Run migrations as an operator action from a controlled task/SSM session; ECS
   task startup intentionally does not mutate the database.
