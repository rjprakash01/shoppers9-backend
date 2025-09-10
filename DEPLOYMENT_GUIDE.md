# Shoppers9 Production Deployment Guide

## Prerequisites

- AWS CLI configured with appropriate permissions
- Docker installed and running
- Terraform installed
- Node.js and npm installed
- Access to AWS account with ECS, ECR, ALB permissions

## Step-by-Step Deployment

### Phase 1: Infrastructure Deployment

#### 1. Validate Terraform Configuration
```bash
cd aws-deployment/terraform
terraform validate
terraform fmt
```

#### 2. Plan Infrastructure Changes
```bash
terraform plan -out=tfplan
```

#### 3. Apply Infrastructure Changes
```bash
terraform apply tfplan
```

**Expected Resources Created:**
- ECR repository: `shoppers9-admin-backend`
- ECS task definition: `shoppers9-admin-backend`
- ECS service: `shoppers9-admin-backend`
- Security group: `shoppers9-ecs-admin-backend`
- ALB target group: `shoppers9-admin-backend-tg`
- ALB listener: port 5001
- CloudWatch log group: `/ecs/shoppers9-admin-backend`

### Phase 2: Admin Backend Deployment

#### 1. Build and Push Admin Backend
```bash
cd aws-deployment/scripts
./deploy-admin-backend.sh
```

**This script will:**
- Build Docker image for admin backend
- Tag image for ECR
- Push image to ECR repository
- Update ECS service with new image

#### 2. Verify Admin Backend Deployment
```bash
# Check ECS service status
aws ecs describe-services \
    --cluster shoppers9-cluster \
    --services shoppers9-admin-backend

# Check task status
aws ecs list-tasks \
    --cluster shoppers9-cluster \
    --service-name shoppers9-admin-backend

# Check logs
aws logs tail /ecs/shoppers9-admin-backend --follow
```

### Phase 3: Admin Frontend Configuration

#### 1. Update Environment Variables
```bash
cd shoppers9-admin-frontend

# Verify .env.production contains:
cat .env.production
# Should show: REACT_APP_ADMIN_API_URL=https://admin-api.shoppers9.com/admin-api
```

#### 2. Build Admin Frontend
```bash
npm run build
```

#### 3. Deploy Admin Frontend
```bash
# Build Docker image
docker build -t shoppers9-admin .

# Tag for ECR
docker tag shoppers9-admin:latest \$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-admin:latest

# Push to ECR
docker push \$AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/shoppers9-admin:latest

# Update ECS service
aws ecs update-service \
    --cluster shoppers9-cluster \
    --service shoppers9-admin \
    --force-new-deployment
```

### Phase 4: DNS and SSL Configuration

#### 1. Configure DNS Records
Add the following DNS records in your domain provider:

```
# Main website
shoppers9.com → ALB DNS name
www.shoppers9.com → ALB DNS name

# API endpoints
api.shoppers9.com → ALB DNS name
admin-api.shoppers9.com → ALB DNS name

# Admin panel
admin.shoppers9.com → ALB DNS name
```

#### 2. SSL Certificate
```bash
# Request SSL certificate for all domains
aws acm request-certificate \
    --domain-name shoppers9.com \
    --subject-alternative-names \
        www.shoppers9.com \
        api.shoppers9.com \
        admin.shoppers9.com \
        admin-api.shoppers9.com \
    --validation-method DNS
```

#### 3. Update Terraform with Certificate ARN
```bash
# Update terraform.tfvars
echo 'certificate_arn = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"' >> terraform.tfvars

# Apply changes
terraform plan
terraform apply
```

### Phase 5: Verification and Testing

#### 1. Health Check Endpoints
```bash
# Test main backend
curl https://api.shoppers9.com/health

# Test admin backend
curl https://admin-api.shoppers9.com/admin-api/health
```

#### 2. Admin Panel Access
1. Navigate to `https://admin.shoppers9.com`
2. Verify login functionality
3. Test admin operations (products, users, etc.)
4. Check browser network tab for API calls to admin-api domain

