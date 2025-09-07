# Shoppers9 AWS Deployment Guide

This guide will help you deploy the Shoppers9 e-commerce application to AWS using containerized services.

## 🚀 Quick Start

## ⚡ For Experienced Users

**Critical Steps (Do NOT skip)**:

1. **Create IAM user** with these managed policies:
   - `AmazonEC2FullAccess`, `AmazonECS_FullAccess`, `AmazonRDSFullAccess`
   - `CloudWatchFullAccess`, `ElasticLoadBalancingFullAccess`
   - Plus inline policy with `iam:*`, `kms:*`, `logs:*`

2. **Request quota increase**: IAM managed policies per user (10 → 20)

3. **Configure AWS CLI** with the new user credentials

4. **Deploy**:
   ```bash
   git clone https://github.com/rjprakash01/shoppers9-backend.git
   cd shoppers9-backend
   cp aws-deployment/.env.example aws-deployment/.env
   # Edit .env with your values
   cd aws-deployment/terraform
   terraform init && terraform apply -auto-approve
   ```

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

### Step 1: AWS Account Preparation

#### 1.1 Install AWS CLI
```bash
# macOS
brew install awscli

# Linux
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

#### 1.2 Create IAM User with Required Permissions

1. **Go to AWS Console → IAM → Users → Create User**
2. **User name**: `shoppers9-deployer` (or your preferred name)
3. **Attach the following managed policies**:
   - `AmazonEC2FullAccess`
   - `AmazonECS_FullAccess`
   - `AmazonRDSFullAccess`
   - `CloudWatchFullAccess`
   - `AmazonVPCFullAccess`
   - `ElasticLoadBalancingFullAccess`
   - `AmazonRoute53FullAccess`
   - `AWSCertificateManagerFullAccess`
   - `SecretsManagerReadWrite`
   - `AmazonEC2ContainerRegistryFullAccess`

4. **Create an inline policy named `TerraformDeploymentPolicy`**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "iam:*",
           "kms:*",
           "logs:*",
           "application-autoscaling:*",
           "elasticloadbalancing:*",
           "servicediscovery:*"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

5. **Create Access Keys**:
   - Go to Security credentials tab
   - Create access key for CLI usage
   - Download and save the credentials securely

#### 1.3 Request AWS Service Quota Increases

**Important**: Request these quota increases before deployment:

1. **Go to AWS Console → Service Quotas**
2. **Request increases for**:
   - **IAM**: Managed policies per user (increase from 10 to 20)
   - **EC2**: VPC Elastic IPs (if you have other EIPs in use)
   - **ECS**: Services per cluster (usually sufficient at default)
   - **DocumentDB**: Clusters per region (usually sufficient at default)

3. **Processing time**: 24-48 hours for most requests

#### 1.4 Configure AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key  
# Enter your preferred region (e.g., us-east-1)
# Enter output format (json)
```

#### 1.5 Verify Configuration
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

### Step 3: Pre-Deployment Checklist

**Before running Terraform, ensure**:

- ✅ IAM user created with all required policies
- ✅ Service quotas requested (if needed)
- ✅ AWS CLI configured and tested
- ✅ Environment variables configured
- ✅ Terraform installed (v1.5.0+)
- ✅ Docker installed and running

### Step 4: Infrastructure Deployment

#### 4.1 Initialize Terraform
```bash
cd aws-deployment/terraform
terraform init
```

#### 4.2 Review Deployment Plan
```bash
terraform plan
```

**Review the output carefully**:
- Check resource counts (should create ~30-40 resources)
- Verify region and naming conventions
- Ensure no unexpected deletions

#### 4.3 Deploy Infrastructure
```bash
terraform apply -auto-approve
```

**Expected deployment time**: 15-20 minutes

