# Shoppers9 Production Deployment Guide

This guide provides step-by-step instructions for deploying Shoppers9 to production on AWS with proper security configurations.

## Prerequisites

### 1. Required Tools
- AWS CLI configured with appropriate permissions
- Docker installed and running
- Terraform >= 1.0
- Node.js >= 18
- Domain ownership of `shoppers9.com`

### 2. Required AWS Permissions
Your AWS user needs the following permissions:
- ECS (Elastic Container Service)
- ECR (Elastic Container Registry)
- ALB (Application Load Balancer)
- Route53 (DNS management)
- VPC (Virtual Private Cloud)
- IAM (Identity and Access Management)
- Secrets Manager
- CloudWatch (Logging and monitoring)

## Step 1: Configure Production Secrets

### 1.1 MongoDB Atlas Setup
1. Create a MongoDB Atlas account at https://cloud.mongodb.com
2. Create a new cluster named `shoppers9-prod`
3. Create a database user `shoppers9_prod` with read/write permissions
4. Configure IP Access List to allow only production server IPs (will be configured after AWS deployment)
5. Get the connection string and update `.env.production`:
   ```
   MONGODB_URI=mongodb+srv://shoppers9_prod:YOUR_PASSWORD@shoppers9-prod.mongodb.net/shoppers9?retryWrites=true&w=majority
   ```

### 1.2 JWT Secret Configuration
Generate a secure JWT secret (minimum 32 characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Update all `.env.production` files with this secret.

### 1.3 Payment Gateway Setup (Razorpay)
1. Create a Razorpay account at https://razorpay.com
2. Get production API keys from the dashboard
3. Update `.env.production` files with:
   ```
   RAZORPAY_KEY_ID=rzp_live_YOUR_KEY_ID
   RAZORPAY_KEY_SECRET=YOUR_SECRET_KEY
   ```

### 1.4 SMS Service Setup (Twilio)
1. Create a Twilio account at https://twilio.com
2. Get production credentials
3. Update `.env.production` with:
   ```
   TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID
   TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN
   TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE
   ```

### 1.5 Email Service Setup (Optional)
Configure SMTP settings for transactional emails:
```
SMTP_HOST=your-smtp-provider.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

## Step 2: SSL Certificate Setup

### 2.1 Request SSL Certificate in AWS Certificate Manager
1. Go to AWS Certificate Manager in the `us-east-1` region
2. Request a public certificate for:
   - `shoppers9.com`
   - `*.shoppers9.com` (wildcard for subdomains)
3. Choose DNS validation
4. Add the CNAME records to your domain's DNS
5. Wait for validation to complete
6. Copy the certificate ARN

### 2.2 Update Terraform Configuration
Update `aws-deployment/terraform/variables.tf`:
```hcl
variable "certificate_arn" {
  description = "ARN of the SSL certificate"
  type        = string
  default     = "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"
}
```

## Step 3: Infrastructure Deployment

### 3.1 Initialize Terraform
```bash
cd aws-deployment/terraform
terraform init
```

### 3.2 Plan Infrastructure
```bash
terraform plan -var="certificate_arn=arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"
```

### 3.3 Deploy Infrastructure
```bash
terraform apply -var="certificate_arn=arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"
```

This will create:
- VPC with public and private subnets
- ECS cluster
- Application Load Balancer
- ECR repositories
- Security groups
- IAM roles

### 3.4 Get Load Balancer DNS Name
After deployment, get the ALB DNS name:
```bash
terraform output alb_dns_name
```

## Step 4: DNS Configuration

### 4.1 Configure DNS Records
In your domain registrar's DNS settings, create CNAME records:

```
shoppers9.com        CNAME   your-alb-dns-name.us-east-1.elb.amazonaws.com
admin.shoppers9.com  CNAME   your-alb-dns-name.us-east-1.elb.amazonaws.com
api.shoppers9.com    CNAME   your-alb-dns-name.us-east-1.elb.amazonaws.com
```

## Step 5: Application Deployment

### 5.1 Run Pre-Deployment Checks
```bash
./scripts/pre-deploy-check.sh
```
Fix any issues before proceeding.

### 5.2 Deploy Applications
```bash
cd aws-deployment
./scripts/deploy.sh
```

This script will:
1. Build Docker images for all services
2. Push images to ECR
3. Update ECS services
4. Wait for deployment to complete

## Step 6: MongoDB Atlas Security Configuration

### 6.1 Get Production Server IPs
After ECS deployment, get the NAT Gateway IPs:
```bash
cd terraform
terraform output nat_gateway_ips
```

### 6.2 Update Atlas IP Access List
1. Go to MongoDB Atlas dashboard
2. Navigate to Network Access
3. Remove any development IPs (localhost, your laptop IP)
4. Add only the production NAT Gateway IPs
5. Ensure no `0.0.0.0/0` entries exist

## Step 7: Verification and Testing

### 7.1 Health Checks
Verify all services are healthy:
```bash
curl https://api.shoppers9.com/health
curl https://shoppers9.com
curl https://admin.shoppers9.com
```

### 7.2 Functional Testing
1. Test user registration and login
2. Test product browsing and search
3. Test cart functionality
4. Test order placement
5. Test admin panel access
6. Test payment processing (use test mode first)

### 7.3 Security Verification
1. Verify HTTPS is enforced
2. Check CORS headers are correct
3. Verify no development endpoints are accessible
4. Test rate limiting
5. Verify MongoDB access is restricted

## Step 8: Monitoring and Maintenance

### 8.1 CloudWatch Monitoring
- Set up CloudWatch alarms for:
  - ECS service health
  - Application errors
  - Database connections
  - Response times

### 8.2 Log Monitoring
- Configure log aggregation
- Set up error alerting
- Monitor security events

### 8.3 Backup Strategy
- Configure MongoDB Atlas automated backups
- Set up application data exports
- Document recovery procedures

## Security Checklist

- [ ] MongoDB Atlas IP whitelist configured (production IPs only)
- [ ] All environment variables use production values
- [ ] USE_MOCK_SERVICES=false in production
- [ ] HTTPS enforced for all domains
- [ ] CORS configured for production domains only
- [ ] Secrets stored securely (not in code)
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database user has minimal required permissions
- [ ] AWS IAM roles follow least privilege principle

## Rollback Procedure

If issues occur during deployment:

1. **Application Rollback**:
   ```bash
   aws ecs update-service --cluster shoppers9-prod --service shoppers9-backend --task-definition shoppers9-backend:PREVIOUS_REVISION
   ```

2. **Infrastructure Rollback**:
   ```bash
   cd aws-deployment/terraform
   terraform apply -target=aws_ecs_service.backend
   ```

3. **DNS Rollback**:
   - Point DNS back to previous infrastructure
   - Update CNAME records

## Troubleshooting

### Common Issues

1. **ECS Service Won't Start**
   - Check CloudWatch logs
   - Verify environment variables
   - Check security group rules

2. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist
   - Check connection string format
   - Verify database user permissions

3. **SSL Certificate Issues**
   - Ensure certificate covers all domains
   - Verify DNS validation records
   - Check certificate is in us-east-1 region

4. **CORS Issues**
   - Verify CORS_ORIGINS environment variable
   - Check browser developer tools
   - Ensure API URLs are correct

## Support and Maintenance

### Regular Tasks
- Monitor application performance
- Review security logs
- Update dependencies
- Backup verification
- Cost optimization

### Emergency Contacts
- AWS Support (if you have a support plan)
- MongoDB Atlas Support
- Domain registrar support
- Payment gateway support

For additional help, refer to the individual service documentation or contact the development team.