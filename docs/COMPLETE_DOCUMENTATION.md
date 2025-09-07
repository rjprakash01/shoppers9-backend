# Shoppers9 E-commerce Platform - Complete Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Local Development Setup](#local-development-setup)
4. [Docker Configuration](#docker-configuration)
5. [AWS Infrastructure](#aws-infrastructure)
6. [Terraform Deployment](#terraform-deployment)
7. [GoDaddy Domain Setup](#godaddy-domain-setup)
8. [Git Workflow](#git-workflow)
9. [Application Structure](#application-structure)
10. [API Documentation](#api-documentation)
11. [Security & Authentication](#security--authentication)
12. [Deployment Process](#deployment-process)
13. [Monitoring & Maintenance](#monitoring--maintenance)
14. [Troubleshooting](#troubleshooting)
15. [Environment Variables](#environment-variables)

---

## 🏗️ Project Overview

**Shoppers9** is a modern, full-stack e-commerce platform designed for scalability and performance. The platform consists of three main applications:

- **Customer Frontend**: React-based shopping interface
- **Admin Panel**: Management dashboard for store operations
- **Backend API**: Node.js REST API serving both applications

### Live URLs
- **Main Website**: https://shoppers9.com
- **Admin Panel**: https://admin.shoppers9.com
- **API Endpoint**: https://api.shoppers9.com

---

## 🛠️ Architecture & Technology Stack

### Frontend Technologies
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router DOM

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: AWS DocumentDB (MongoDB-compatible)
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express Validator

### Infrastructure
- **Cloud Provider**: Amazon Web Services (AWS)
- **Containerization**: Docker
- **Orchestration**: AWS ECS (Elastic Container Service)
- **Load Balancer**: AWS Application Load Balancer (ALB)
- **Container Registry**: AWS ECR (Elastic Container Registry)
- **Infrastructure as Code**: Terraform
- **SSL Certificates**: AWS Certificate Manager (ACM)
- **Domain Management**: GoDaddy DNS

---

## 🚀 Local Development Setup

### Prerequisites
```bash
# Required software
- Node.js 18 or higher
- npm or yarn
- Docker Desktop
- Git
- AWS CLI (for deployment)
- Terraform (for infrastructure)
```

### Clone Repository
```bash
git clone <repository-url>
cd shoppers9-backend
```

### Backend Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd shoppers9-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Admin Panel Setup
```bash
# Navigate to admin directory
cd shoppers9-admin-frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Local URLs
- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **Admin Panel**: http://localhost:5174

---

## 🐳 Docker Configuration

### Docker Files Structure
```
aws-deployment/docker/
├── Dockerfile.backend     # Backend API container
├── Dockerfile.frontend    # Customer frontend container
└── Dockerfile.admin       # Admin panel container
```

### Building Docker Images
```bash
# Backend
docker build -f aws-deployment/docker/Dockerfile.backend -t shoppers9-backend .

# Frontend
docker build -f aws-deployment/docker/Dockerfile.frontend -t shoppers9-frontend .

# Admin Panel
docker build -f aws-deployment/docker/Dockerfile.admin -t shoppers9-admin .
```

### Docker Compose for Local Development
```bash
# Start all services
cd aws-deployment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Docker Compose Configuration
```yaml
# aws-deployment/docker-compose.yml
version: '3.8'
services:
  backend:
    build:
      context: ..
      dockerfile: aws-deployment/docker/Dockerfile.backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongo:27017/shoppers9
    depends_on:
      - mongo

  frontend:
    build:
      context: ..
      dockerfile: aws-deployment/docker/Dockerfile.frontend
    ports:
      - "8080:8080"
    environment:
      - VITE_API_URL=http://localhost:3000

  admin:
    build:
      context: ..
      dockerfile: aws-deployment/docker/Dockerfile.admin
    ports:
      - "3001:3001"
    environment:
      - VITE_API_URL=http://localhost:3000

  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## ☁️ AWS Infrastructure

### AWS Services Used

#### Core Services
- **ECS (Elastic Container Service)**: Container orchestration
- **ALB (Application Load Balancer)**: Traffic distribution and SSL termination
- **ECR (Elastic Container Registry)**: Docker image storage
- **VPC (Virtual Private Cloud)**: Network isolation
- **DocumentDB**: MongoDB-compatible database

#### Security & Management
- **ACM (Certificate Manager)**: SSL certificate management
- **Secrets Manager**: Secure credential storage
- **CloudWatch**: Logging and monitoring
- **IAM**: Identity and access management

### Network Architecture

#### VPC Configuration
```
VPC CIDR: 10.0.0.0/16

Public Subnets:
- 10.0.1.0/24 (us-east-1a)
- 10.0.2.0/24 (us-east-1b)

Private Subnets:
- 10.0.3.0/24 (us-east-1a)
- 10.0.4.0/24 (us-east-1b)
```

#### Security Groups
```
ALB Security Group:
- Inbound: 80 (HTTP) from 0.0.0.0/0
- Inbound: 443 (HTTPS) from 0.0.0.0/0
- Outbound: All traffic

ECS Security Group:
- Inbound: 3000, 3001, 8080 from ALB Security Group
- Outbound: All traffic

DocumentDB Security Group:
- Inbound: 27017 from ECS Security Group
- Outbound: All traffic
```

### ECS Services Configuration

#### Service Specifications
```
shoppers9-backend:
- CPU: 512
- Memory: 1024 MB
- Port: 3000
- Desired Count: 1
- Health Check: /health

shoppers9-frontend:
- CPU: 256
- Memory: 512 MB
- Port: 8080
- Desired Count: 1
- Health Check: /

shoppers9-admin:
- CPU: 256
- Memory: 512 MB
- Port: 3001
- Desired Count: 1
- Health Check: /
```

### Load Balancer Configuration

#### Listener Rules
```
HTTPS Listener (Port 443):
1. Host: api.shoppers9.com → Backend Target Group
2. Host: admin.shoppers9.com → Admin Target Group
3. Host: shoppers9.com, www.shoppers9.com → Frontend Target Group

HTTP Listener (Port 80):
- Redirect to HTTPS
```

---

## 🏗️ Terraform Deployment

### Terraform File Structure
```
aws-deployment/terraform/
├── main.tf              # Provider configuration
├── variables.tf         # Input variables
├── terraform.tfvars     # Variable values
├── outputs.tf          # Output values
├── alb.tf              # Load balancer resources
├── ecs.tf              # Container service resources
├── ecr.tf              # Container registry resources
├── documentdb.tf       # Database resources
├── secrets.tf          # Secrets management
└── vpc.tf              # Network resources (if custom VPC)
```

### Key Configuration Files

#### terraform.tfvars
```hcl
# Project Configuration
aws_region = "us-east-1"
project_name = "shoppers9"
environment = "production"

# Domain Configuration
domain_name = "shoppers9.com"
admin_domain_name = "admin.shoppers9.com"
api_domain_name = "api.shoppers9.com"
certificate_arn = "arn:aws:acm:us-east-1:414691912398:certificate/bcbe5a67-3eb4-4d50-b783-f429b277dc89"

# Database Configuration
db_username = "shoppers9admin"
db_password = "SecurePassword123!"
db_instance_class = "db.t3.medium"

# ECS Configuration
backend_cpu = 512
backend_memory = 1024
frontend_cpu = 256
frontend_memory = 512
admin_cpu = 256
admin_memory = 512
```

### Deployment Commands
```bash
# Navigate to terraform directory
cd aws-deployment/terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply

# View outputs
terraform output

# Destroy infrastructure (if needed)
terraform destroy
```

### Important Terraform Outputs
```bash
# Get important values after deployment
terraform output load_balancer_dns_name
terraform output ecr_repository_urls
terraform output ecs_cluster_name
```

---

## 🌐 GoDaddy Domain Setup

### Step 1: Access GoDaddy DNS Management
1. Login to GoDaddy.com
2. Go to "My Products" → "Domains"
3. Find "shoppers9.com" and click "Manage"
4. Click "DNS" or "Manage DNS"

### Step 2: SSL Certificate Validation Records
**Add these CNAME records first (CRITICAL for SSL):**

```
Record 1:
Type: CNAME
Name: _6e43f07ea171d793ea24dfc08ca4f566
Value: _3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws
TTL: 600

Record 2:
Type: CNAME
Name: _6e43f07ea171d793ea24dfc08ca4f566.api
Value: _3a1f4e792c671b003413b4619d15cb38.xlfgrmvvlj.acm-validations.aws
TTL: 600

Record 3:
Type: CNAME
Name: _29af7727db749e77709d6b251812998b.www
Value: _d9aab72d6e7e93a9cd514e8feeb36aa5.xlfgrmvvlj.acm-validations.aws
TTL: 600

Record 4:
Type: CNAME
Name: _916715318f3af13bf19070399cc4e481.admin
Value: _2f4f093597ec578249606ed35ce5b0ab.xlfgrmvvlj.acm-validations.aws
TTL: 600
```

**Wait 30-60 minutes for SSL validation**

### Step 3: Website Routing Records
**Add these CNAME records after SSL validation:**

```
Record 1 (Root Domain):
Type: CNAME
Name: @
Value: shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
TTL: 600

Record 2 (WWW):
Type: CNAME
Name: www
Value: shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
TTL: 600

Record 3 (API):
Type: CNAME
Name: api
Value: shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
TTL: 600

Record 4 (Admin):
Type: CNAME
Name: admin
Value: shoppers9-alb-268030346.us-east-1.elb.amazonaws.com
TTL: 600
```

**Wait 2-24 hours for full DNS propagation**

### DNS Verification Commands
```bash
# Check DNS propagation
nslookup shoppers9.com
nslookup api.shoppers9.com
nslookup admin.shoppers9.com

# Check SSL certificate
openssl s_client -connect shoppers9.com:443 -servername shoppers9.com
```

---

## 📝 Git Workflow

### Repository Structure
```
shoppers9-backend/
├── src/                    # Backend source code
├── shoppers9-frontend/     # Customer frontend
├── shoppers9-admin-frontend/ # Admin panel
├── aws-deployment/         # Infrastructure and deployment
├── package.json           # Backend dependencies
└── README.md
```

### Branch Strategy
```
main                       # Production branch
├── develop               # Development branch
├── feature/user-auth     # Feature branches
├── feature/product-mgmt  # Feature branches
└── hotfix/security-fix   # Hotfix branches
```

### Git Commands
```bash
# Clone repository
git clone <repository-url>
cd shoppers9-backend

# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request (via GitHub/GitLab)
# After review, merge to develop

# Deploy to production
git checkout main
git merge develop
git push origin main
```

### Commit Message Convention
```
feat: add new feature
fix: bug fix
docs: documentation update
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

---

## 🏢 Application Structure

### Backend API Structure
```
src/
├── config/
│   └── database.ts         # Database connection
├── controllers/            # Route handlers
│   ├── authController.ts   # Authentication
│   ├── productController.ts # Product management
│   ├── orderController.ts  # Order processing
│   ├── cartController.ts   # Shopping cart
│   ├── userController.ts   # User management
│   ├── adminController.ts  # Admin operations
│   ├── bannerController.ts # Banner management
│   └── wishlistController.ts # Wishlist
├── models/                 # Database models
│   ├── User.ts            # User schema
│   ├── Product.ts         # Product schema
│   ├── Order.ts           # Order schema
│   ├── Cart.ts            # Cart schema
│   ├── Category.ts        # Category schema
│   ├── Banner.ts          # Banner schema
│   ├── Wishlist.ts        # Wishlist schema
│   ├── OTP.ts             # OTP schema
│   └── Support.ts         # Support schema
├── routes/                 # API routes
│   ├── auth.ts            # Authentication routes
│   ├── product.ts         # Product routes
│   ├── order.ts           # Order routes
│   ├── cart.ts            # Cart routes
│   ├── user.ts            # User routes
│   ├── admin.ts           # Admin routes
│   ├── banner.ts          # Banner routes
│   ├── payment.ts         # Payment routes
│   └── wishlist.ts        # Wishlist routes
├── middleware/             # Custom middleware
│   ├── auth.ts            # Authentication middleware
│   ├── validation.ts      # Input validation
│   ├── errorHandler.ts    # Error handling
│   └── notFoundHandler.ts # 404 handler
├── services/               # Business logic
│   ├── paymentService.ts  # Payment processing
│   └── smsService.ts      # SMS notifications
├── types/                  # TypeScript types
│   └── index.ts           # Type definitions
└── index.ts               # Application entry point
```

### Frontend Structure
```
shoppers9-frontend/src/
├── components/             # Reusable components
│   ├── Header.tsx         # Site header
│   ├── Footer.tsx         # Site footer
│   ├── ProductCard.tsx    # Product display
│   ├── CartItem.tsx       # Cart item
│   └── LoadingSpinner.tsx # Loading indicator
├── pages/                  # Page components
│   ├── Home.tsx           # Homepage
│   ├── ProductList.tsx    # Product listing
│   ├── ProductDetail.tsx  # Product details
│   ├── Cart.tsx           # Shopping cart
│   ├── Checkout.tsx       # Checkout process
│   ├── Login.tsx          # User login
│   ├── Register.tsx       # User registration
│   ├── Profile.tsx        # User profile
│   └── OrderHistory.tsx   # Order history
├── contexts/               # React contexts
│   ├── AuthContext.tsx    # Authentication state
│   ├── CartContext.tsx    # Cart state
│   └── ThemeContext.tsx   # Theme state
├── services/               # API services
│   ├── api.ts             # API client
│   ├── authService.ts     # Authentication API
│   ├── productService.ts  # Product API
│   └── orderService.ts    # Order API
├── utils/                  # Utility functions
│   ├── formatters.ts      # Data formatters
│   └── validators.ts      # Input validators
├── assets/                 # Static assets
│   ├── images/            # Images
│   └── icons/             # Icons
├── App.tsx                 # Main app component
└── main.tsx               # Application entry point
```

### Admin Panel Structure
```
shoppers9-admin-frontend/src/
├── components/             # Admin components
│   ├── Sidebar.tsx        # Navigation sidebar
│   ├── Dashboard.tsx      # Dashboard widgets
│   ├── DataTable.tsx      # Data table component
│   └── Modal.tsx          # Modal dialogs
├── pages/                  # Admin pages
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Products.tsx       # Product management
│   ├── Orders.tsx         # Order management
│   ├── Users.tsx          # User management
│   ├── Categories.tsx     # Category management
│   ├── Banners.tsx        # Banner management
│   └── Settings.tsx       # System settings
├── contexts/               # Admin contexts
│   ├── AdminAuthContext.tsx # Admin authentication
│   └── AdminDataContext.tsx # Admin data state
├── services/               # Admin API services
│   ├── adminApi.ts        # Admin API client
│   └── analyticsService.ts # Analytics API
└── utils/                  # Admin utilities
    ├── permissions.ts     # Permission checks
    └── exporters.ts       # Data export utilities
```

---

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890"
}
```

#### POST /api/auth/login
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST /api/auth/refresh
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Product Endpoints

#### GET /api/products
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 10)
- category: string
- search: string
- sortBy: string (price, name, createdAt)
- sortOrder: string (asc, desc)
```

#### GET /api/products/:id
```
Returns single product with details
```

#### POST /api/products (Admin only)
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "category-id",
  "images": ["image1.jpg", "image2.jpg"],
  "stock": 100,
  "specifications": {
    "color": "Red",
    "size": "Large"
  }
}
```

### Order Endpoints

#### POST /api/orders
```json
{
  "items": [
    {
      "productId": "product-id",
      "quantity": 2,
      "price": 99.99
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card"
}
```

#### GET /api/orders
```
Returns user's order history
```

### Cart Endpoints

#### GET /api/cart
```
Returns user's cart items
```

#### POST /api/cart/add
```json
{
  "productId": "product-id",
  "quantity": 1
}
```

#### PUT /api/cart/update
```json
{
  "productId": "product-id",
  "quantity": 3
}
```

#### DELETE /api/cart/remove/:productId
```
Removes item from cart
```

### Admin Endpoints

#### GET /api/admin/dashboard
```
Returns dashboard statistics
```

#### GET /api/admin/orders
```
Returns all orders with filters
```

#### PUT /api/admin/orders/:id/status
```json
{
  "status": "shipped"
}
```

---

## 🔐 Security & Authentication

### JWT Authentication

#### Token Structure
```javascript
// Access Token (15 minutes)
{
  "userId": "user-id",
  "email": "user@example.com",
  "role": "customer",
  "iat": 1234567890,
  "exp": 1234568790
}

// Refresh Token (7 days)
{
  "userId": "user-id",
  "tokenVersion": 1,
  "iat": 1234567890,
  "exp": 1234567890
}
```

#### Authentication Middleware
```typescript
// middleware/auth.ts
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};
```

### Role-Based Access Control

#### User Roles
```typescript
enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}
```

#### Permission Middleware
```typescript
export const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};
```

### Password Security
```typescript
// Password hashing with bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password validation
const isValidPassword = await bcrypt.compare(password, hashedPassword);
```

### Input Validation
```typescript
// Using express-validator
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('phone').isMobilePhone('any')
];
```

---

## 🚀 Deployment Process

### Complete Deployment Workflow

#### 1. Build and Push Docker Images
```bash
#!/bin/bash
# aws-deployment/scripts/deploy.sh

# Set variables
REGION="us-east-1"
ACCOUNT_ID="414691912398"
REPO_BASE="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $REPO_BASE

# Build and push backend
echo "Building backend..."
docker build -f aws-deployment/docker/Dockerfile.backend -t shoppers9-backend .
docker tag shoppers9-backend:latest $REPO_BASE/shoppers9-backend:latest
docker push $REPO_BASE/shoppers9-backend:latest

# Build and push frontend
echo "Building frontend..."
docker build -f aws-deployment/docker/Dockerfile.frontend -t shoppers9-frontend .
docker tag shoppers9-frontend:latest $REPO_BASE/shoppers9-frontend:latest
docker push $REPO_BASE/shoppers9-frontend:latest

# Build and push admin
echo "Building admin..."
docker build -f aws-deployment/docker/Dockerfile.admin -t shoppers9-admin .
docker tag shoppers9-admin:latest $REPO_BASE/shoppers9-admin:latest
docker push $REPO_BASE/shoppers9-admin:latest

echo "All images pushed successfully!"
```

#### 2. Deploy Infrastructure
```bash
# Deploy with Terraform
cd aws-deployment/terraform
terraform apply -auto-approve
```

#### 3. Update ECS Services
```bash
# Force new deployment to use latest images
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --force-new-deployment
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-frontend --force-new-deployment
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-admin --force-new-deployment
```

#### 4. Verify Deployment
```bash
# Check service status
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend shoppers9-frontend shoppers9-admin

# Check health
curl -f https://api.shoppers9.com/health
curl -f https://shoppers9.com
curl -f https://admin.shoppers9.com
```

### Automated CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push images
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        run: |
          # Build and push backend
          docker build -f aws-deployment/docker/Dockerfile.backend -t $ECR_REGISTRY/shoppers9-backend:latest .
          docker push $ECR_REGISTRY/shoppers9-backend:latest
          
          # Build and push frontend
          docker build -f aws-deployment/docker/Dockerfile.frontend -t $ECR_REGISTRY/shoppers9-frontend:latest .
          docker push $ECR_REGISTRY/shoppers9-frontend:latest
          
          # Build and push admin
          docker build -f aws-deployment/docker/Dockerfile.admin -t $ECR_REGISTRY/shoppers9-admin:latest .
          docker push $ECR_REGISTRY/shoppers9-admin:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --force-new-deployment
          aws ecs update-service --cluster shoppers9-cluster --service shoppers9-frontend --force-new-deployment
          aws ecs update-service --cluster shoppers9-cluster --service shoppers9-admin --force-new-deployment
```

---

## 📊 Monitoring & Maintenance

### Health Checks

#### Backend Health Endpoint
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version
  });
});
```

#### Load Balancer Health Checks
```
Backend Target Group:
- Path: /health
- Port: 3000
- Protocol: HTTP
- Healthy Threshold: 2
- Unhealthy Threshold: 3
- Timeout: 5 seconds
- Interval: 30 seconds

Frontend Target Group:
- Path: /
- Port: 8080
- Protocol: HTTP
- Healthy Threshold: 2
- Unhealthy Threshold: 3
- Timeout: 5 seconds
- Interval: 30 seconds
```

### CloudWatch Monitoring

#### Key Metrics to Monitor
```
ECS Metrics:
- CPUUtilization
- MemoryUtilization
- TaskCount
- ServiceEvents

ALB Metrics:
- RequestCount
- TargetResponseTime
- HTTPCode_Target_2XX_Count
- HTTPCode_Target_4XX_Count
- HTTPCode_Target_5XX_Count

DocumentDB Metrics:
- DatabaseConnections
- ReadLatency
- WriteLatency
- FreeStorageSpace
```

#### CloudWatch Alarms
```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "shoppers9-backend-high-cpu" \
  --alarm-description "Backend CPU utilization is too high" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# High error rate alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "shoppers9-alb-high-errors" \
  --alarm-description "ALB error rate is too high" \
  --metric-name HTTPCode_Target_5XX_Count \
  --namespace AWS/ApplicationELB \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### Log Management

#### Viewing Logs
```bash
# View ECS service logs
aws logs describe-log-groups
aws logs get-log-events --log-group-name /ecs/shoppers9-backend

# Tail logs in real-time
aws logs tail /ecs/shoppers9-backend --follow

# Filter logs
aws logs filter-log-events --log-group-name /ecs/shoppers9-backend --filter-pattern "ERROR"
```

### Scaling

#### Manual Scaling
```bash
# Scale ECS service
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --desired-count 3

# Scale down
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --desired-count 1
```

#### Auto Scaling Configuration
```bash
# Create auto scaling target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/shoppers9-cluster/shoppers9-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 1 \
  --max-capacity 5

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/shoppers9-cluster/shoppers9-backend \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name shoppers9-backend-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. SSL Certificate Not Validated

**Symptoms:**
- Website shows "Not Secure" in browser
- HTTPS requests fail
- Certificate status shows "PENDING_VALIDATION"

**Solutions:**
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:414691912398:certificate/bcbe5a67-3eb4-4d50-b783-f429b277dc89

# Verify DNS records in GoDaddy
nslookup _6e43f07ea171d793ea24dfc08ca4f566.shoppers9.com

# Wait for DNS propagation (30-60 minutes)
# Re-check certificate status
```

#### 2. Website Not Loading

**Symptoms:**
- 502 Bad Gateway errors
- Connection timeouts
- Load balancer health checks failing

**Diagnosis:**
```bash
# Check ECS service status
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend shoppers9-frontend shoppers9-admin

# Check target group health
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:414691912398:targetgroup/shoppers9-backend/abc123

# Check service logs
aws logs tail /ecs/shoppers9-backend --follow
```

**Solutions:**
```bash
# Restart ECS service
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --force-new-deployment

# Check security groups
aws ec2 describe-security-groups --group-ids sg-12345678

# Verify load balancer configuration
aws elbv2 describe-load-balancers --names shoppers9-alb
```

#### 3. Database Connection Issues

**Symptoms:**
- "Connection refused" errors
- Database timeout errors
- Authentication failures

**Diagnosis:**
```bash
# Check DocumentDB cluster status
aws docdb describe-db-clusters --db-cluster-identifier shoppers9-docdb

# Check security groups
aws ec2 describe-security-groups --filters "Name=group-name,Values=shoppers9-docdb-sg"

# Test connection from ECS task
aws ecs execute-command --cluster shoppers9-cluster --task <task-id> --container shoppers9-backend --interactive --command "/bin/bash"
```

**Solutions:**
```bash
# Update security group rules
aws ec2 authorize-security-group-ingress --group-id sg-docdb --protocol tcp --port 27017 --source-group sg-ecs

# Check connection string in secrets
aws secretsmanager get-secret-value --secret-id shoppers9/database

# Restart DocumentDB cluster if needed
aws docdb reboot-db-instance --db-instance-identifier shoppers9-docdb-instance
```

#### 4. Docker Build Failures

**Symptoms:**
- Build process fails
- "No such file or directory" errors
- Dependency installation failures

**Solutions:**
```bash
# Check Dockerfile syntax
docker build --no-cache -f aws-deployment/docker/Dockerfile.backend .

# Verify build context
ls -la aws-deployment/docker/

# Check base image availability
docker pull node:18-alpine

# Clear Docker cache
docker system prune -a
```

#### 5. High Memory/CPU Usage

**Symptoms:**
- Service restarts frequently
- Slow response times
- Out of memory errors

**Solutions:**
```bash
# Check resource utilization
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend

# Increase task resources
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --task-definition shoppers9-backend:2

# Scale horizontally
aws ecs update-service --cluster shoppers9-cluster --service shoppers9-backend --desired-count 2
```

### Useful Debugging Commands

```bash
# Check all ECS services
aws ecs list-services --cluster shoppers9-cluster

# Get service details
aws ecs describe-services --cluster shoppers9-cluster --services shoppers9-backend

# List running tasks
aws ecs list-tasks --cluster shoppers9-cluster --service-name shoppers9-backend

# Get task details
aws ecs describe-tasks --cluster shoppers9-cluster --tasks <task-arn>

# Check load balancer
aws elbv2 describe-load-balancers --names shoppers9-alb

# Check target groups
aws elbv2 describe-target-groups --load-balancer-arn <alb-arn>

# Check SSL certificate
aws acm list-certificates
aws acm describe-certificate --certificate-arn <cert-arn>

# Check DNS resolution
nslookup shoppers9.com
dig shoppers9.com

# Test HTTPS connection
curl -I https://shoppers9.com
openssl s_client -connect shoppers9.com:443
```

---

## 🔐 Environment Variables

### Backend Environment Variables

```bash
# Database Configuration
MONGODB_URI=mongodb://username:password@shoppers9-docdb.cluster-xyz.docdb.us-east-1.amazonaws.com:27017/shoppers9?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://shoppers9.com,https://admin.shoppers9.com

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=shoppers9-uploads

# Payment Gateway
PAYMENT_GATEWAY_API_KEY=pk_live_...
PAYMENT_GATEWAY_SECRET_KEY=sk_live_...
PAYMENT_WEBHOOK_SECRET=whsec_...

# SMS Service
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=SHOPPERS9

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@shoppers9.com
SMTP_PASS=your-email-password

# File Upload
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_SALT_ROUNDS=12
SESSION_SECRET=your-session-secret
CSRF_SECRET=your-csrf-secret

# Logging
LOG_LEVEL=info
LOG_FORMAT=combined

# Cache
REDIS_URL=redis://shoppers9-redis.abc123.cache.amazonaws.com:6379
CACHE_TTL=3600

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEW_RELIC_LICENSE_KEY=your-newrelic-key
```

### Frontend Environment Variables

```bash
# API Configuration
VITE_API_URL=https://api.shoppers9.com
VITE_API_TIMEOUT=10000

# App Configuration
VITE_APP_NAME=Shoppers9
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Modern E-commerce Platform

# Payment Gateway
VITE_PAYMENT_GATEWAY_PUBLIC_KEY=pk_live_...

# Google Services
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_GOOGLE_MAPS_API_KEY=AIza...

# Social Media
VITE_FACEBOOK_APP_ID=123456789
VITE_TWITTER_HANDLE=@shoppers9

# CDN
VITE_CDN_URL=https://cdn.shoppers9.com

# Feature Flags
VITE_ENABLE_WISHLIST=true
VITE_ENABLE_REVIEWS=true
VITE_ENABLE_CHAT=false

# SEO
VITE_SITE_URL=https://shoppers9.com
VITE_DEFAULT_META_TITLE=Shoppers9 - Your Online Shopping Destination
VITE_DEFAULT_META_DESCRIPTION=Discover amazing products at great prices
```

### Admin Panel Environment Variables

```bash
# API Configuration
VITE_API_URL=https://api.shoppers9.com
VITE_ADMIN_API_PREFIX=/api/admin

# App Configuration
VITE_APP_NAME=Shoppers9 Admin
VITE_APP_VERSION=1.0.0

# Authentication
VITE_SESSION_TIMEOUT=3600000
VITE_IDLE_TIMEOUT=1800000

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_EXPORT=true
VITE_ENABLE_BULK_OPERATIONS=true

# File Upload
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/*,application/pdf

# Pagination
VITE_DEFAULT_PAGE_SIZE=20
VITE_MAX_PAGE_SIZE=100
```

### Docker Environment Files

#### .env.production
```bash
# Production environment variables
NODE_ENV=production
PORT=3000
MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
AWS_REGION=us-east-1
```

#### .env.development
```bash
# Development environment variables
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/shoppers9
JWT_SECRET=dev-jwt-secret
JWT_REFRESH_SECRET=dev-refresh-secret
AWS_REGION=us-east-1
```

### AWS Secrets Manager

```bash
# Store sensitive data in AWS Secrets Manager
aws secretsmanager create-secret \
  --name "shoppers9/database" \
  --description "Database credentials for Shoppers9" \
  --secret-string '{
    "username": "shoppers9admin",
    "password": "SecurePassword123!",
    "host": "shoppers9-docdb.cluster-xyz.docdb.us-east-1.amazonaws.com",
    "port": 27017,
    "database": "shoppers9"
  }'

aws secretsmanager create-secret \
  --name "shoppers9/jwt" \
  --description "JWT secrets for Shoppers9" \
  --secret-string '{
    "secret": "your-super-secret-jwt-key-here",
    "refreshSecret": "your-super-secret-refresh-key-here"
  }'

aws secretsmanager create-secret \
  --name "shoppers9/payment" \
  --description "Payment gateway credentials" \
  --secret-string '{
    "publicKey": "pk_live_...",
    "secretKey": "sk_live_...",
    "webhookSecret": "whsec_..."
  }'
```

---

## 📞 Support & Maintenance

### Regular Maintenance Tasks

#### Weekly Tasks
- [ ] Review CloudWatch metrics and alarms
- [ ] Check ECS service health and performance
- [ ] Monitor database performance and storage
- [ ] Review application logs for errors
- [ ] Check SSL certificate expiration dates
- [ ] Verify backup integrity

#### Monthly Tasks
- [ ] Update dependencies and security patches
- [ ] Review and optimize AWS costs
- [ ] Analyze user behavior and performance metrics
- [ ] Update documentation
- [ ] Review and update security policies
- [ ] Test disaster recovery procedures

#### Quarterly Tasks
- [ ] Security audit and penetration testing
- [ ] Performance optimization review
- [ ] Infrastructure cost optimization
- [ ] Backup and recovery testing
- [ ] Update disaster recovery plan
- [ ] Review and update monitoring alerts

### Emergency Contacts

```
Development Team:
- Lead Developer: [email]
- DevOps Engineer: [email]
- Database Administrator: [email]

AWS Support:
- Support Plan: Business/Enterprise
- Case Priority: High/Critical

Third-party Services:
- Payment Gateway Support: [contact]
- SMS Service Support: [contact]
- Domain Registrar (GoDaddy): [contact]
```

### Backup and Recovery

#### Database Backups
```bash
# DocumentDB automated backups are enabled
# Manual backup
aws docdb create-db-cluster-snapshot \
  --db-cluster-identifier shoppers9-docdb \
  --db-cluster-snapshot-identifier shoppers9-manual-backup-$(date +%Y%m%d)

# Restore from backup
aws docdb restore-db-cluster-from-snapshot \
  --db-cluster-identifier shoppers9-docdb-restored \
  --snapshot-identifier shoppers9-manual-backup-20240830
```

#### Application Backups
```bash
# Backup application code
git archive --format=tar.gz --output=shoppers9-backup-$(date +%Y%m%d).tar.gz HEAD

# Backup Docker images
docker save shoppers9-backend:latest | gzip > shoppers9-backend-backup.tar.gz
```

---

**Document Version**: 1.0.0  
**Last Updated**: August 30, 2024  
**Environment**: Production  
**Maintained By**: Shoppers9 Development Team

---

*This documentation is a living document and should be updated regularly as the system evolves.*