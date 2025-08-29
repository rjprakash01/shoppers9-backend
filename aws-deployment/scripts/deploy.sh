#!/bin/bash

# Shoppers9 AWS Deployment Script
# This script builds and deploys all components to AWS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-"us-east-1"}
PROJECT_NAME=${PROJECT_NAME:-"shoppers9"}
ENVIRONMENT=${ENVIRONMENT:-"prod"}

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

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All prerequisites are installed."
}

# Function to get AWS account ID
get_aws_account_id() {
    aws sts get-caller-identity --query Account --output text
}

# Function to login to ECR
ecr_login() {
    print_status "Logging into ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $(get_aws_account_id).dkr.ecr.$AWS_REGION.amazonaws.com
    print_success "ECR login successful."
}

# Function to build and push Docker image
build_and_push() {
    local service=$1
    local dockerfile=$2
    local context=$3
    
    print_status "Building and pushing $service..."
    
    local account_id=$(get_aws_account_id)
    local repository_url="$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-$service"
    
    # Build the image
    docker build -f $dockerfile -t $repository_url:latest $context
    
    # Tag with timestamp
    local timestamp=$(date +%Y%m%d-%H%M%S)
    docker tag $repository_url:latest $repository_url:$timestamp
    
    # Push both tags
    docker push $repository_url:latest
    docker push $repository_url:$timestamp
    
    print_success "$service image pushed successfully."
}

# Function to update ECS service
update_ecs_service() {
    local service_name=$1
    
    print_status "Updating ECS service: $service_name..."
    
    aws ecs update-service \
        --cluster $PROJECT_NAME-cluster \
        --service $service_name \
        --force-new-deployment \
        --region $AWS_REGION
    
    print_success "ECS service $service_name updated."
}

# Function to wait for service to be stable
wait_for_service() {
    local service_name=$1
    
    print_status "Waiting for service $service_name to be stable..."
    
    aws ecs wait services-stable \
        --cluster $PROJECT_NAME-cluster \
        --services $service_name \
        --region $AWS_REGION
    
    print_success "Service $service_name is stable."
}

# Function to deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure with Terraform..."
    
    cd aws-deployment/terraform
    
    # Initialize Terraform
    terraform init
    
    # Plan the deployment
    terraform plan -var="aws_region=$AWS_REGION" -var="project_name=$PROJECT_NAME"
    
    # Apply the changes
    read -p "Do you want to apply these changes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform apply -var="aws_region=$AWS_REGION" -var="project_name=$PROJECT_NAME" -auto-approve
        print_success "Infrastructure deployed successfully."
    else
        print_warning "Infrastructure deployment cancelled."
        exit 1
    fi
    
    cd ../..
}

# Function to deploy applications
deploy_applications() {
    print_status "Deploying applications..."
    
    # Login to ECR
    ecr_login
    
    # Build and push images
    build_and_push "backend" "aws-deployment/docker/Dockerfile.backend" "."
    build_and_push "admin" "aws-deployment/docker/Dockerfile.admin" "."
    build_and_push "frontend" "aws-deployment/docker/Dockerfile.frontend" "."
    
    # Update ECS services
    update_ecs_service "$PROJECT_NAME-backend"
    update_ecs_service "$PROJECT_NAME-admin"
    update_ecs_service "$PROJECT_NAME-frontend"
    
    # Wait for services to be stable
    wait_for_service "$PROJECT_NAME-backend"
    wait_for_service "$PROJECT_NAME-admin"
    wait_for_service "$PROJECT_NAME-frontend"
    
    print_success "All applications deployed successfully."
}

# Function to get application URLs
get_application_urls() {
    print_status "Getting application URLs..."
    
    cd aws-deployment/terraform
    local lb_dns=$(terraform output -raw load_balancer_dns_name)
    cd ../..
    
    echo
    print_success "Application URLs:"
    echo "Frontend: http://$lb_dns"
    echo "Admin Panel: http://$lb_dns:3001"
    echo "API: http://$lb_dns:3000"
    echo
}

# Main deployment function
main() {
    print_status "Starting Shoppers9 deployment..."
    
    # Check prerequisites
    check_prerequisites
    
    # Parse command line arguments
    case "${1:-all}" in
        "infra")
            deploy_infrastructure
            ;;
        "apps")
            deploy_applications
            get_application_urls
            ;;
        "all")
            deploy_infrastructure
            deploy_applications
            get_application_urls
            ;;
        "urls")
            get_application_urls
            ;;
        *)
            echo "Usage: $0 [infra|apps|all|urls]"
            echo "  infra - Deploy only infrastructure"
            echo "  apps  - Deploy only applications"
            echo "  all   - Deploy infrastructure and applications (default)"
            echo "  urls  - Get application URLs"
            exit 1
            ;;
    esac
    
    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"