**If deployment fails**:
1. Check error messages for permission issues
2. Refer to [Troubleshooting section](#-troubleshooting)
3. Fix permissions and retry

#### 4.4 Build and Push Docker Images
```bash
# Return to project root
cd ../..

# Build and push images
./aws-deployment/scripts/deploy.sh images
```

#### 4.5 Deploy ECS Services
```bash
./aws-deployment/scripts/deploy.sh services
```

**Or deploy everything at once**:
```bash
./aws-deployment/scripts/deploy.sh all
```

### Step 5: Verify Deployment

#### 5.1 Check Infrastructure Status
```bash
# Check Terraform outputs
cd aws-deployment/terraform
terraform output

# Verify ECS cluster
aws ecs describe-clusters --clusters shoppers9-cluster

# Check DocumentDB cluster
aws docdb describe-db-clusters --db-cluster-identifier shoppers9-docdb-cluster
```

#### 5.2 Verify Services
```bash
# Check all services
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend shoppers9-admin shoppers9-frontend

# Check service health
aws ecs list-tasks --cluster shoppers9-cluster
```

#### 5.3 Test Application URLs
```bash
# Get load balancer DNS
aws elbv2 describe-load-balancers --names shoppers9-alb --query 'LoadBalancers[0].DNSName' --output text
```

**Test endpoints**:
- Frontend: `http://YOUR_ALB_DNS/`
- Admin: `http://YOUR_ALB_DNS/admin/`
- API: `http://YOUR_ALB_DNS/api/health`

#### 5.4 Monitor Logs
```bash
# Backend logs
aws logs tail /ecs/shoppers9-backend --follow

# Admin logs  
aws logs tail /ecs/shoppers9-admin --follow

# Frontend logs
aws logs tail /ecs/shoppers9-frontend --follow
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

### Permission Issues (Most Common)

#### 1. IAM Permission Errors

**Error**: `AccessDeniedException` for various AWS services

**Solution**:
1. **Check IAM user has all required policies** (see Step 1.2)
2. **Wait 5-10 minutes** after adding policies for propagation
3. **Verify policy attachment**:
   ```bash
   aws iam list-attached-user-policies --user-name your-username
   aws iam list-user-policies --user-name your-username
   ```

#### 2. CloudWatch Logs Permission Errors

**Error**: `logs:DeleteLogGroup` access denied

**Solution**:
1. **Add CloudWatchFullAccess policy** to your IAM user
2. **Or create inline policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "logs:*",
         "Resource": "*"
       }
     ]
   }
   ```

#### 3. KMS Key Access Errors

**Error**: `KMSKeyNotAccessibleFault`

**Solution**:
1. **Add KMS permissions** to your IAM user:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": "kms:*",
         "Resource": "*"
       }
     ]
   }
   ```

#### 4. RDS/DocumentDB Permission Errors

**Error**: `rds:DescribeGlobalClusters` access denied

**Solution**:
1. **Add AmazonRDSFullAccess policy** to your IAM user
2. **Ensure DocumentDB permissions** are included

### Deployment Issues

#### 1. Terraform Apply Failures

**Step-by-step resolution**:

1. **Clean up failed resources**:
   ```bash
   cd aws-deployment/terraform
   terraform destroy -auto-approve
   ```

2. **If destroy fails with permission errors**:
   - Fix IAM permissions first
   - Wait 5-10 minutes
   - Retry destroy

3. **Fresh deployment**:
   ```bash
   terraform init
   terraform plan
   terraform apply -auto-approve
   ```

#### 2. Service Won't Start

**Diagnosis**:
```bash
# Check logs
aws logs tail /ecs/shoppers9-backend --follow

# Check task definition
aws ecs describe-task-definition --task-definition shoppers9-backend

# Check service status
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend
```

**Common causes**:
- Environment variables missing
- Database connection issues
- Image pull failures
- Resource constraints

#### 3. Database Connection Issues

**Diagnosis**:
```bash
# Check DocumentDB cluster status
aws docdb describe-db-clusters --db-cluster-identifier shoppers9-docdb-cluster

# Check security groups
aws ec2 describe-security-groups --group-names shoppers9-docdb

# Test connectivity from ECS task
aws ecs run-task --cluster shoppers9-cluster --task-definition shoppers9-backend --launch-type FARGATE
```

**Solutions**:
- Verify security group rules
- Check subnet routing
- Validate credentials in Secrets Manager

#### 4. Load Balancer Issues

**Diagnosis**:
```bash
# Check load balancer status
aws elbv2 describe-load-balancers --names shoppers9-alb

# Check target group health
aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN

# Check listener rules
aws elbv2 describe-listeners --load-balancer-arn LOAD_BALANCER_ARN
```

**Common issues**:
- Target group not associated with load balancer
- Health check failures
- Security group blocking traffic

### Service Quota Issues

#### 1. IAM Policy Limit Exceeded

**Error**: Cannot attach more policies to user

**Solution**:
1. **Request quota increase**:
   - Go to AWS Console → Service Quotas
   - Search for "IAM"
   - Request increase for "Managed policies per user"
   - Increase from 10 to 20

2. **Alternative**: Consolidate policies into fewer, broader policies

#### 2. EIP Limit Exceeded

**Error**: Cannot allocate Elastic IP

**Solution**:
1. **Check current EIP usage**:
   ```bash
   aws ec2 describe-addresses
   ```

2. **Request quota increase** for VPC Elastic IPs

### Emergency Recovery

#### 1. Complete Infrastructure Reset

```bash
# Stop all services
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --desired-count 0
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-admin --desired-count 0
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-frontend --desired-count 0

# Wait for services to stop
aws ecs wait services-stable --cluster shoppers9-cluster --services shoppers9-backend shoppers9-admin shoppers9-frontend

# Force destroy (if normal destroy fails)
cd aws-deployment/terraform
terraform state list | xargs -I {} terraform state rm {}
terraform destroy -auto-approve

# Clean state
rm -f terraform.tfstate*
rm -rf .terraform/

# Fresh start
terraform init
terraform apply -auto-approve
```

#### 2. Manual Resource Cleanup

If Terraform fails to destroy resources:

1. **ECS Services**: Stop and delete manually
2. **Load Balancer**: Delete target groups first, then ALB
3. **DocumentDB**: Delete cluster instances, then cluster
4. **VPC**: Delete NAT gateways, then subnets, then VPC
5. **Security Groups**: Delete custom security groups
6. **IAM Roles**: Delete roles created by Terraform

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