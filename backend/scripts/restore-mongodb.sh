#!/usr/bin/env bash
set -Eeuo pipefail

# Restore a logical backup into the configured DocumentDB cluster. This is
# intentionally guarded because restoring a dump can overwrite current data.
: "${MONGODB_URI:?Set MONGODB_URI to the target DocumentDB connection string}"
: "${S3_BACKUP_BUCKET:?Set S3_BACKUP_BUCKET to the private backup bucket name}"
: "${AWS_REGION:?Set AWS_REGION to the production AWS region}"
: "${BACKUP_KEY:?Set BACKUP_KEY to the S3 object key, for example mongodb/20260924T010203Z.archive.gz}"
: "${CONFIRM_RESTORE:?Set CONFIRM_RESTORE=RESTORE to acknowledge destructive restore}"

command -v mongorestore >/dev/null || { echo 'mongorestore is required' >&2; exit 127; }
command -v aws >/dev/null || { echo 'aws CLI is required' >&2; exit 127; }

if [[ "${CONFIRM_RESTORE}" != 'RESTORE' ]]; then
  echo 'Refusing restore: CONFIRM_RESTORE must equal RESTORE.' >&2
  exit 2
fi

tmp_dir="$(mktemp -d)"
archive="${tmp_dir}/backup.archive.gz"
trap 'rm -rf "$tmp_dir"' EXIT

aws s3 cp "s3://${S3_BACKUP_BUCKET}/${BACKUP_KEY}" "${archive}"

mongorestore \
  --uri="${MONGODB_URI}" \
  --archive="${archive}" \
  --gzip \
  --nsInclude='tourmate.*' \
  --drop

printf 'Restore complete from s3://%s/%s\n' "${S3_BACKUP_BUCKET}" "${BACKUP_KEY}"
