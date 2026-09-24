output "alb_dns_name" {
  value       = aws_lb.main.dns_name
  description = "ALB DNS name for manual DNS records when hosted_zone_id is empty."
}

output "api_secret_arn" {
  value       = aws_secretsmanager_secret.application.arn
  description = "Secrets Manager ARN injected into the ECS API task."
}

output "uploads_bucket" {
  value       = aws_s3_bucket.uploads.bucket
  description = "Private S3 bucket used for presigned uploads."
}

output "documentdb_endpoint" {
  value       = aws_docdb_cluster.main.endpoint
  description = "DocumentDB endpoint for operator diagnostics."
}

output "redis_endpoint" {
  value       = aws_elasticache_replication_group.main.primary_endpoint_address
  description = "Redis primary endpoint for diagnostics."
}

output "ecs_cluster_name" {
  value       = aws_ecs_cluster.main.name
  description = "ECS cluster name."
}
