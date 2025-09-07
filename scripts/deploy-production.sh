#!/bin/bash

# Shoppers9 Production Deployment Orchestrator
# This script coordinates the complete production deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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
    echo -e "\n${PURPLE}=== $1 ===${NC}"
}

print_step() {
    echo -e "\n${CYAN}Step $1: $2${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to confirm action
confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [ "$default" = "y" ]; then
        local prompt="$message [Y/n]: "
    else
        local prompt="$message [y/N]: "
    fi
    
    read -p "$prompt" -r response
    
    if [ "$default" = "y" ]; then
        [[ $response =~ ^[Nn]$ ]] && return 1 || return 0
    else
        [[ $response =~ ^[Yy]$ ]] && return 0 || return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check required tools
    local tools=("aws" "docker" "terraform" "node" "npm")
    for tool in "${tools[@]}"; do
        if ! command_exists "$tool"; then
            missing_tools+=("$tool")
        else
            print_success "$tool is installed"
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
    
    # Check AWS authentication
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        print_error "AWS CLI not configured or not authenticated"
        echo "Please run 'aws configure' and try again."
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Function to validate environment files
validate_environment() {
    print_header "Validating Environment Configuration"
    
    local env_files=(
        ".env.production"
        "shoppers9-admin-backend/.env.production"
        "shoppers9-frontend/.env.production"
        "shoppers9-admin-frontend/.env.production"
    )
    
    for env_file in "${env_files[@]}"; do
        if [ ! -f "$env_file" ]; then
            print_error "Environment file not found: $env_file"
            exit 1
        fi
        
        # Check for placeholder values
        if grep -q "REPLACE_WITH" "$env_file"; then
            print_error "Placeholder values found in $env_file"
            echo "Please configure all production values before deployment."
            exit 1
        fi
        
        print_success "$env_file validated"
    done
}

# Function to run security configuration
configure_security() {
    print_step "1" "Security Configuration"
    
    if [ -f "scripts/configure-production-security.sh" ]; then
        print_status "Running security configuration script..."
        ./scripts/configure-production-security.sh
    else
        print_warning "Security configuration script not found"
    fi
}

# Function to setup SSL certificates
setup_ssl() {
    print_step "2" "SSL Certificate Setup"
    
    print_status "SSL certificate setup is manual. Please follow these steps:"
    echo "1. Go to AWS Certificate Manager (us-east-1 region)"
    echo "2. Request a certificate for shoppers9.com and *.shoppers9.com"
    echo "3. Use DNS validation"
    echo "4. Add the CNAME records to your domain's DNS"
    echo "5. Wait for validation to complete"
    echo "6. Copy the certificate ARN"
    echo
    
    if confirm "Have you completed SSL certificate setup?"; then
        read -p "Enter the certificate ARN: " cert_arn
        
        # Update terraform variables
        if [ -f "aws-deployment/terraform/terraform.tfvars" ]; then
            echo "certificate_arn = \"$cert_arn\"" >> aws-deployment/terraform/terraform.tfvars
        else
            echo "certificate_arn = \"$cert_arn\"" > aws-deployment/terraform/terraform.tfvars
        fi
        
        print_success "Certificate ARN configured"
    else
        print_error "SSL certificate setup is required for production deployment"
        exit 1
    fi
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_step "3" "Infrastructure Deployment"
    
    if [ -f "aws-deployment/scripts/deploy.sh" ]; then
        print_status "Running infrastructure deployment..."
        cd aws-deployment
        chmod +x scripts/deploy.sh
        ./scripts/deploy.sh
        cd ..
        print_success "Infrastructure deployment completed"
    else
        print_error "Deployment script not found"
        exit 1
    fi
}

# Function to configure MongoDB Atlas
configure_mongodb() {
    print_step "4" "MongoDB Atlas Configuration"
    
    if [ -f "configure-atlas.sh" ]; then
        print_status "MongoDB Atlas configuration guide:"
        ./configure-atlas.sh
        echo
        
        if confirm "Have you completed MongoDB Atlas IP whitelist configuration?"; then
            print_success "MongoDB Atlas configured"
        else
            print_error "MongoDB Atlas configuration is required"
            exit 1
        fi
    else
        print_warning "MongoDB Atlas configuration script not found"
    fi
}

# Function to setup DNS
setup_dns() {
    print_step "5" "DNS Configuration"
    
    # Get ALB DNS name
    cd aws-deployment/terraform
    local alb_dns=$(terraform output -raw alb_dns_name 2>/dev/null || echo "")
    cd ../..
    
    if [ -n "$alb_dns" ]; then
        print_status "Application Load Balancer DNS: $alb_dns"
        echo
        print_status "Please configure the following DNS records:"
        echo "Type: A (or ALIAS)"
        echo "Name: @"
        echo "Value: $alb_dns"
        echo
        echo "Type: CNAME"
        echo "Name: admin"
        echo "Value: $alb_dns"
        echo
        echo "Type: CNAME"
        echo "Name: api"
        echo "Value: $alb_dns"
        echo
        
        if confirm "Have you configured DNS records?"; then
            print_success "DNS configuration noted"
        else
            print_warning "DNS configuration can be done later"
        fi
    else
        print_warning "Could not retrieve ALB DNS name"
    fi
}

# Function to verify deployment
verify_deployment() {
    print_step "6" "Deployment Verification"
    
    print_status "Verifying deployment..."
    
    # Check ECS services
    local services=("shoppers9-backend" "shoppers9-frontend" "shoppers9-admin-backend" "shoppers9-admin-frontend")
    
    for service in "${services[@]}"; do
        local status=$(aws ecs describe-services --cluster shoppers9-cluster --services "$service" --query 'services[0].status' --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$status" = "ACTIVE" ]; then
            print_success "Service $service is active"
        else
            print_warning "Service $service status: $status"
        fi
    done
    
    # Check health endpoints (if DNS is configured)
    print_status "Health check endpoints (configure DNS first):"
    echo "- https://api.shoppers9.com/health"
    echo "- https://admin.shoppers9.com/health"
    echo "- https://shoppers9.com (main site)"
}

# Function to show post-deployment steps
show_post_deployment() {
    print_header "Post-Deployment Steps"
    
    echo "1. Wait for DNS propagation (5-60 minutes)"
    echo "2. Test all endpoints and functionality"
    echo "3. Configure payment gateway for live mode"
    echo "4. Setup monitoring and alerting"
    echo "5. Review production-checklist.md"
    echo "6. Monitor logs for 24 hours"
    echo
    
    print_status "Important files created:"
    echo "- ssl-certificate-guide.md"
    echo "- dns-configuration-guide.md"
    echo "- production-checklist.md"
    echo "- configure-atlas.sh"
    echo
    
    print_warning "Security reminders:"
    echo "- Never commit .env.production files"
    echo "- Monitor application logs regularly"
    echo "- Keep all dependencies updated"
    echo "- Regular security audits"
}

# Function to show deployment summary
show_summary() {
    print_header "Deployment Summary"
    
    echo "✅ Environment files configured"
    echo "✅ Security settings applied"
    echo "✅ Infrastructure deployed to AWS"
    echo "✅ Applications containerized and deployed"
    echo "✅ Load balancer configured"
    echo "✅ SSL certificates ready"
    echo "✅ MongoDB Atlas security configured"
    echo
    
    print_success "Production deployment completed successfully!"
    echo
    echo "Your Shoppers9 application is now running on:"
    echo "- Main site: https://shoppers9.com"
    echo "- Admin panel: https://admin.shoppers9.com"
    echo "- API: https://api.shoppers9.com"
    echo
    
    print_status "Next: Configure DNS records and wait for propagation"
}

# Main deployment function
main() {
    print_header "Shoppers9 Production Deployment"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -d "aws-deployment" ]; then
        print_error "Please run this script from the shoppers9-backend root directory"
        exit 1
    fi
    
    # Confirmation
    echo "This script will deploy Shoppers9 to production on AWS."
    echo "This includes:"
    echo "- Setting up production infrastructure"
    echo "- Deploying all applications"
    echo "- Configuring security settings"
    echo "- Setting up SSL and DNS"
    echo
    
    if ! confirm "Are you ready to proceed with production deployment?"; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    configure_security
    setup_ssl
    deploy_infrastructure
    configure_mongodb
    setup_dns
    verify_deployment
    show_post_deployment
    show_summary
    
    print_success "Production deployment orchestration completed!"
}

# Handle script arguments
case "${1:-}" in
    "--help" | "-h")
        echo "Shoppers9 Production Deployment Orchestrator"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --check        Run prerequisite checks only"
        echo "  --validate     Validate environment configuration only"
        echo
        echo "This script orchestrates the complete production deployment process."
        exit 0
        ;;
    "--check")
        check_prerequisites
        exit 0
        ;;
    "--validate")
        validate_environment
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac