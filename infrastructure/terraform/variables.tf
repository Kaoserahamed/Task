variable "aws_region" {
  type        = string
  description = "AWS region for the production deployment."
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Resource name prefix."
  default     = "task"
}

variable "environment" {
  type        = string
  description = "Deployment environment name."
  default     = "production"
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block."
  default     = "10.40.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Two availability zones used for the ALB and private services."
  default     = ["us-east-1a", "us-east-1b"]
  validation {
    condition     = length(var.availability_zones) == 2
    error_message = "Exactly two availability zones are required."
  }
}

variable "domain_name" {
  type        = string
  description = "Base DNS name, for example task.example.com."
}

variable "api_hostname" {
  type        = string
  description = "API hostname."
  default     = "api.task.example.com"
}

variable "frontend_hostname" {
  type        = string
  description = "Customer storefront hostname."
  default     = "www.task.example.com"
}

variable "admin_hostname" {
  type        = string
  description = "Admin dashboard hostname."
  default     = "admin.task.example.com"
}

variable "company_hostname" {
  type        = string
  description = "Company dashboard hostname."
  default     = "company.task.example.com"
}

variable "certificate_arn" {
  type        = string
  description = "ACM certificate ARN covering all four hostnames."
}

variable "backend_image" {
  type        = string
  description = "Immutable ECR image URI for the Express API."
}

variable "frontend_image" {
  type        = string
  description = "Immutable ECR image URI for the customer storefront."
}

variable "admin_image" {
  type        = string
  description = "Immutable ECR image URI for the admin dashboard."
}

variable "company_image" {
  type        = string
  description = "Immutable ECR image URI for the company dashboard."
}

variable "api_desired_count" {
  type        = number
  description = "ECS API task count."
  default     = 2
}

variable "web_desired_count" {
  type        = number
  description = "ECS web task count per static application."
  default     = 2
}

variable "documentdb_username" {
  type        = string
  description = "DocumentDB master username; this is not a password."
  default     = "taskadmin"
}

variable "weather_api_key" {
  type        = string
  description = "Optional Weather API key."
  default     = ""
  sensitive   = true
}

variable "sendinblue_api_key" {
  type        = string
  description = "Optional Brevo/Sendinblue API key."
  default     = ""
  sensitive   = true
}

variable "cloudinary_cloud_name" {
  type        = string
  description = "Optional Cloudinary cloud name for legacy multipart uploads."
  default     = ""
}

variable "cloudinary_api_key" {
  type        = string
  description = "Optional Cloudinary API key."
  default     = ""
  sensitive   = true
}

variable "cloudinary_api_secret" {
  type        = string
  description = "Optional Cloudinary API secret."
  default     = ""
  sensitive   = true
}

variable "pusher_app_id" {
  type        = string
  description = "Optional Pusher app id."
  default     = ""
}

variable "pusher_key" {
  type        = string
  description = "Optional Pusher key."
  default     = ""
}

variable "pusher_secret" {
  type        = string
  description = "Optional Pusher secret."
  default     = ""
  sensitive   = true
}

variable "pusher_cluster" {
  type        = string
  description = "Optional Pusher cluster."
  default     = ""
}

variable "mail_from_name" {
  type        = string
  description = "Transactional email sender name."
  default     = "Task"
}

variable "mail_from_email" {
  type        = string
  description = "Transactional email sender address."
  default     = "no-reply@example.com"
}

variable "metrics_token" {
  type        = string
  description = "Shared token for the protected metrics endpoint."
  default     = ""
  sensitive   = true
}

variable "hosted_zone_id" {
  type        = string
  description = "Optional Route53 hosted zone ID. Leave empty to create the ALB without DNS records."
  default     = ""
}
