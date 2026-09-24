resource "aws_ecs_cluster" "main" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${local.name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 1024
  memory                   = 2048
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = var.backend_image
    essential = true
    readonlyRootFilesystem = true
    portMappings = [{ containerPort = 4000, hostPort = 4000, protocol = "tcp" }]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "PORT", value = "4000" },
      { name = "AWS_REGION", value = var.aws_region },
      { name = "S3_BUCKET", value = aws_s3_bucket.uploads.bucket },
      { name = "S3_PREFIX", value = "uploads" },
      { name = "FRONTEND_URL", value = "https://${var.frontend_hostname}" },
      { name = "ADMIN_URL", value = "https://${var.admin_hostname}" },
      { name = "COMPANY_URL", value = "https://${var.company_hostname}" },
      { name = "IDEMPOTENCY_ENABLED", value = "true" }
    ]
    secrets = [
      { name = "MONGODB_URI", valueFrom = "${aws_secretsmanager_secret.application.arn}:MONGODB_URI::" },
      { name = "JWT_SECRET", valueFrom = "${aws_secretsmanager_secret.application.arn}:JWT_SECRET::" },
      { name = "REDIS_URL", valueFrom = "${aws_secretsmanager_secret.application.arn}:REDIS_URL::" },
      { name = "WEATHER_API_KEY", valueFrom = "${aws_secretsmanager_secret.application.arn}:WEATHER_API_KEY::" },
      { name = "SENDINBLUE_API_KEY", valueFrom = "${aws_secretsmanager_secret.application.arn}:SENDINBLUE_API_KEY::" },
      { name = "CLOUDINARY_CLOUD_NAME", valueFrom = "${aws_secretsmanager_secret.application.arn}:CLOUDINARY_CLOUD_NAME::" },
      { name = "CLOUDINARY_API_KEY", valueFrom = "${aws_secretsmanager_secret.application.arn}:CLOUDINARY_API_KEY::" },
      { name = "CLOUDINARY_API_SECRET", valueFrom = "${aws_secretsmanager_secret.application.arn}:CLOUDINARY_API_SECRET::" },
      { name = "PUSHER_APP_ID", valueFrom = "${aws_secretsmanager_secret.application.arn}:PUSHER_APP_ID::" },
      { name = "PUSHER_KEY", valueFrom = "${aws_secretsmanager_secret.application.arn}:PUSHER_KEY::" },
      { name = "PUSHER_SECRET", valueFrom = "${aws_secretsmanager_secret.application.arn}:PUSHER_SECRET::" },
      { name = "PUSHER_CLUSTER", valueFrom = "${aws_secretsmanager_secret.application.arn}:PUSHER_CLUSTER::" },
      { name = "MAIL_FROM_NAME", valueFrom = "${aws_secretsmanager_secret.application.arn}:MAIL_FROM_NAME::" },
      { name = "MAIL_FROM_EMAIL", valueFrom = "${aws_secretsmanager_secret.application.arn}:MAIL_FROM_EMAIL::" },
      { name = "METRICS_TOKEN", valueFrom = "${aws_secretsmanager_secret.application.arn}:METRICS_TOKEN::" }
    ]
    healthCheck = {
      command  = ["CMD-SHELL", "node -e \"fetch('http://127.0.0.1:4000/health/live').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))\""]
      interval = 30
      timeout  = 5
      retries  = 3
      startPeriod = 20
    }
    linuxParameters = {
      tmpfs = [
        { containerPath = "/app/uploads", size = 512, mountOptions = ["rw", "noexec", "nosuid"] },
        { containerPath = "/app/public/uploads", size = 512, mountOptions = ["rw", "noexec", "nosuid"] }
      ]
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/aws/ecs/${local.name}/backend"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  depends_on = [aws_cloudwatch_log_group.services["backend"]]
}

resource "aws_ecs_task_definition" "web" {
  for_each = toset(["frontend", "admin", "company"])

  family                   = "${local.name}-${each.key}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = each.key
    image     = var[each.key == "frontend" ? "frontend_image" : each.key == "admin" ? "admin_image" : "company_image"]
    essential = true
    readonlyRootFilesystem = true
    portMappings = [{ containerPort = 8080, hostPort = 8080, protocol = "tcp" }]
    environment = [
      { name = "PORT", value = "8080" },
      { name = "AWS_REGION", value = var.aws_region }
    ]
    healthCheck = {
      command  = ["CMD-SHELL", "wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1"]
      interval = 30
      timeout  = 5
      retries  = 3
      startPeriod = 10
    }
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/aws/ecs/${local.name}/${each.key}"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  depends_on = [aws_cloudwatch_log_group.services[each.key]]
}

resource "aws_ecs_service" "web" {
  for_each = toset(["frontend", "admin", "company"])

  name                               = each.key
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.web[each.key].arn
  desired_count                      = var.web_desired_count
  launch_type                        = "FARGATE"
  health_check_grace_period_seconds  = 30
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web[each.key].arn
    container_name   = each.key
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.https]
}

resource "aws_ecs_service" "backend" {
  name                               = "backend"
  cluster                            = aws_ecs_cluster.main.id
  task_definition                    = aws_ecs_task_definition.backend.arn
  desired_count                      = var.api_desired_count
  launch_type                        = "FARGATE"
  health_check_grace_period_seconds  = 60
  enable_execute_command             = true
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 4000
  }

  depends_on = [aws_lb_listener.https]
}
resource "aws_ecs_task_definition" "worker" {
  family                   = "${local.name}-worker"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = 512
  memory                   = 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "worker"
    image     = var.backend_image
    essential = true
    readonlyRootFilesystem = true
    command   = ["node", "scripts/background-worker.js"]
    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "WORKER_MODE", value = "true" },
      { name = "AWS_REGION", value = var.aws_region }
    ]
    secrets = [
      { name = "REDIS_URL", valueFrom = "${aws_secretsmanager_secret.application.arn}:REDIS_URL::" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/aws/ecs/${local.name}/worker"
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])

  depends_on = [aws_cloudwatch_log_group.services["worker"]]
}

resource "aws_ecs_service" "worker" {
  name                   = "worker"
  cluster                = aws_ecs_cluster.main.id
  task_definition        = aws_ecs_task_definition.worker.arn
  desired_count          = 1
  launch_type            = "FARGATE"
  enable_execute_command = true

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.app.id]
    assign_public_ip = false
  }
}


