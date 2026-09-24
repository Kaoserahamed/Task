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

## Remote state

`versions.tf` declares an empty S3 backend (`backend "s3" {}`), so the location
is supplied at `init` time and nothing account-specific is committed. Create the
bucket and the lock table once; CI reads the same values from the
`TF_STATE_BUCKET`, `TF_STATE_KEY` and `TF_LOCK_TABLE` repository variables.

```bash
# One-time bootstrap (replace the names and the region).
aws s3api create-bucket --bucket "$TF_STATE_BUCKET" --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"
aws s3api put-bucket-versioning --bucket "$TF_STATE_BUCKET" \
  --versioning-configuration Status=Enabled
aws s3api put-bucket-encryption --bucket "$TF_STATE_BUCKET" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
aws dynamodb create-table --table-name "$TF_LOCK_TABLE" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region "$AWS_REGION"
```

Every `init` — local and in `aws-production.yml` — passes `encrypt=true` and the
same four `-backend-config` flags, so state is encrypted at rest and two applies
cannot interleave. Details and the workflow gates:
[../../docs/ci-cd.md](../../docs/ci-cd.md#remote-state).

## Apply

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values. Never commit it.
terraform init \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=$TF_STATE_KEY" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="dynamodb_table=$TF_LOCK_TABLE" \
  -backend-config="encrypt=true"
terraform fmt -check
terraform validate
terraform plan -out production.tfplan
terraform apply production.tfplan
```

The initial `terraform plan` will create random DocumentDB, Redis, and JWT
credentials in Terraform state. Treat that state as sensitive and keep the S3
bucket access-restricted; the runtime task receives only the generated secret
ARN, not static AWS keys.

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
