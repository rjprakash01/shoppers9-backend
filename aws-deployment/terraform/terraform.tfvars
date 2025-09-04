# Terraform variables for Shoppers9 deployment

# Database configuration
db_password = "Shoppers9SecurePass123!"
db_username = "shoppers9_admin"

# Project configuration
project_name = "shoppers9"
environment = "prod"
aws_region = "us-east-1"

# Domain configuration
domain_name = "shoppers9.com"
admin_domain_name = "admin.shoppers9.com"
api_domain_name = "api.shoppers9.com"
certificate_arn = "arn:aws:acm:us-east-1:414691912398:certificate/bcbe5a67-3eb4-4d50-b783-f429b277dc89"

# Resource sizing for cost optimization
db_instance_class = "db.t3.medium"
ecs_backend_cpu = 256
ecs_backend_memory = 512
ecs_frontend_cpu = 256
ecs_frontend_memory = 512

# Disable deletion protection for easier cleanup during development
enable_deletion_protection = false
backup_retention_period = 1