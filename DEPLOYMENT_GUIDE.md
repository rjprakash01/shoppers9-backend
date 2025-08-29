# Shoppers9 AWS Deployment Guide

This guide will help you deploy the Shoppers9 e-commerce application to AWS using containerized services.

## 🚀 Quick Start

### Prerequisites

1. **AWS Account** with appropriate permissions
2. **AWS CLI** installed and configured
3. **Docker** installed and running
4. **Terraform** installed (v1.5.0+)
5. **Node.js** installed (v18+)

### One-Command Deployment

```bash
# Clone the repository
git clone https://github.com/rjprakash01/shoppers9-backend.git
cd shoppers9-backend

# Configure environment variables
cp aws-deployment/.env.example aws-deployment/.env
# Edit .env with your actual values

# Deploy everything to AWS
./aws-deployment/scripts/deploy.sh all
```

## 📋 Detailed Setup

### Step 1: AWS Configuration

1. **Install AWS CLI**:
   ```bash
   # macOS
   brew install awscli
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS Credentials**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your preferred region (e.g., us-east-1)
   # Enter output format (json)
   ```

3. **Verify Configuration**:
   ```bash
   aws sts get-caller-identity
   ```

### Step 2: Environment Configuration

1. **Copy Environment Template**:
   ```bash
   cp aws-deployment/.env.example aws-deployment/.env
   ```

2. **Edit Environment Variables**:
   ```bash
   nano aws-deployment/.env
   ```

   Update the following required variables:
   ```bash
   # Database passwords (use strong passwords)
   MONGO_ROOT_PASSWORD=your_secure_root_password_here
   MONGO_USER_PASSWORD=your_secure_user_password_here
   
   # JWT secret (minimum 32 characters)
   JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
   
   # SMS API configuration
   SMS_API_KEY=your_sms_api_key_here
   
   # Razorpay configuration
   RAZORPAY_KEY_ID=your_razorpay_key_id_here
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
   ```

### Step 3: Infrastructure Deployment

1. **Deploy Infrastructure Only**:
   ```bash
   ./aws-deployment/scripts/deploy.sh infra
   ```

2. **Or Deploy Everything**:
   ```bash
   ./aws-deployment/scripts/deploy.sh all
   ```

### Step 4: Verify Deployment

1. **Get Application URLs**:
   ```bash
   ./aws-deployment/scripts/deploy.sh urls
   ```

2. **Check Service Status**:
   ```bash
   aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend shoppers9-admin shoppers9-frontend
   ```

## 🏠 Local Development

### Quick Local Setup

```bash
# Start all services locally
./aws-deployment/scripts/local-dev.sh start

# View logs
./aws-deployment/scripts/local-dev.sh logs

# Stop services
./aws-deployment/scripts/local-dev.sh stop
```

### Local URLs

- **Frontend**: http://localhost:3002
- **Admin Panel**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017

## 🔧 Configuration Options

### Terraform Variables

Customize your deployment by creating `aws-deployment/terraform/terraform.tfvars`:

```hcl
# Basic configuration
aws_region = "us-east-1"
project_name = "shoppers9"
environment = "prod"

# Domain configuration (optional)
domain_name = "yourdomain.com"
admin_domain_name = "admin.yourdomain.com"
api_domain_name = "api.yourdomain.com"
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Database configuration
db_instance_class = "db.t3.small"
db_allocated_storage = 20
db_password = "your_secure_database_password"

# ECS configuration
ecs_backend_cpu = 512
ecs_backend_memory = 1024
ecs_frontend_cpu = 256
ecs_frontend_memory = 512

# Security
enable_deletion_protection = true
backup_retention_period = 7
```

### SSL/HTTPS Setup

1. **Request SSL Certificate**:
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --subject-alternative-names "*.yourdomain.com" \
     --validation-method DNS
   ```

2. **Update Terraform Variables**:
   ```hcl
   certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id"
   domain_name = "yourdomain.com"
   admin_domain_name = "admin.yourdomain.com"
   api_domain_name = "api.yourdomain.com"
   ```

3. **Configure DNS**:
   Point your domain to the load balancer DNS name.

## 🔄 CI/CD with GitHub Actions

### Setup GitHub Secrets

Add the following secrets to your GitHub repository:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   ```
   AWS_ACCESS_KEY_ID: your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY: your_aws_secret_access_key
   ```

### Deployment Triggers

- **Automatic**: Push to `main` branch deploys to staging
- **Manual**: Use GitHub Actions workflow dispatch for production
- **Commit Message**: Include `[deploy-prod]` in commit message for production deployment

## 📊 Monitoring and Logging

### CloudWatch Logs

```bash
# View backend logs
aws logs tail /ecs/shoppers9-backend --follow

