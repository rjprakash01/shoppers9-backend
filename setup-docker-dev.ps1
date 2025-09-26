#!/usr/bin/env pwsh
# Shoppers9 Docker Development Environment Setup Script
# This script sets up the complete Docker development environment for Shoppers9

Write-Host "Setting up Shoppers9 Docker Development Environment" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Function to check if Docker is installed and running
function Test-DockerInstallation {
    try {
        $dockerVersion = docker --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Docker is installed: $dockerVersion" -ForegroundColor Green
            
            # Check if Docker daemon is running
            docker info 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] Docker daemon is running" -ForegroundColor Green
                return $true
            } else {
                Write-Host "[ERROR] Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "[ERROR] Docker is not installed. Please install Docker Desktop." -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[ERROR] Error checking Docker installation: $_" -ForegroundColor Red
        return $false
    }
}

# Function to check if Docker Compose is available
function Test-DockerCompose {
    try {
        $composeVersion = docker compose version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Docker Compose is available: $composeVersion" -ForegroundColor Green
            return $true
        } else {
            Write-Host "[ERROR] Docker Compose is not available" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[ERROR] Error checking Docker Compose: $_" -ForegroundColor Red
        return $false
    }
}

# Function to create environment file
function New-EnvironmentFile {
    Write-Host "Creating .env file for development..." -ForegroundColor Yellow
    
    $envContent = @"
# Shoppers9 Development Environment Variables
# MongoDB Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin123

# Customer Backend Configuration
CUSTOMER_MONGODB_URI=mongodb://admin:admin123@mongodb:27017/shoppers9?authSource=admin
CUSTOMER_JWT_SECRET=dev_jwt_secret_key_2024_customer
CUSTOMER_JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_2024_customer
CUSTOMER_FRONTEND_URL=http://localhost:3000

# Admin Backend Configuration
ADMIN_MONGODB_URI=mongodb://admin:admin123@mongodb:27017/shoppers9_admin?authSource=admin
ADMIN_JWT_SECRET=dev_jwt_secret_key_2024_admin
ADMIN_JWT_REFRESH_SECRET=dev_jwt_refresh_secret_key_2024_admin
ADMIN_FRONTEND_URL=http://localhost:3001
SUPER_ADMIN_PASSWORD=SuperAdmin@123

# Redis Configuration
REDIS_PASSWORD=redis123

# Production URLs (for production deployment)
# CUSTOMER_FRONTEND_URL=https://yourdomain.com
# ADMIN_FRONTEND_URL=https://admin.yourdomain.com
"@

    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "[OK] .env file created successfully" -ForegroundColor Green
}

# Function to create MongoDB initialization script
function New-MongoInitScript {
    Write-Host "Creating MongoDB initialization script..." -ForegroundColor Yellow
    
    if (!(Test-Path "mongo-init")) {
        New-Item -ItemType Directory -Path "mongo-init" | Out-Null
    }
    
    $mongoInitContent = @"
// MongoDB Initialization Script for Shoppers9
// This script creates the necessary databases and users

print('Starting MongoDB initialization for Shoppers9...');

// Switch to admin database
db = db.getSiblingDB('admin');

// Create shoppers9 database and user
db = db.getSiblingDB('shoppers9');
db.createUser({
  user: 'shoppers9_user',
  pwd: 'shoppers9_password',
  roles: [
    { role: 'readWrite', db: 'shoppers9' }
  ]
});

// Create shoppers9_admin database and user
db = db.getSiblingDB('shoppers9_admin');
db.createUser({
  user: 'shoppers9_admin_user',
  pwd: 'shoppers9_admin_password',
  roles: [
    { role: 'readWrite', db: 'shoppers9_admin' }
  ]
});

// Create initial collections
db.createCollection('users');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('categories');

print('MongoDB initialization completed successfully!');
"@

    $mongoInitContent | Out-File -FilePath "mongo-init/init-mongo.js" -Encoding UTF8
    Write-Host "[OK] MongoDB initialization script created" -ForegroundColor Green
}

# Function to build and start services
function Start-DockerServices {
    Write-Host "Building and starting Docker services..." -ForegroundColor Yellow
    
    try {
        # Stop any existing containers
        Write-Host "Stopping existing containers..." -ForegroundColor Yellow
        docker compose down 2>$null
        
        # Build and start services
        Write-Host "Building Docker images..." -ForegroundColor Yellow
        docker compose build --no-cache
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK] Docker images built successfully" -ForegroundColor Green
            
            Write-Host "Starting services..." -ForegroundColor Yellow
            docker compose up -d
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[OK] All services started successfully" -ForegroundColor Green
                return $true
            } else {
                Write-Host "[ERROR] Failed to start services" -ForegroundColor Red
                return $false
            }
        } else {
            Write-Host "[ERROR] Failed to build Docker images" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "[ERROR] Error during Docker operations: $_" -ForegroundColor Red
        return $false
    }
}

# Function to show service status
function Show-ServiceStatus {
    Write-Host "Service Status:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    
    docker compose ps
    
    Write-Host ""
    Write-Host "Application URLs:" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Host "Customer Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "Admin Frontend:    http://localhost:3001" -ForegroundColor White
    Write-Host "Customer API:      http://localhost:5000" -ForegroundColor White
    Write-Host "Admin API:         http://localhost:5001" -ForegroundColor White
    Write-Host "MongoDB:           mongodb://localhost:27017" -ForegroundColor White
    Write-Host "Redis:             redis://localhost:6379" -ForegroundColor White
}

# Function to show helpful commands
function Show-HelpfulCommands {
    Write-Host ""
    Write-Host "Helpful Commands:" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host "View logs:           docker compose logs -f [service_name]" -ForegroundColor White
    Write-Host "Stop services:       docker compose down" -ForegroundColor White
    Write-Host "Restart services:    docker compose restart" -ForegroundColor White
    Write-Host "Rebuild services:    docker compose up --build" -ForegroundColor White
    Write-Host "Shell into service:  docker compose exec [service_name] sh" -ForegroundColor White
    Write-Host "View service status: docker compose ps" -ForegroundColor White
}

# Main execution
try {
    # Check prerequisites
    if (!(Test-DockerInstallation)) {
        exit 1
    }
    
    if (!(Test-DockerCompose)) {
        exit 1
    }
    
    # Create necessary files
    New-EnvironmentFile
    New-MongoInitScript
    
    # Start services
    if (Start-DockerServices) {
        Write-Host ""
        Write-Host "Shoppers9 Docker environment setup completed successfully!" -ForegroundColor Green
        Write-Host "" 
        
        # Wait a moment for services to fully start
        Write-Host "Waiting for services to fully initialize..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
        
        Show-ServiceStatus
        Show-HelpfulCommands
        
        Write-Host ""
        Write-Host "Your Shoppers9 development environment is ready!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Setup failed. Please check the error messages above." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Unexpected error during setup: $_" -ForegroundColor Red
    exit 1
}