#!/usr/bin/env bash
set -Eeuo pipefail

# Create a logical backup of the production DocumentDB database and upload it
# to the private, versioned backups bucket. Run from a trusted operator host
# with AWS credentials provided by the environment/IAM role.
: "${MONGODB_URI:?Set MONGODB_URI to the production DocumentDB connection string}"
: "${S3_BACKUP_BUCKET:?Set S3_BACKUP_BUCKET to the private backup bucket name}"
: "${AWS_REGION:?Set AWS_REGION to the production AWS region}"
: "${BACKUP_KMS_KEY_ID:?Set BACKUP_KMS_KEY_ID to the application KMS key ARN or alias}"

command -v mongodump >/dev/null || { echo 'mongodump is required' >&2; exit 127; }
command -v aws >/dev/null || { echo 'aws CLI is required' >&2; exit 127; }

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
key="mongodb/${stamp}.archive.gz"
tmp_dir="$(mktemp -d)"
archive="${tmp_dir}/${stamp}.archive.gz"
trap 'rm -rf "$tmp_dir"' EXIT

# Single-collection parallelism is conservative for DocumentDB and avoids a
# burst of simultaneous connections during the backup window.
mongodump \
  --uri="${MONGODB_URI}" \
  --archive="${archive}" \
  --gzip \
  --numParallelCollections=1

aws s3 cp "${archive}" "s3://${S3_BACKUP_BUCKET}/${key}" \
  --sse aws:kms \
  --sse-kms-key-id "${BACKUP_KMS_KEY_ID:-alias/aws/s3}" \
  --metadata "created-at=${stamp},source=application-logical-backup"

printf 'Backup uploaded: s3://%s/%s\n' "${S3_BACKUP_BUCKET}" "${key}"