# View admin logs
aws logs tail /ecs/shoppers9-admin --follow

# View frontend logs
aws logs tail /ecs/shoppers9-frontend --follow
```

### Service Health

```bash
# Check ECS service status
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend

# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:region:account:targetgroup/shoppers9-backend-tg/id
```

## 🔧 Troubleshooting

### Common Issues

1. **Service Won't Start**
   ```bash
   # Check logs
   aws logs tail /ecs/shoppers9-backend --follow
   
   # Check task definition
   aws ecs describe-task-definition --task-definition shoppers9-backend
   ```

2. **Database Connection Issues**
   ```bash
   # Check DocumentDB cluster status
   aws docdb describe-db-clusters --db-cluster-identifier shoppers9-docdb-cluster
   
   # Check security groups
   aws ec2 describe-security-groups --group-names shoppers9-docdb
   ```

3. **Load Balancer Issues**
   ```bash
   # Check load balancer status
   aws elbv2 describe-load-balancers --names shoppers9-alb
   
   # Check target group health
   aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
   ```

### Debug Commands

```bash
# Get all ECS tasks
aws ecs list-tasks --cluster shoppers9-cluster

# Describe specific task
aws ecs describe-tasks --cluster shoppers9-cluster --tasks TASK_ARN

# Check service events
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend --query 'services[0].events'
```

## 💰 Cost Optimization

### Estimated Monthly Costs

- **ECS Fargate**: ~$50-100/month (depending on usage)
- **DocumentDB**: ~$200-400/month (2 instances)
- **Application Load Balancer**: ~$20/month
- **Data Transfer**: ~$10-50/month
- **CloudWatch Logs**: ~$5-20/month

**Total**: ~$285-590/month

### Cost Reduction Tips

1. **Use Fargate Spot** for non-critical workloads
2. **Right-size** your ECS tasks based on actual usage
3. **Enable** DocumentDB auto-scaling
4. **Set up** CloudWatch alarms for cost monitoring
5. **Use** Reserved Instances for predictable workloads

## 🔒 Security Best Practices

### Implemented Security Features

- ✅ **Network Isolation**: Services run in private subnets
- ✅ **Encryption**: Data encrypted at rest and in transit
- ✅ **Secrets Management**: Sensitive data in AWS Secrets Manager
- ✅ **IAM Roles**: Least privilege access principles
- ✅ **Security Groups**: Restrictive firewall rules
- ✅ **Container Scanning**: Vulnerability scanning enabled

### Additional Security Recommendations

1. **Enable AWS GuardDuty** for threat detection
2. **Set up AWS Config** for compliance monitoring
3. **Use AWS WAF** for web application firewall
4. **Enable VPC Flow Logs** for network monitoring
5. **Regular security audits** and penetration testing

## 🚀 Scaling

### Auto Scaling

The deployment includes auto-scaling configurations:

```bash
# Update service desired count
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --desired-count 4

# Enable auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/shoppers9-cluster/shoppers9-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10
```

### Performance Monitoring

```bash
# Monitor CPU and memory usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=shoppers9-backend Name=ClusterName,Value=shoppers9-cluster \
  --start-time 2023-01-01T00:00:00Z \
  --end-time 2023-01-02T00:00:00Z \
  --period 3600 \
  --statistics Average
```

## 🗑️ Cleanup

### Destroy All Resources

```bash
# Stop all services first
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --desired-count 0
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-admin --desired-count 0
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-frontend --desired-count 0

# Wait for services to stop
aws ecs wait services-stable --cluster shoppers9-cluster --services shoppers9-backend shoppers9-admin shoppers9-frontend

# Destroy infrastructure
cd aws-deployment/terraform
terraform destroy -auto-approve
```

⚠️ **Warning**: This will permanently delete all data and resources!

## 📞 Support

For issues and questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review [CloudWatch logs](#cloudwatch-logs)
3. Consult [AWS documentation](https://docs.aws.amazon.com/)
4. Create an issue in the GitHub repository

## 📝 License

This deployment configuration is part of the Shoppers9 project.

---

**Happy Deploying! 🚀**