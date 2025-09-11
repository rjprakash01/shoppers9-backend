#!/bin/bash

# Shoppers9 AWS Production Deployment Script
# This script builds and deploys all components to AWS with safety checks

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
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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

# Function to check if required tools are installed
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    if ! command -v aws &> /dev/null; then
        missing_tools+=("aws-cli")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if ! command -v terraform &> /dev/null; then
        missing_tools+=("terraform")
    fi
    
    if ! command -v node &> /dev/null; then
        missing_tools+=("node.js")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_error "Please install all required tools before proceeding."
        exit 1
    fi
    
    print_success "All prerequisites are installed."
}

# Function to run pre-deployment safety checks
run_safety_checks() {
    print_header "Running Pre-Deployment Safety Checks"
    
    cd "$ROOT_DIR"
    
    if [ ! -f "scripts/pre-deploy-check.sh" ]; then
        print_error "Pre-deployment check script not found!"
        exit 1
    fi
    
    if ! ./scripts/pre-deploy-check.sh; then
        print_error "Pre-deployment safety checks failed!"
        print_error "Please fix all issues before proceeding with deployment."
        exit 1
    fi
    
    print_success "All safety checks passed."
}

# Function to get AWS account ID
get_aws_account_id() {
    aws sts get-caller-identity --query Account --output text
}

# Function to check AWS authentication
check_aws_auth() {
    print_header "Verifying AWS Authentication"
    
    if ! aws sts get-caller-identity > /dev/null 2>&1; then
        print_error "AWS authentication failed. Please configure AWS CLI."
        exit 1
    fi
    
    local account_id=$(get_aws_account_id)
    local user_arn=$(aws sts get-caller-identity --query Arn --output text)
    
    print_success "AWS authentication successful"
    print_status "Account ID: $account_id"
    print_status "User ARN: $user_arn"
}

# Function to login to ECR
ecr_login() {
    print_header "Logging into ECR"
    
    local account_id=$(get_aws_account_id)
    
    if ! aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $account_id.dkr.ecr.$AWS_REGION.amazonaws.com; then
        print_error "ECR login failed"
        exit 1
    fi
    
    print_success "ECR login successful."
}

# Function to ensure ECR repositories exist
ensure_ecr_repositories() {
    print_header "Ensuring ECR Repositories Exist"
    
    local repositories=("backend" "admin-backend" "frontend" "admin-frontend")
    
    for repo in "${repositories[@]}"; do
        local repo_name="$PROJECT_NAME-$repo"
        
        if ! aws ecr describe-repositories --repository-names $repo_name --region $AWS_REGION > /dev/null 2>&1; then
            print_status "Creating ECR repository: $repo_name"
            aws ecr create-repository --repository-name $repo_name --region $AWS_REGION > /dev/null
        fi
        
        print_success "ECR repository ready: $repo_name"
    done
}

# Function to build and push Docker image
build_and_push() {
    local service=$1
    local dockerfile=$2
    local context=$3
    
    print_header "Building and Pushing $service"
    
    local account_id=$(get_aws_account_id)
    local repository_url="$account_id.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME-$service"
    local timestamp=$(date +%Y%m%d-%H%M%S)
    
    print_status "Building Docker image..."
    
    # Build the image
    if ! docker build -f "$dockerfile" -t "$repository_url:latest" "$context"; then
        print_error "Failed to build $service image"
        exit 1
    fi
    
    # Tag with timestamp
    docker tag "$repository_url:latest" "$repository_url:$timestamp"
    
    print_status "Pushing Docker image..."
    
    # Push both tags
    if ! docker push "$repository_url:latest"; then
        print_error "Failed to push $service image (latest)"
        exit 1
    fi
    
    if ! docker push "$repository_url:$timestamp"; then
        print_error "Failed to push $service image ($timestamp)"
        exit 1
    fi
    
    print_success "$service image pushed successfully."
    echo "  Latest: $repository_url:latest"
    echo "  Tagged: $repository_url:$timestamp"
}

# Function to build frontend applications
build_frontend() {
    local app_name=$1
    local app_dir=$2
    
    print_header "Building $app_name Frontend"
    
    cd "$ROOT_DIR/$app_dir"
    
    # Install dependencies
    print_status "Installing dependencies..."
    if ! npm ci; then
        print_error "Failed to install dependencies for $app_name"
        exit 1
    fi
    
    # Build for production
    print_status "Building for production..."
    if ! npm run build; then
        print_error "Failed to build $app_name"
        exit 1
    fi
    
    print_success "$app_name built successfully."
    
    cd "$ROOT_DIR"
}

# Function to build backend applications
build_backend() {
    local app_name=$1
    local app_dir=$2
    
    print_header "Building $app_name Backend"
    
    cd "$ROOT_DIR/$app_dir"
    
    # Install dependencies
    print_status "Installing dependencies..."
    if ! npm ci; then
        print_error "Failed to install dependencies for $app_name"
        exit 1
    fi
    
    # Build TypeScript
    print_status "Building TypeScript..."
    if ! npm run build; then
        print_error "Failed to build $app_name"
        exit 1
    fi
    
    print_success "$app_name built successfully."
    
    cd "$ROOT_DIR"
}

