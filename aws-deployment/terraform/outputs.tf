# Outputs for Shoppers9 AWS infrastructure

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "load_balancer_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "load_balancer_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "ecr_backend_repository_url" {
  description = "URL of the backend ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_admin_repository_url" {
  description = "URL of the admin ECR repository"
  value       = aws_ecr_repository.admin.repository_url
}

output "ecr_frontend_repository_url" {
  description = "URL of the frontend ECR repository"
  value       = aws_ecr_repository.frontend.repository_url
}

output "documentdb_cluster_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.main.endpoint
  sensitive   = true
}

output "documentdb_cluster_reader_endpoint" {
  description = "DocumentDB cluster reader endpoint"
  value       = aws_docdb_cluster.main.reader_endpoint
  sensitive   = true
}

output "documentdb_cluster_port" {
  description = "DocumentDB cluster port"
  value       = aws_docdb_cluster.main.port
}

output "secrets_manager_mongodb_uri_arn" {
  description = "ARN of the MongoDB URI secret in Secrets Manager"
  value       = aws_secretsmanager_secret.mongodb_uri.arn
  sensitive   = true
}

output "secrets_manager_jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "backend_service_name" {
  description = "Name of the backend ECS service"
  value       = aws_ecs_service.backend.name
}

output "admin_service_name" {
  description = "Name of the admin ECS service"
  value       = aws_ecs_service.admin.name
}

output "frontend_service_name" {
  description = "Name of the frontend ECS service"
  value       = aws_ecs_service.frontend.name
}

output "backend_target_group_arn" {
  description = "ARN of the backend target group"
  value       = aws_lb_target_group.backend.arn
}

output "admin_target_group_arn" {
  description = "ARN of the admin target group"
  value       = aws_lb_target_group.admin.arn
}

output "frontend_target_group_arn" {
  description = "ARN of the frontend target group"
  value       = aws_lb_target_group.frontend.arn
}

output "application_urls" {
  description = "URLs to access the applications"
  value = {
    frontend = "http://${aws_lb.main.dns_name}"
    admin    = "http://${aws_lb.main.dns_name}:3001"
    api      = "http://${aws_lb.main.dns_name}:3000"
  }
}

output "deployment_commands" {
  description = "Commands to deploy the applications"
  value = {
    ecr_login = "aws ecr get-login-password --region ${var.aws_region} | docker login --username AWS --password-stdin ${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com"
    build_and_push_backend = "docker build -f aws-deployment/docker/Dockerfile.backend -t ${aws_ecr_repository.backend.repository_url}:latest . && docker push ${aws_ecr_repository.backend.repository_url}:latest"
    build_and_push_admin = "docker build -f aws-deployment/docker/Dockerfile.admin -t ${aws_ecr_repository.admin.repository_url}:latest . && docker push ${aws_ecr_repository.admin.repository_url}:latest"
    build_and_push_frontend = "docker build -f aws-deployment/docker/Dockerfile.frontend -t ${aws_ecr_repository.frontend.repository_url}:latest . && docker push ${aws_ecr_repository.frontend.repository_url}:latest"
  }
}