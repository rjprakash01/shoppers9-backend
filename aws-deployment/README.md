# Shoppers9 AWS Deployment

This directory contains all the necessary files and configurations to deploy the Shoppers9 e-commerce application to AWS using containerized services.

## Architecture Overview

The deployment uses the following AWS services:

- **Amazon ECS (Fargate)**: Container orchestration for backend and frontend services
- **Amazon DocumentDB**: MongoDB-compatible database service
- **Application Load Balancer (ALB)**: Load balancing and SSL termination
- **Amazon ECR**: Container image registry
- **AWS Secrets Manager**: Secure storage for sensitive configuration
- **Amazon VPC**: Network isolation and security
- **CloudWatch**: Logging and monitoring

## Directory Structure

```
aws-deployment/
├── docker/                 # Docker configurations
│   ├── Dockerfile.backend   # Backend API container
│   ├── Dockerfile.admin     # Admin panel container
│   └── Dockerfile.frontend  # Customer frontend container
├── nginx/                   # Nginx configurations
│   ├── admin.conf          # Admin panel nginx config
│   └── frontend.conf       # Frontend nginx config
├── terraform/              # Infrastructure as Code
│   ├── main.tf             # Main infrastructure
│   ├── variables.tf        # Configuration variables
│   ├── ecs.tf              # ECS cluster and services
│   ├── ecr.tf              # Container registries
│   ├── alb.tf              # Load balancer
│   ├── secrets.tf          # Secrets management
│   ├── documentdb.tf       # Database configuration
│   └── outputs.tf          # Output values
├── ecs/                    # ECS task definitions
│   ├── task-definition-backend.json
│   ├── task-definition-admin.json
│   └── task-definition-frontend.json
├── mongodb/                # Database initialization
│   └── init-mongo.js       # MongoDB setup script
├── scripts/                # Deployment scripts
│   └── deploy.sh           # Main deployment script
├── docker-compose.yml      # Local development
├── .env.example           # Environment variables template
└── README.md              # This file
```

## Prerequisites

1. **AWS CLI** - Install and configure with appropriate credentials
2. **Docker** - For building container images
3. **Terraform** - For infrastructure deployment
4. **Node.js** - For building the applications

### AWS Permissions Required

Your AWS user/role needs the following permissions:
- ECS full access
- ECR full access
- VPC full access
- Application Load Balancer full access
- DocumentDB full access
- Secrets Manager full access
- CloudWatch Logs full access
- IAM role creation and management

## Quick Start

### 1. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 2. Set Up AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 3. Deploy Infrastructure and Applications

```bash
# Make the deployment script executable
chmod +x scripts/deploy.sh

# Deploy everything
./scripts/deploy.sh all
```

## Detailed Deployment Steps

### Step 1: Infrastructure Deployment

```bash
# Deploy only infrastructure
./scripts/deploy.sh infra
```

This will create:
- VPC with public and private subnets
- ECS cluster
- DocumentDB cluster
- Application Load Balancer
- ECR repositories
- Security groups
- IAM roles and policies

### Step 2: Application Deployment

```bash
# Deploy only applications
./scripts/deploy.sh apps
```

This will:
- Build Docker images for all services
- Push images to ECR
- Update ECS services
- Wait for services to be stable

### Step 3: Get Application URLs

```bash
# Get the URLs to access your applications
./scripts/deploy.sh urls
```

## Manual Deployment (Alternative)

### 1. Deploy Infrastructure with Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### 2. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -f docker/Dockerfile.backend -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-backend:latest .
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-backend:latest

# Build and push admin
docker build -f docker/Dockerfile.admin -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-admin:latest .
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-admin:latest

# Build and push frontend
docker build -f docker/Dockerfile.frontend -t ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-frontend:latest .
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-frontend:latest
```

### 3. Update ECS Services

```bash
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --force-new-deployment
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-admin --force-new-deployment
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-frontend --force-new-deployment
```

## Configuration

### Environment Variables

Update the following variables in your `.env` file:

```bash
# Database Configuration
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_USER_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_minimum_32_characters

# SMS API Configuration
SMS_API_KEY=your_sms_api_key

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Terraform Variables

Customize the deployment by modifying `terraform/variables.tf` or creating a `terraform.tfvars` file:

```hcl
aws_region = "us-east-1"
project_name = "shoppers9"
environment = "prod"
domain_name = "yourdomain.com"
admin_domain_name = "admin.yourdomain.com"
api_domain_name = "api.yourdomain.com"
```

## SSL/TLS Configuration

To enable HTTPS:

1. Request an SSL certificate in AWS Certificate Manager
2. Update the `certificate_arn` variable in Terraform
3. Configure your domain's DNS to point to the load balancer

## Monitoring and Logging

- **CloudWatch Logs**: Application logs are automatically sent to CloudWatch
- **ECS Service Metrics**: Monitor service health and performance
- **DocumentDB Monitoring**: Database performance metrics

### Accessing Logs

```bash
# View backend logs
aws logs tail /ecs/shoppers9-backend --follow

# View admin logs
aws logs tail /ecs/shoppers9-admin --follow

# View frontend logs
aws logs tail /ecs/shoppers9-frontend --follow
```

## Scaling

### Auto Scaling

The ECS services are configured with auto-scaling capabilities. You can modify the scaling policies in the Terraform configuration.

### Manual Scaling

```bash
# Scale backend service
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --desired-count 4
```

## Backup and Recovery

- **DocumentDB**: Automated backups are enabled with 7-day retention
- **Container Images**: ECR lifecycle policies manage image retention

## Security Best Practices

1. **Network Security**: Services run in private subnets
2. **Secrets Management**: Sensitive data stored in AWS Secrets Manager
3. **Encryption**: Data encrypted at rest and in transit
4. **IAM Roles**: Least privilege access principles
5. **Security Groups**: Restrictive firewall rules

## Troubleshooting

### Common Issues

1. **Service Won't Start**
   - Check CloudWatch logs for error messages
   - Verify environment variables and secrets
   - Ensure Docker images are built correctly

2. **Database Connection Issues**
   - Verify DocumentDB security groups
   - Check connection string in Secrets Manager
   - Ensure services are in the correct subnets

3. **Load Balancer Health Checks Failing**
   - Verify health check endpoints are responding
   - Check security group rules
   - Review application startup time

### Useful Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend

# View running tasks
aws ecs list-tasks --cluster shoppers9-cluster --service-name shoppers9-backend

# Get load balancer status
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
```

## Cost Optimization

1. **Right-sizing**: Monitor resource usage and adjust CPU/memory allocation
2. **Spot Instances**: Consider using Fargate Spot for non-critical workloads
3. **Reserved Capacity**: Use Savings Plans for predictable workloads
4. **Lifecycle Policies**: Automatically delete old container images

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This will delete all data and resources. Make sure to backup any important data first.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review CloudWatch logs
3. Consult AWS documentation
4. Contact your development team

## License

This deployment configuration is part of the Shoppers9 project.