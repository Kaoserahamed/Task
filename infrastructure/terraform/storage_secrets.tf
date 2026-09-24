resource "aws_s3_bucket" "uploads" {
  bucket        = "${local.name}-uploads"
  force_destroy = false
  tags          = { Name = "${local.name}-uploads" }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.application.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "noncurrent-version-expiry"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration { noncurrent_days = 30 }
    abort_incomplete_multipart_upload { days_after_initiation = 7 }
  }
}

resource "aws_s3_bucket" "backups" {
  bucket        = "${local.name}-backups"
  force_destroy = false
  tags          = { Name = "${local.name}-backups" }
}

resource "aws_s3_bucket_public_access_block" "backups" {
  bucket                  = aws_s3_bucket.backups.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "backups" {
  bucket = aws_s3_bucket.backups.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backups" {
  bucket = aws_s3_bucket.backups.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.application.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_secretsmanager_secret" "application" {
  name                    = "${local.name}/application"
  description             = "Task API runtime configuration and credentials"
  kms_key_id              = aws_kms_key.application.arn
  recovery_window_in_days = 7
}

resource "aws_secretsmanager_secret_version" "application" {
  secret_id = aws_secretsmanager_secret.application.id
  secret_string = jsonencode({
    MONGODB_URI = "mongodb://${var.documentdb_username}:${random_password.documentdb.result}@${aws_docdb_cluster.main.endpoint}:27017/tourmate?tls=true&tlsCAFile=/etc/ssl/certs/aws-rds-global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
    JWT_SECRET = random_password.jwt.result
    REDIS_URL = "rediss://:${random_password.redis.result}@${aws_elasticache_replication_group.main.primary_endpoint_address}:6379"
    WEATHER_API_KEY = var.weather_api_key
    SENDINBLUE_API_KEY = var.sendinblue_api_key
    CLOUDINARY_CLOUD_NAME = var.cloudinary_cloud_name
    CLOUDINARY_API_KEY = var.cloudinary_api_key
    CLOUDINARY_API_SECRET = var.cloudinary_api_secret
    PUSHER_APP_ID = var.pusher_app_id
    PUSHER_KEY = var.pusher_key
    PUSHER_SECRET = var.pusher_secret
    PUSHER_CLUSTER = var.pusher_cluster
    MAIL_FROM_NAME = var.mail_from_name
    MAIL_FROM_EMAIL = var.mail_from_email
    METRICS_TOKEN = var.metrics_token
  })

  depends_on = [aws_docdb_cluster.main, aws_elasticache_replication_group.main]
}