#### 3. Main Website Access
1. Navigate to `https://shoppers9.com`
2. Verify customer functionality
3. Test product browsing, cart, checkout
4. Check API calls go to api.shoppers9.com

### Phase 6: Monitoring Setup

#### 1. CloudWatch Alarms
```bash
# CPU utilization alarm for admin backend
aws cloudwatch put-metric-alarm \
    --alarm-name "shoppers9-admin-backend-cpu" \
    --alarm-description "Admin backend CPU utilization" \
    --metric-name CPUUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=shoppers9-admin-backend Name=ClusterName,Value=shoppers9-cluster

# Memory utilization alarm
aws cloudwatch put-metric-alarm \
    --alarm-name "shoppers9-admin-backend-memory" \
    --alarm-description "Admin backend memory utilization" \
    --metric-name MemoryUtilization \
    --namespace AWS/ECS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --dimensions Name=ServiceName,Value=shoppers9-admin-backend Name=ClusterName,Value=shoppers9-cluster
```

#### 2. Log Monitoring
```bash
# Set up log insights queries
aws logs start-query \
    --log-group-name "/ecs/shoppers9-admin-backend" \
    --start-time $(date -d '1 hour ago' +%s) \
    --end-time $(date +%s) \
    --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc'
```

## Rollback Procedures

### If Admin Backend Fails
```bash
# Scale down admin backend service
aws ecs update-service \
    --cluster shoppers9-cluster \
    --service shoppers9-admin-backend \
    --desired-count 0

# Revert admin frontend to use main backend temporarily
# Update environment variable and redeploy
```

### If Infrastructure Issues
```bash
# Revert Terraform changes
terraform plan -destroy -target=aws_ecs_service.admin_backend
terraform apply -target=aws_ecs_service.admin_backend
```

## Performance Optimization

### 1. Auto Scaling
```bash
# Enable auto scaling for admin backend
aws application-autoscaling register-scalable-target \
    --service-namespace ecs \
    --scalable-dimension ecs:service:DesiredCount \
    --resource-id service/shoppers9-cluster/shoppers9-admin-backend \
    --min-capacity 1 \
    --max-capacity 10
```

### 2. Load Balancer Optimization
- Enable connection draining
- Configure health check intervals
- Set up sticky sessions if needed

## Security Checklist

- [ ] All services use HTTPS
- [ ] Security groups restrict access appropriately
- [ ] Admin API not accessible from public internet directly
- [ ] Environment variables don't contain secrets
- [ ] CloudWatch logs don't expose sensitive data
- [ ] ECS task roles have minimal required permissions
- [ ] ECR repositories have appropriate access policies

## Maintenance

### Regular Tasks
1. **Weekly**: Check CloudWatch logs for errors
2. **Monthly**: Review and rotate secrets
3. **Quarterly**: Update dependencies and security patches
4. **As needed**: Scale services based on usage patterns

### Backup Strategy
1. **Database**: Automated MongoDB backups
2. **Images**: ECR image retention policies
3. **Configuration**: Terraform state backup
4. **Logs**: CloudWatch log retention policies

## Troubleshooting

### Common Issues

1. **Admin Backend Not Starting**
   ```bash
   # Check logs
   aws logs tail /ecs/shoppers9-admin-backend --follow
   
   # Check task definition
   aws ecs describe-task-definition --task-definition shoppers9-admin-backend
   ```

2. **API Connectivity Issues**
   ```bash
   # Check security groups
   aws ec2 describe-security-groups --group-names shoppers9-ecs-admin-backend
   
   # Check target group health
   aws elbv2 describe-target-health --target-group-arn TARGET_GROUP_ARN
   ```

3. **SSL Certificate Issues**
   ```bash
   # Check certificate status
   aws acm describe-certificate --certificate-arn CERT_ARN
   ```

### Support Contacts
- **Infrastructure**: DevOps Team
- **Application**: Development Team
- **Security**: Security Team

This deployment guide ensures a systematic approach to implementing the architecture fixes and establishing a robust production environment for both the main website and admin panel.