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

`backend.tf` declares the S3 backend with `encrypt = true`, so the state object
— which holds the generated DocumentDB, Redis and JWT credentials — is encrypted
at rest in every environment, including a local run. The bucket, key, region and
lock table are deliberately **not** in the file: they are supplied at `init` time
so nothing account-specific is committed. Create the bucket and the lock table
once; CI reads the same values from the `TF_STATE_BUCKET`, `TF_STATE_KEY` and
`TF_LOCK_TABLE` repository variables.

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

Every `init` — local and in `aws-production.yml` — passes the same four
`-backend-config` flags, so two applies cannot interleave, and `encrypt = true`
in `backend.tf` guarantees the state object is encrypted at rest without relying
on a flag being remembered. Details and the workflow gates:
[../../docs/ci-cd.md](../../docs/ci-cd.md#remote-state).

## Provider versions

`.terraform.lock.hcl` is committed. It records the exact provider versions and
their content hashes for both `linux_amd64` (CI and production) and
`windows_amd64` (local development on Windows), so every machine resolves the
same providers and a tampered or corrupted download is rejected.

Never edit that file by hand. After changing a provider constraint in
`versions.tf`, regenerate and commit it:

```bash
terraform init
terraform providers lock -platform=linux_amd64 -platform=windows_amd64
```

`terraform-plan.yml` fails the pull request if the committed lock file is stale
or if the hashes do not match what the registry currently serves.

## Reusable modules

Infrastructure that more than one service depends on lives in `modules/` rather
than being re-typed inline, so its security properties are defined once:

| Module | Source          | What it owns                                                                                                                         |
| ------ | --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `ecr`  | `./modules/ecr` | One container repository per service: KMS encryption, scan-on-push, immutable tags, and a lifecycle policy expiring untagged images. |

### `modules/ecr`

| Input                  | Type           | Required | Default       | Purpose                                                                                          |
| ---------------------- | -------------- | -------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `names`                | `list(string)` | yes      | –             | Short service names; each becomes `<name_prefix>-<name>`.                                        |
| `name_prefix`          | `string`       | yes      | –             | Keeps environments from colliding in one account/region.                                         |
| `kms_key_arn`          | `string`       | yes      | –             | Key for image encryption. Validated as a KMS ARN, because ECR rejects an unencrypted repository. |
| `untagged_image_limit` | `number`       | no       | `10`          | Untagged images kept before the oldest expires.                                                  |
| `image_tag_mutability` | `string`       | no       | `"IMMUTABLE"` | Overwriting a deployed tag is almost never intended.                                             |

| Output             | Type           | Purpose                                                |
| ------------------ | -------------- | ------------------------------------------------------ |
| `repository_names` | `list(string)` | Fully qualified names.                                 |
| `repositories`     | `map(object)`  | The resources, for ARN/URL access.                     |
| `repository_urls`  | `map(string)`  | Registry URL per short name, for an ECS `image` field. |
| `repository_arns`  | `map(string)`  | ARN per short name, for IAM scoping.                   |

The module declares its own `required_providers` so it cannot be used with an
unrelated provider version; the root `.terraform.lock.hcl` remains the single
lock that governs the download. Adding a module directory is enough for
`terraform fmt -check -recursive` and `terraform validate` in
`terraform-plan.yml` to cover it — both commands walk the tree, and
`terraform init` installs local modules automatically.

## Apply

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with real values. Never commit it.
terraform init \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=$TF_STATE_KEY" \
  -backend-config="region=$AWS_REGION" \
  -backend-config="dynamodb_table=$TF_LOCK_TABLE"
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
