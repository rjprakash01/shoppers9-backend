# Shoppers9 Architecture Fix Documentation

## Overview
This document outlines the critical architecture issues that were identified and fixed in the Shoppers9 e-commerce platform to establish proper separation between the main website and admin panel.

## Issues Identified

### 1. Missing Admin Backend Service
- **Problem**: The admin frontend was incorrectly configured to use the main backend API
- **Impact**: Admin operations were mixed with customer operations, creating security and scalability issues
- **Solution**: Created dedicated admin backend service with separate ECR repository, ECS task definition, and service

### 2. Incorrect Service Mapping
- **Problem**: Admin ECS service was running frontend code instead of admin-specific backend
- **Impact**: Admin API endpoints were not properly isolated
- **Solution**: Separated admin frontend and admin backend into distinct services

### 3. Missing Infrastructure Components
- **Problem**: No ECR repository, security groups, or ALB configuration for admin backend
- **Impact**: Admin backend could not be deployed or accessed
- **Solution**: Added complete infrastructure setup for admin backend

### 4. API Configuration Issues
- **Problem**: Admin frontend services pointing to wrong API endpoints
- **Impact**: Admin panel could not communicate with backend services
- **Solution**: Updated API configurations and environment variables

## Architecture Overview

### Current Fixed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Load Balancer                │
│                         (Port 443/80)                      │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
              ┌───────▼────────┐  ┌───────▼────────┐
              │  Main Website  │  │  Admin Panel   │
              │   (Frontend)   │  │   (Frontend)   │
              │   Port 8080    │  │   Port 8080    │
              └───────┬────────┘  └───────┬────────┘
                      │                   │
              ┌───────▼────────┐  ┌───────▼────────┐
              │  Main Backend  │  │ Admin Backend  │
              │   Port 3001    │  │   Port 5001    │
              └────────────────┘  └────────────────┘
```

### Service Breakdown

#### Main Website Services
1. **Frontend Service** (`shoppers9-frontend`)
   - Port: 8080
   - Purpose: Customer-facing e-commerce website
   - ECR: `shoppers9-frontend`

2. **Backend Service** (`shoppers9-backend`)
   - Port: 3001
   - Purpose: Customer API, orders, products, authentication
   - ECR: `shoppers9-backend`

#### Admin Panel Services
1. **Admin Frontend Service** (`shoppers9-admin`)
   - Port: 8080
   - Purpose: Admin dashboard interface
   - ECR: `shoppers9-admin`

2. **Admin Backend Service** (`shoppers9-admin-backend`) - **NEWLY ADDED**
   - Port: 5001
   - Purpose: Admin-specific API operations
   - ECR: `shoppers9-admin-backend`

## Infrastructure Changes Made

### 1. ECR Repository
```hcl
resource "aws_ecr_repository" "admin_backend" {
  name                 = "${var.project_name}-admin-backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
  tags = var.tags
}
```

### 2. Security Group
```hcl
resource "aws_security_group" "ecs_admin_backend" {
  name_prefix = "${var.project_name}-ecs-admin-backend-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 5001
    to_port         = 5001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
}
```

### 3. ECS Task Definition
```hcl
resource "aws_ecs_task_definition" "admin_backend" {
  family                   = "${var.project_name}-admin-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  # ... container definitions
}
```

### 4. ECS Service
```hcl
resource "aws_ecs_service" "admin_backend" {
  name            = "${var.project_name}-admin-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.admin_backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"
}
```

### 5. ALB Target Group and Listener
```hcl
resource "aws_lb_target_group" "admin_backend" {
  name        = "${var.project_name}-admin-backend-tg"
  port        = 5001
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
}

resource "aws_lb_listener" "admin_backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "5001"
  protocol          = "HTTP"
}
```

### 6. CloudWatch Log Group
```hcl
resource "aws_cloudwatch_log_group" "admin_backend" {
  name              = "/ecs/${var.project_name}-admin-backend"
  retention_in_days = 30
  tags = var.tags
}
```

## Application Changes Made

### 1. Admin Frontend API Configuration
**File**: `shoppers9-admin-frontend/src/services/authService.ts`
```typescript
// Before
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.shoppers9.com';

// After
const API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:5001';
```

### 2. Environment Variables
**Development** (`.env.development`):
```
REACT_APP_ADMIN_API_URL=http://localhost:5001
```

**Production** (`.env.production`):
```
REACT_APP_ADMIN_API_URL=https://admin-api.shoppers9.com/admin-api
```

### 3. Docker Configuration
Created `Dockerfile` for admin backend:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## Deployment Process

### 1. Infrastructure Deployment
```bash
cd aws-deployment/terraform
terraform plan
terraform apply
```

### 2. Admin Backend Deployment
```bash
cd aws-deployment/scripts
./deploy-admin-backend.sh
```

### 3. Admin Frontend Deployment
```bash
# Update environment variables
# Build and deploy admin frontend
```

## Production URLs

### External (Customer-facing)
- **Main Website**: `https://shoppers9.com`
- **Main API**: `https://api.shoppers9.com`

### Internal (Admin-facing)
- **Admin Panel**: `https://admin.shoppers9.com`
- **Admin API**: `https://admin-api.shoppers9.com`

### ALB Routing Strategy
```
HTTPS (443) → ALB
├── shoppers9.com → Frontend Service (8080)
├── api.shoppers9.com/api/* → Backend Service (3001)
├── admin.shoppers9.com → Admin Frontend Service (8080)
└── admin-api.shoppers9.com/admin-api/* → Admin Backend Service (5001)
```

## Port Configuration

### Development
- Main Backend: `localhost:3001`
- Admin Backend: `localhost:5001`
- Main Frontend: `localhost:3000`
- Admin Frontend: `localhost:3002`

### Production (Internal)
- Main Backend: `3001`
- Admin Backend: `5001`
- Frontends: `8080`

### Production (External)
- HTTPS: `443`
- HTTP: `80` (redirects to HTTPS)

## Security Improvements

1. **Service Isolation**: Admin and customer services are completely separated
2. **Network Segmentation**: Different security groups for each service
3. **API Endpoint Separation**: Admin APIs are on separate domain/path
4. **Environment-specific Configuration**: Different API URLs for dev/prod

## Next Steps

1. **Deploy Infrastructure**: Apply Terraform changes
2. **Build and Deploy**: Use deployment scripts to push admin backend
3. **Update DNS**: Configure admin-api.shoppers9.com subdomain
4. **SSL Certificates**: Add SSL certificate for admin API domain
5. **Monitoring**: Set up CloudWatch alarms for new service
6. **Testing**: Verify admin panel functionality with new backend

## Verification Checklist

- [ ] ECR repository created for admin backend
- [ ] ECS task definition and service deployed
- [ ] ALB routing configured for admin API
- [ ] Admin frontend pointing to correct API
- [ ] Environment variables configured
- [ ] Docker image built and pushed
- [ ] CloudWatch logs working
- [ ] Health checks passing
- [ ] Admin panel functional
- [ ] API endpoints responding correctly

This architecture fix ensures proper separation of concerns, improved security, and scalable deployment for both the main e-commerce website and the admin panel.