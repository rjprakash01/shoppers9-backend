#!/bin/bash

# Deploy Admin Backend to AWS ECS
# This script builds and pushes the admin backend Docker image to ECR

set -e

# Configuration
PROJECT_NAME="shoppers9"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT_NAME}-admin-backend"
ADMIN_BACKEND_DIR="../../shoppers9-admin-backend"

# Get the script directory and navigate to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ADMIN_BACKEND_DIR="$PROJECT_ROOT/shoppers9-admin-backend"

echo "🚀 Starting admin backend deployment..."
echo "📍 Project: ${PROJECT_NAME}"
echo "🌍 Region: ${AWS_REGION}"
echo "📦 ECR Repository: ${ECR_REPOSITORY}"

# Check if admin backend directory exists
if [ ! -d "$ADMIN_BACKEND_DIR" ]; then
    echo "❌ Error: Admin backend directory not found at $ADMIN_BACKEND_DIR"
    exit 1
fi

# Navigate to admin backend directory
cd "$ADMIN_BACKEND_DIR"

echo "📂 Working directory: $(pwd)"

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t ${PROJECT_NAME}-admin-backend .

# Tag image for ECR
echo "🏷️  Tagging image..."
docker tag ${PROJECT_NAME}-admin-backend:latest $ECR_REPOSITORY:latest

# Push image to ECR
echo "📤 Pushing image to ECR..."
docker push $ECR_REPOSITORY:latest

# Update ECS service
echo "🔄 Updating ECS service..."
aws ecs update-service \
    --cluster ${PROJECT_NAME}-cluster \
    --service ${PROJECT_NAME}-admin-backend \
    --force-new-deployment \
    --region $AWS_REGION

echo "✅ Admin backend deployment completed successfully!"
echo "🔗 Service: ${PROJECT_NAME}-admin-backend"
echo "🏷️  Image: $ECR_REPOSITORY:latest"