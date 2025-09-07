# Variables for Shoppers9 AWS infrastructure

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "shoppers9"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.30.0/24", "10.0.40.0/24"]
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "shoppers9.com"
}

variable "admin_domain_name" {
  description = "Domain name for the admin panel"
  type        = string
  default     = "admin.shoppers9.com"
}

variable "api_domain_name" {
  description = "Domain name for the API"
  type        = string
  default     = "api.shoppers9.com"
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate"
  type        = string
  default     = ""
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "RDS master username"
  type        = string
  default     = "shoppers9_admin"
}

variable "db_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "ecs_backend_cpu" {
  description = "CPU units for backend ECS task"
  type        = number
  default     = 512
}

variable "ecs_backend_memory" {
  description = "Memory for backend ECS task"
  type        = number
  default     = 1024
}

variable "ecs_frontend_cpu" {
  description = "CPU units for frontend ECS task"
  type        = number
  default     = 256
}

variable "ecs_frontend_memory" {
  description = "Memory for frontend ECS task"
  type        = number
  default     = 512
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for RDS"
  type        = bool
  default     = true
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Shoppers9"
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}