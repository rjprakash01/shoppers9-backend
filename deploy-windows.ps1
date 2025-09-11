# Shoppers9 Windows Deployment Script
# This script installs required tools and deploys to AWS

Write-Host "=== Shoppers9 Production Deployment ==="
Write-Host "Installing required tools and deploying to AWS"

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Install Chocolatey if not present
if (-not (Test-Command "choco")) {
    Write-Host "Installing Chocolatey..."
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    refreshenv
}

# Install AWS CLI if not present
if (-not (Test-Command "aws")) {
    Write-Host "Installing AWS CLI..."
    choco install awscli -y
    refreshenv
}

# Install Terraform if not present
if (-not (Test-Command "terraform")) {
    Write-Host "Installing Terraform..."
    choco install terraform -y
    refreshenv
}

# Install Docker if not present
if (-not (Test-Command "docker")) {
    Write-Host "Installing Docker Desktop..."
    choco install docker-desktop -y
    Write-Host "Please restart your computer after Docker installation and run this script again."
    exit
}

# Verify AWS credentials
Write-Host "Verifying AWS credentials..."
try {
    aws sts get-caller-identity
    Write-Host "AWS credentials verified successfully."
} catch {
    Write-Host "AWS credentials not configured. Please run 'aws configure' first."
    exit 1
}

# Navigate to terraform directory
Set-Location "$PSScriptRoot\aws-deployment\terraform"

# Initialize Terraform
Write-Host "Initializing Terraform..."
terraform init

# Create terraform.tfvars file with MongoDB Atlas configuration
$tfvarsContent = @"
db_password = "YOUR_MONGODB_ATLAS_PASSWORD_HERE"
project_name = "shoppers9"
environment = "prod"
aws_region = "us-east-1"
domain_name = "shoppers9.com"
"@

$tfvarsContent | Out-File -FilePath "terraform.tfvars" -Encoding UTF8

Write-Host "Created terraform.tfvars file. Please update the db_password with your MongoDB Atlas password."
Write-Host "Press any key to continue after updating the password..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Plan the deployment
Write-Host "Planning Terraform deployment..."
terraform plan

# Ask for confirmation
$confirmation = Read-Host "Do you want to proceed with the deployment? (yes/no)"
if ($confirmation -eq "yes") {
    Write-Host "Deploying infrastructure..."
    terraform apply -auto-approve
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Infrastructure deployed successfully!"
        Write-Host "Next steps:"
        Write-Host "1. Build and push Docker images"
        Write-Host "2. Deploy applications to ECS"
        Write-Host "3. Configure DNS and SSL"
    } else {
        Write-Host "Deployment failed. Please check the errors above."
    }
} else {
    Write-Host "Deployment cancelled."
}

Write-Host "Deployment script completed."