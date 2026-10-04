terraform {
  # A module declares only what it needs. The version constraint mirrors the root
  # configuration so `terraform init` resolves one provider for both, and the
  # committed `.terraform.lock.hcl` at the root still governs the download.
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "names" {
  type        = list(string)
  description = "Repository names to create, e.g. [\"backend\", \"frontend\"]."

  validation {
    condition     = length(var.names) > 0
    error_message = "At least one repository name is required."
  }
}

variable "name_prefix" {
  type        = string
  description = "Prefix prepended to every repository name, keeping environments apart."
}

variable "kms_key_arn" {
  type        = string
  description = "ARN of the KMS key used to encrypt images at rest."

  validation {
    condition     = can(regex("^arn:aws[a-z-]*:kms:", var.kms_key_arn))
    error_message = "kms_key_arn must be a KMS key ARN; ECR rejects unencrypted repositories."
  }
}

variable "untagged_image_limit" {
  type        = number
  description = "How many untagged images to keep before expiring the oldest."
  default     = 10
}

variable "image_tag_mutability" {
  type        = string
  description = "Whether deployed tags may be overwritten. IMMUTABLE is the safe default."
  default     = "IMMUTABLE"

  validation {
    condition     = contains(["IMMUTABLE", "MUTABLE"], var.image_tag_mutability)
    error_message = "image_tag_mutability must be IMMUTABLE or MUTABLE."
  }
}

variable "tags" {
  type        = map(string)
  description = "Tags applied to every repository. The root provider supplies these through default_tags."
  default     = {}
}

resource "aws_ecr_repository" "this" {
  for_each = toset(var.names)

  name                 = "${var.name_prefix}-${each.key}"
  image_tag_mutability = var.image_tag_mutability
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "KMS"
    kms_key         = var.kms_key_arn
  }

  tags = var.tags
}

# An untagged layer is unreachable as a deploy candidate but still costs storage
# and registry quota, so it is expired on a count rather than left to accumulate.
resource "aws_ecr_lifecycle_policy" "this" {
  for_each = aws_ecr_repository.this

  repository = each.value.name
  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Expire untagged images above the configured limit"
      selection = {
        tagStatus   = "untagged"
        countType   = "imageCountMoreThan"
        countNumber = var.untagged_image_limit
      }
      action = { type = "expire" }
    }]
  })
}

output "repository_names" {
  value       = [for repository in aws_ecr_repository.this : repository.name]
  description = "Fully qualified repository names, keyed by the short name in `names`."
}

output "repositories" {
  value       = aws_ecr_repository.this
  description = "The repositories themselves, for callers that need the ARN or URL."
}

output "repository_urls" {
  value       = { for key, repository in aws_ecr_repository.this : key => repository.repository_url }
  description = "Registry URL per short name, for ECS `image` fields."
}

output "repository_arns" {
  value       = { for key, repository in aws_ecr_repository.this : key => repository.arn }
  description = "Repository ARN per short name, for IAM policies and resource scoping."
}