# Function to deploy infrastructure with Terraform
deploy_infrastructure() {
    print_header "Deploying Infrastructure with Terraform"
    
    cd "$ROOT_DIR/aws-deployment/terraform"
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    if ! terraform init; then
        print_error "Terraform initialization failed"
        exit 1
    fi
    
    # Validate configuration
    print_status "Validating Terraform configuration..."
    if ! terraform validate; then
        print_error "Terraform validation failed"
        exit 1
    fi
    
    # Plan deployment
    print_status "Planning infrastructure deployment..."
    if ! terraform plan -out=tfplan; then
        print_error "Terraform planning failed"
        exit 1
    fi
    
    # Apply deployment
    print_status "Applying infrastructure deployment..."
    if ! terraform apply tfplan; then
        print_error "Terraform deployment failed"
        exit 1
    fi
    
    print_success "Infrastructure deployed successfully."
    
    cd "$ROOT_DIR"
}

# Function to update ECS service
update_ecs_service() {
    local service_name=$1
    
    print_header "Updating ECS Service: $service_name"
    
    # Force new deployment
    if ! aws ecs update-service --cluster "$PROJECT_NAME-cluster" --service "$service_name" --force-new-deployment --region $AWS_REGION > /dev/null; then
        print_error "Failed to update ECS service: $service_name"
        exit 1
    fi
    
    print_status "Waiting for service to stabilize..."
    
    # Wait for service to stabilize
    if ! aws ecs wait services-stable --cluster "$PROJECT_NAME-cluster" --services "$service_name" --region $AWS_REGION; then
        print_error "Service failed to stabilize: $service_name"
        exit 1
    fi
    
    print_success "ECS service updated successfully: $service_name"
}

# Function to verify deployment
verify_deployment() {
    print_header "Verifying Deployment"
    
    local endpoints=(
        "https://api.shoppers9.com/health"
        "https://shoppers9.com"
        "https://admin.shoppers9.com"
    )
    
    for endpoint in "${endpoints[@]}"; do
        print_status "Checking $endpoint..."
        
        # Wait a bit for DNS propagation
        sleep 5
        
        if curl -f -s "$endpoint" > /dev/null; then
            print_success "$endpoint is responding"
        else
            print_warning "$endpoint is not responding (may need DNS propagation time)"
        fi
    done
    
    print_status "Deployment verification complete."
    print_warning "Note: It may take 5-10 minutes for DNS changes to propagate globally."
}

# Main deployment function
main() {
    print_header "Shoppers9 Production Deployment"
    print_warning "This will deploy to PRODUCTION environment!"
    
    # Confirmation prompt
    read -p "Are you sure you want to proceed? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_status "Deployment cancelled."
        exit 0
    fi
    
    # Run all deployment steps
    check_prerequisites
    run_safety_checks
    check_aws_auth
    
    # Deploy infrastructure first
    deploy_infrastructure
    
    # Setup ECR
    ecr_login
    ensure_ecr_repositories
    
    # Build applications
    build_backend "Main" "."
    build_backend "Admin" "shoppers9-admin-backend"
    build_frontend "Customer" "shoppers9-frontend"
    build_frontend "Admin" "shoppers9-admin-frontend"
    
    # Build and push Docker images
    build_and_push "backend" "aws-deployment/docker/Dockerfile.backend" "."
    build_and_push "admin-backend" "aws-deployment/docker/Dockerfile.admin" "."
    build_and_push "frontend" "aws-deployment/docker/Dockerfile.frontend" "."
    build_and_push "admin-frontend" "aws-deployment/docker/Dockerfile.admin-frontend" "."
    
    # Update ECS services
    update_ecs_service "$PROJECT_NAME-backend"
    update_ecs_service "$PROJECT_NAME-admin-backend"
    update_ecs_service "$PROJECT_NAME-frontend"
    update_ecs_service "$PROJECT_NAME-admin-frontend"
    
    # Verify deployment
    verify_deployment
    
    print_header "Deployment Complete"
    print_success "Shoppers9 has been successfully deployed to production!"
    
    echo -e "\n${GREEN}Next Steps:${NC}"
    echo "1. Update DNS records to point to the load balancer"
    echo "2. Configure MongoDB Atlas IP whitelist with production IPs"
    echo "3. Test all functionality thoroughly"
    echo "4. Monitor CloudWatch logs for any issues"
    echo "5. Set up monitoring and alerting"
    
    echo -e "\n${BLUE}Access URLs:${NC}"
    echo "Customer Site: https://shoppers9.com"
    echo "Admin Panel: https://admin.shoppers9.com"
    echo "API Endpoint: https://api.shoppers9.com"
}

# Run main function
main "$@"