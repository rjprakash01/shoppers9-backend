#!/bin/bash

# Production Security Configuration Script for Shoppers9
# This script helps configure security settings for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to generate secure random string
generate_secret() {
    local length=${1:-32}
    node -e "console.log(require('crypto').randomBytes($length).toString('hex'))"
}

# Function to get production server IPs from AWS
get_production_ips() {
    print_header "Getting Production Server IPs"
    
    cd aws-deployment/terraform
    
    if [ ! -f "terraform.tfstate" ]; then
        print_error "Terraform state not found. Deploy infrastructure first."
        return 1
    fi
    
    print_status "Retrieving NAT Gateway IPs..."
    
    local nat_ips=$(terraform output -json nat_gateway_ips 2>/dev/null || echo '[]')
    
    if [ "$nat_ips" = "[]" ]; then
        print_warning "NAT Gateway IPs not found in Terraform output."
        print_status "You can find them manually in AWS Console > VPC > NAT Gateways"
        return 1
    fi
    
    echo "$nat_ips" | jq -r '.[]' > ../../production-ips.txt
    
    print_success "Production IPs saved to production-ips.txt:"
    cat ../../production-ips.txt
    
    cd ../..
}

# Function to configure environment secrets
configure_secrets() {
    print_header "Configuring Production Secrets"
    
    # Generate JWT secret if not already set
    if grep -q "REPLACE_WITH_SECURE_JWT_SECRET" .env.production; then
        print_status "Generating JWT secret..."
        local jwt_secret=$(generate_secret 64)
        
        # Update all environment files
        sed -i.bak "s/REPLACE_WITH_SECURE_JWT_SECRET_MINIMUM_32_CHARACTERS/$jwt_secret/g" .env.production
        sed -i.bak "s/REPLACE_WITH_SECURE_JWT_SECRET_MINIMUM_32_CHARACTERS/$jwt_secret/g" shoppers9-admin-backend/.env.production
        
        print_success "JWT secret generated and configured."
    fi
    
    # Generate session secret if not already set
    if grep -q "REPLACE_WITH_SECURE_SESSION_SECRET" .env.production; then
        print_status "Generating session secret..."
        local session_secret=$(generate_secret 32)
        
        sed -i.bak "s/REPLACE_WITH_SECURE_SESSION_SECRET/$session_secret/g" .env.production
        sed -i.bak "s/REPLACE_WITH_SECURE_SESSION_SECRET/$session_secret/g" shoppers9-admin-backend/.env.production
        
        print_success "Session secret generated and configured."
    fi
    
    # Generate encryption key if not already set
    if grep -q "REPLACE_WITH_ENCRYPTION_KEY" .env.production; then
        print_status "Generating encryption key..."
        local encryption_key=$(generate_secret 32)
        
        sed -i.bak "s/REPLACE_WITH_ENCRYPTION_KEY/$encryption_key/g" .env.production
        sed -i.bak "s/REPLACE_WITH_ENCRYPTION_KEY/$encryption_key/g" shoppers9-admin-backend/.env.production
        
        print_success "Encryption key generated and configured."
    fi
    
    # Clean up backup files
    rm -f .env.production.bak shoppers9-admin-backend/.env.production.bak
    
    print_warning "Please manually configure the following in your .env.production files:"
    echo "  - MONGODB_URI (MongoDB Atlas connection string)"
    echo "  - TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER"
    echo "  - RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET"
    echo "  - SMTP_HOST, SMTP_USER, SMTP_PASS (if using email)"
    echo "  - VITE_RAZORPAY_KEY_ID (in frontend .env.production files)"
}

