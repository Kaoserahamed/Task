# Remote state for the production deployment.
#
# Only account-independent settings live here. The bucket, key, region and lock
# table are supplied at `init` time with `-backend-config` flags (see
# aws-production.yml and infrastructure/terraform/README.md), so no account id or
# bucket name is ever committed. The values CI passes are:
#
#   TF_STATE_BUCKET -> bucket          TF_STATE_KEY  -> key
#   AWS_REGION      -> region          TF_LOCK_TABLE -> dynamodb_table
#
# `encrypt = true` is declared here rather than passed on the command line so the
# state object — which holds the generated DocumentDB, Redis and JWT credentials —
# is encrypted at rest everywhere, including a local run, and cannot be
# initialised into an unencrypted bucket by forgetting a flag.
#
# The DynamoDB lock table serialises concurrent applies: two overlapping CI runs,
# or a local apply racing a deploy, would otherwise write the same state key and
# silently lose one run's changes.
terraform {
  backend "s3" {
    encrypt = true
  }
}