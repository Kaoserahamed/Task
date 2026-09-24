resource "random_password" "documentdb" {
  length  = 32
  special = false
}

resource "random_password" "redis" {
  length  = 64
  special = false
}

resource "random_password" "jwt" {
  length  = 64
  special = false
}

resource "aws_kms_key" "application" {
  description             = "Encryption key for Task application data and logs"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_kms_alias" "application" {
  name          = "alias/${local.name}"
  target_key_id = aws_kms_key.application.key_id
}

resource "aws_docdb_subnet_group" "main" {
  name       = "${local.name}-docdb"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_docdb_cluster_parameter_group" "main" {
  name   = "${local.name}-docdb"
  family = "docdb5.0"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  parameter {
    name  = "audit_logs_enabled"
    value = "1"
  }
}

resource "aws_docdb_cluster" "main" {
  cluster_identifier              = "${local.name}-docdb"
  engine                          = "docdb"
  engine_version                  = "5.0"
  master_username                 = var.documentdb_username
  master_password                 = random_password.documentdb.result
  db_subnet_group_name            = aws_docdb_subnet_group.main.name
  vpc_security_group_ids          = [aws_security_group.data.id]
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "sun:04:00-sun:05:00"
  port                            = 27017
  storage_type                    = "standard"
  deletion_protection             = true
  skip_final_snapshot             = false
  final_snapshot_identifier       = "${local.name}-final"
  copy_tags_to_snapshot           = true
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  storage_encrypted               = true
  kms_key_id                      = aws_kms_key.application.arn
}

resource "aws_docdb_cluster_instance" "main" {
  count              = 2
  identifier         = "${local.name}-docdb-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = "db.t3.medium"
  availability_zone  = var.availability_zones[count.index]
  apply_immediately = false
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name}-redis"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "main" {
  replication_group_id          = "${local.name}-redis"
  description                   = "Shared cache, idempotency store, and queue"
  node_type                     = "cache.t4g.small"
  num_cache_clusters            = 2
  automatic_failover_enabled    = true
  multi_az_enabled               = true
  engine                        = "redis"
  engine_version                = "7.0"
  subnet_group_name             = aws_elasticache_subnet_group.main.name
  security_group_ids            = [aws_security_group.data.id]
  port                          = 6379
  auth_token                    = random_password.redis.result
  transit_encryption_enabled    = true
  at_rest_encryption_enabled    = true
  kms_key_id                    = aws_kms_key.application.arn
  maintenance_window            = "sun:05:00-sun:06:00"
  snapshot_retention_limit       = 7
  snapshot_window               = "03:00-04:00"
  apply_immediately              = false
}