# Function to create MongoDB Atlas IP whitelist script
create_atlas_script() {
    print_header "Creating MongoDB Atlas Configuration Script"
    
    cat > configure-atlas.sh << 'EOF'
#!/bin/bash

# MongoDB Atlas IP Whitelist Configuration
# Run this script after getting production server IPs

echo "MongoDB Atlas Security Configuration"
echo "===================================="
echo
echo "1. Log in to MongoDB Atlas: https://cloud.mongodb.com"
echo "2. Navigate to your cluster > Network Access"
echo "3. Remove all existing IP addresses (especially 0.0.0.0/0)"
echo "4. Add the following production server IPs:"
echo

if [ -f "production-ips.txt" ]; then
    while read -r ip; do
        echo "   - $ip/32"
    done < production-ips.txt
else
    echo "   (Run get_production_ips first to get the IPs)"
fi

echo
echo "5. Ensure no development IPs are whitelisted"
echo "6. Create a database user 'shoppers9_prod' with readWrite permissions"
echo "7. Update MONGODB_URI in .env.production with the new credentials"
echo
echo "Security Checklist:"
echo "- [ ] Only production server IPs are whitelisted"
echo "- [ ] No 0.0.0.0/0 entries exist"
echo "- [ ] Database user has minimal required permissions"
echo "- [ ] Connection string uses strong password"
EOF

    chmod +x configure-atlas.sh
    print_success "MongoDB Atlas configuration script created: configure-atlas.sh"
}

# Function to create SSL certificate guide
create_ssl_guide() {
    print_header "Creating SSL Certificate Guide"
    
    cat > ssl-certificate-guide.md << 'EOF'
# SSL Certificate Setup Guide

## Step 1: Request Certificate in AWS Certificate Manager

1. Go to AWS Certificate Manager in the **us-east-1** region
2. Click "Request a certificate"
3. Choose "Request a public certificate"
4. Add domain names:
   - `shoppers9.com`
   - `*.shoppers9.com`
5. Choose "DNS validation"
6. Click "Request"

## Step 2: Validate Domain Ownership

1. In the certificate details, find the CNAME records
2. Add these CNAME records to your domain's DNS settings:
   ```
   Name: _abc123def456.shoppers9.com
   Type: CNAME
   Value: _xyz789abc123.acm-validations.aws.
   ```
3. Wait for validation to complete (usually 5-30 minutes)

## Step 3: Update Terraform Configuration

1. Copy the certificate ARN from AWS Console
2. Update `aws-deployment/terraform/variables.tf`:
   ```hcl
   variable "certificate_arn" {
     description = "ARN of the SSL certificate"
     type        = string
     default     = "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_CERT_ID"
   }
   ```

## Step 4: Deploy Infrastructure

Run the deployment script which will use the certificate for HTTPS.

## Verification

After deployment, verify HTTPS is working:
```bash
curl -I https://shoppers9.com
curl -I https://admin.shoppers9.com
curl -I https://api.shoppers9.com
```

All should return HTTP/2 200 with proper SSL certificates.
EOF

    print_success "SSL certificate guide created: ssl-certificate-guide.md"
}

# Function to create DNS configuration guide
create_dns_guide() {
    print_header "Creating DNS Configuration Guide"
    
    cat > dns-configuration-guide.md << 'EOF'
# DNS Configuration Guide

## After Infrastructure Deployment

1. Get the Application Load Balancer DNS name:
   ```bash
   cd aws-deployment/terraform
   terraform output alb_dns_name
   ```

2. In your domain registrar's DNS settings, create these records:

   **For Root Domain:**
   ```
   Type: A
   Name: @
   Value: [Use ALIAS/ANAME to ALB DNS name, or get ALB IP]
   ```

   **For Subdomains:**
   ```
   Type: CNAME
   Name: admin
   Value: your-alb-dns-name.us-east-1.elb.amazonaws.com
   
   Type: CNAME
   Name: api
   Value: your-alb-dns-name.us-east-1.elb.amazonaws.com
   ```

## Alternative: Using Route53 (Recommended)

If you transfer DNS to Route53:

1. Create a hosted zone for shoppers9.com
2. Update nameservers at your registrar
3. Create A records with ALIAS to the ALB:
   - shoppers9.com → ALB
   - admin.shoppers9.com → ALB
   - api.shoppers9.com → ALB

## Verification

After DNS propagation (5-60 minutes):
```bash
nslookup shoppers9.com
nslookup admin.shoppers9.com
nslookup api.shoppers9.com
```

All should resolve to the same IP address(es).
EOF

    print_success "DNS configuration guide created: dns-configuration-guide.md"
}

