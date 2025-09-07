#!/bin/bash

# Pre-deployment safety checks for Shoppers9
# This script verifies that production configurations are correct

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CHECK]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Initialize error counter
ERROR_COUNT=0

# Function to increment error count
fail_check() {
    print_error "$1"
    ((ERROR_COUNT++))
}

# Function to check environment file
check_env_file() {
    local env_file=$1
    local service_name=$2
    
    print_header "Checking $service_name Environment Configuration"
    
    if [[ ! -f "$env_file" ]]; then
        fail_check "Environment file $env_file does not exist"
        return
    fi
    
    print_status "Checking $env_file..."
    
    # Check for localhost/dev URLs
    if grep -q "localhost" "$env_file"; then
        fail_check "Found localhost URLs in $env_file - production should not use localhost"
    else
        print_success "No localhost URLs found"
    fi
    
    # Check for development database URLs
    if grep -q "mongodb://127.0.0.1\|mongodb://localhost" "$env_file"; then
        fail_check "Found local MongoDB URLs in $env_file - production should use Atlas"
    else
        print_success "No local MongoDB URLs found"
    fi
    
    # Check NODE_ENV
    if grep -q "NODE_ENV=production" "$env_file"; then
        print_success "NODE_ENV is set to production"
    else
        fail_check "NODE_ENV is not set to production in $env_file"
    fi
    
    # Check USE_MOCK_SERVICES
    if grep -q "USE_MOCK_SERVICES=false" "$env_file"; then
        print_success "USE_MOCK_SERVICES is disabled for production"
    elif grep -q "USE_MOCK_SERVICES=true" "$env_file"; then
        fail_check "USE_MOCK_SERVICES is enabled in $env_file - should be false for production"
    fi
    
    # Check for placeholder values
    if grep -q "REPLACE_WITH_" "$env_file"; then
        fail_check "Found placeholder values in $env_file - all secrets must be configured"
    else
        print_success "No placeholder values found"
    fi
    
    # Check CORS origins for production domains
    if grep -q "shoppers9.com" "$env_file"; then
        print_success "Production domains found in CORS configuration"
    else
        print_warning "Production domains not found in CORS configuration"
    fi
}

# Function to check MongoDB Atlas configuration
check_mongodb_atlas() {
    print_header "Checking MongoDB Atlas Configuration"
    
    print_status "Verifying Atlas connection string format..."
    
    # Check if Atlas URI is properly formatted
    if grep -q "mongodb+srv://.*@.*\.mongodb\.net" ".env.production"; then
        print_success "Atlas connection string format is correct"
    else
        fail_check "Invalid Atlas connection string format in .env.production"
    fi
    
    print_warning "Manual check required: Verify Atlas IP whitelist only includes production server IPs"
    print_warning "Manual check required: Verify Atlas database user has appropriate permissions"
}

# Function to check AWS configuration
check_aws_config() {
    print_header "Checking AWS Configuration"
    
    print_status "Checking AWS CLI configuration..."
    
    if aws sts get-caller-identity > /dev/null 2>&1; then
        print_success "AWS CLI is configured and authenticated"
        aws sts get-caller-identity --query 'Account' --output text | xargs -I {} echo "AWS Account ID: {}"
    else
        fail_check "AWS CLI is not configured or authentication failed"
    fi
    
    print_status "Checking required AWS permissions..."
    print_warning "Manual check required: Verify AWS user has ECS, ECR, ALB, and Route53 permissions"
}

# Function to check SSL certificate
check_ssl_certificate() {
    print_header "Checking SSL Certificate"
    
    print_warning "Manual check required: Verify SSL certificate is issued for shoppers9.com and *.shoppers9.com"
    print_warning "Manual check required: Update certificate_arn in terraform/variables.tf"
}

# Function to check DNS configuration
check_dns_config() {
    print_header "Checking DNS Configuration"
    
    print_status "Checking domain resolution..."
    
    # Check if domains resolve (they might not yet if this is first deployment)
    if nslookup shoppers9.com > /dev/null 2>&1; then
        print_success "shoppers9.com resolves"
    else
        print_warning "shoppers9.com does not resolve yet (expected for first deployment)"
    fi
    
    if nslookup admin.shoppers9.com > /dev/null 2>&1; then
        print_success "admin.shoppers9.com resolves"
    else
        print_warning "admin.shoppers9.com does not resolve yet (expected for first deployment)"
    fi
}

# Function to check Docker configuration
check_docker_config() {
    print_header "Checking Docker Configuration"
    
    print_status "Checking Docker installation..."
    
    if command -v docker > /dev/null 2>&1; then
        print_success "Docker is installed"
        docker --version
    else
        fail_check "Docker is not installed"
    fi
    
    print_status "Checking Docker daemon..."
    
    if docker info > /dev/null 2>&1; then
        print_success "Docker daemon is running"
    else
        fail_check "Docker daemon is not running"
    fi
}

# Function to check Terraform configuration
check_terraform_config() {
    print_header "Checking Terraform Configuration"
    
    print_status "Checking Terraform installation..."
    
    if command -v terraform > /dev/null 2>&1; then
        print_success "Terraform is installed"
        terraform --version
    else
        fail_check "Terraform is not installed"
    fi
    
    print_status "Validating Terraform configuration..."
    
    cd aws-deployment/terraform
    if terraform validate; then
        print_success "Terraform configuration is valid"
    else
        fail_check "Terraform configuration validation failed"
    fi
    cd ../..
}

# Main execution
print_header "Shoppers9 Pre-Deployment Safety Checks"

# Run all checks
check_env_file ".env.production" "Main Backend"
check_env_file "shoppers9-admin-backend/.env.production" "Admin Backend"
check_env_file "shoppers9-frontend/.env.production" "Customer Frontend"
check_env_file "shoppers9-admin-frontend/.env.production" "Admin Frontend"
check_mongodb_atlas
check_aws_config
check_ssl_certificate
check_dns_config
check_docker_config
check_terraform_config

# Final summary
print_header "Pre-Deployment Check Summary"

if [[ $ERROR_COUNT -eq 0 ]]; then
    print_success "All critical checks passed! Ready for deployment."
    echo -e "\n${GREEN}✓ Safe to proceed with production deployment${NC}"
    exit 0
else
    print_error "$ERROR_COUNT critical issues found!"
    echo -e "\n${RED}✗ DO NOT proceed with deployment until all issues are resolved${NC}"
    exit 1
fi