# Function to create production checklist
create_production_checklist() {
    print_header "Creating Production Deployment Checklist"
    
    cat > production-checklist.md << 'EOF'
# Production Deployment Checklist

## Pre-Deployment

- [ ] AWS CLI configured with production account
- [ ] Domain ownership verified (shoppers9.com)
- [ ] SSL certificate requested and validated
- [ ] MongoDB Atlas cluster created
- [ ] Razorpay production account setup
- [ ] Twilio production account setup (optional)
- [ ] SMTP service configured (optional)

## Security Configuration

- [ ] All placeholder values replaced in .env.production files
- [ ] JWT secrets generated (64+ characters)
- [ ] Session secrets generated (32+ characters)
- [ ] Encryption keys generated (32+ characters)
- [ ] USE_MOCK_SERVICES=false in all production configs
- [ ] CORS origins set to production domains only
- [ ] MongoDB Atlas IP whitelist configured (production IPs only)
- [ ] Database user has minimal required permissions

## Infrastructure Deployment

- [ ] Terraform configuration validated
- [ ] Infrastructure deployed successfully
- [ ] ECR repositories created
- [ ] ECS cluster running
- [ ] Application Load Balancer configured
- [ ] Security groups properly configured

## Application Deployment

- [ ] All Docker images built and pushed
- [ ] ECS services updated and stable
- [ ] Health checks passing
- [ ] Logs showing no errors

## DNS and SSL

- [ ] DNS records pointing to load balancer
- [ ] HTTPS working for all domains
- [ ] SSL certificates valid and trusted
- [ ] HTTP redirects to HTTPS

## Functional Testing

- [ ] Homepage loads correctly
- [ ] User registration works
- [ ] User login works
- [ ] Product browsing works
- [ ] Search functionality works
- [ ] Cart operations work
- [ ] Order placement works (test mode)
- [ ] Admin panel accessible
- [ ] Admin login works
- [ ] Product management works
- [ ] Order management works

## Performance and Monitoring

- [ ] CloudWatch logs configured
- [ ] Performance monitoring setup
- [ ] Error alerting configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented

## Security Verification

- [ ] No development endpoints accessible
- [ ] Rate limiting working
- [ ] CORS headers correct
- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] Database access restricted

## Go-Live

- [ ] Payment gateway switched to live mode
- [ ] Analytics tracking enabled
- [ ] SEO configurations applied
- [ ] Social media integrations tested
- [ ] Customer support channels ready

## Post-Deployment

- [ ] Monitor application for 24 hours
- [ ] Verify all integrations working
- [ ] Check performance metrics
- [ ] Review security logs
- [ ] Document any issues and resolutions
EOF

    print_success "Production checklist created: production-checklist.md"
}

# Main function
main() {
    print_header "Shoppers9 Production Security Configuration"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "aws-deployment" ]; then
        print_error "Please run this script from the shoppers9-backend root directory"
        exit 1
    fi
    
    # Configure secrets
    configure_secrets
    
    # Get production IPs if infrastructure is deployed
    get_production_ips || print_warning "Skipping IP retrieval - deploy infrastructure first"
    
    # Create configuration scripts and guides
    create_atlas_script
    create_ssl_guide
    create_dns_guide
    create_production_checklist
    
    print_header "Configuration Complete"
    print_success "Production security configuration completed!"
    
    echo -e "\n${GREEN}Next Steps:${NC}"
    echo "1. Review and complete manual configurations in .env.production files"
    echo "2. Follow ssl-certificate-guide.md to setup SSL certificates"
    echo "3. Run ./configure-atlas.sh after infrastructure deployment"
    echo "4. Follow dns-configuration-guide.md for DNS setup"
    echo "5. Use production-checklist.md to verify everything before go-live"
    
    echo -e "\n${YELLOW}Important:${NC}"
    echo "- Never commit .env.production files to version control"
    echo "- Store production secrets securely"
    echo "- Test thoroughly before switching payment gateway to live mode"
}

# Run main function
main "$@"