# 🛒 Shoppers9 E-commerce Platform

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![React](https://img.shields.io/badge/React-19+-61DAFB.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)

*A modern, scalable e-commerce platform with advanced search, filtering, and admin capabilities*

</div>

## 🚀 Features

### 🔍 **Enhanced Search & Filtering**
- **Intelligent Search**: Real-time autocomplete with voice search support
- **Advanced Filtering**: Dynamic filters with price ranges, colors, ratings
- **Smart Suggestions**: AI-powered product recommendations
- **Search Analytics**: Performance tracking and optimization

### 🛍️ **Customer Experience**
- **Responsive Design**: Mobile-first, PWA-ready interface
- **Product Management**: Categories, variants, reviews, wishlist
- **Shopping Cart**: Persistent cart with coupon support
- **User Authentication**: Secure login with OTP verification

### 👨‍💼 **Admin Dashboard**
- **Product Management**: CRUD operations with bulk actions
- **Order Management**: Status tracking and fulfillment
- **Analytics**: Sales reports and customer insights
- **Content Management**: Banners, categories, coupons

### 🔒 **Security & Performance**
- **Security Headers**: Helmet.js, rate limiting, input sanitization
- **Performance**: Image optimization, lazy loading, caching
- **Accessibility**: WCAG 2.1 compliant, screen reader support
- **SEO Optimized**: Meta tags, structured data, sitemap

## 📁 Project Structure

```
shoppers9-backend/
├── 🔧 backend-shoppers9/          # Main API server (Express + TypeScript)
├── 🎨 shoppers9-frontend/         # Customer frontend (React + Vite)
├── 📊 shoppers9-admin-frontend/   # Admin dashboard (React + Vite)
├── ⚙️ shoppers9-admin-backend/    # Admin API services (Express)
├── ☁️ aws-deployment/             # AWS deployment configs
├── 📜 scripts/                    # Utility scripts
├── 📚 docs/                       # Documentation
└── 📦 package.json               # Monorepo configuration
```

## ⚡ Quick Start

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- **MongoDB** 6+ (Atlas or local)
- **Git** for version control

### 🔧 Installation

```bash
# Clone the repository
git clone https://github.com/rjprakash01/shoppers9-backend.git
cd shoppers9-backend

# Install all dependencies
npm run install:all

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and other configs
```

### 🚀 Development

```bash
# Start all services (recommended)
npm run dev

# Or start individual services:
npm run dev:backend      # API server (Port 5002)
npm run dev:frontend     # Customer app (Port 5174)
npm run dev:admin-backend    # Admin API (Port 5001)
npm run dev:admin-frontend   # Admin dashboard (Port 5173)
```

### 🌐 Access Points

- **Customer Frontend**: http://localhost:5174
- **Admin Dashboard**: http://localhost:5173
- **Main API**: http://localhost:5002/api
- **Admin API**: http://localhost:5001/api/admin

### 🏗️ Production Build

```bash
# Build all projects
npm run build:all

# Start production server
npm start
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt hashing
- **File Upload**: Multer with Cloudinary integration
- **Email**: Nodemailer with SMTP support
- **SMS**: Twilio integration for OTP

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router v7
- **State Management**: Context API with custom hooks
- **Forms**: React Hook Form with Yup validation
- **Icons**: Lucide React

### DevOps & Deployment
- **Containerization**: Docker with multi-stage builds
- **Cloud**: AWS ECS, ALB, RDS, S3, CloudFront
- **Infrastructure**: Terraform for IaC
- **CI/CD**: AWS CodeBuild with automated deployments
- **Monitoring**: CloudWatch logs and metrics

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [📋 Complete Documentation](docs/COMPLETE_DOCUMENTATION.md) | Comprehensive project overview |
| [🔧 Setup Guide](docs/SETUP_GUIDE.md) | Detailed installation instructions |
| [🚀 Deployment Guide](docs/DEPLOYMENT_GUIDE.md) | AWS deployment walkthrough |
| [🏭 Production Guide](docs/PRODUCTION_DEPLOYMENT_GUIDE.md) | Production deployment checklist |
| [🍃 MongoDB Setup](docs/MONGODB_ATLAS_SETUP.md) | Database configuration |
| [🌐 Domain Setup](docs/DOMAIN_SETUP_GUIDE.md) | DNS and SSL configuration |

## 🔐 Environment Configuration

### Required Environment Variables

```bash
# Server Configuration
PORT=5002
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/shoppers9
# or MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shoppers9

# JWT Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payment Gateway (Cashfree)
CASHFREE_APP_ID=your-cashfree-app-id
CASHFREE_SECRET_KEY=your-cashfree-secret
```

## 🧪 Testing

```bash
# Run all tests
npm run test:all

# Run tests for specific project
cd shoppers9-frontend && npm test
cd backend-shoppers9 && npm test
```

## 🚀 Deployment

### AWS Deployment (Recommended)

1. **Configure AWS CLI**:
   ```bash
   aws configure
   ```

2. **Deploy Infrastructure**:
   ```bash
   cd aws-deployment/terraform
   terraform init
   terraform plan
   terraform apply
   ```

3. **Deploy Application**:
   ```bash
   npm run deploy:production
   ```

### Docker Deployment

```bash
# Build and run with Docker Compose
cd aws-deployment
docker-compose up -d
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow **TypeScript** best practices
- Write **comprehensive tests**
- Use **conventional commits**
- Update **documentation** as needed
- Ensure **accessibility** compliance

## 📊 Performance Metrics

- **Lighthouse Score**: 90+ (Performance, Accessibility, SEO)
- **Core Web Vitals**: All metrics in green
- **Bundle Size**: Optimized with code splitting
- **API Response**: <200ms average response time
- **Search Performance**: <100ms autocomplete response

## 🔧 Maintenance

### Regular Tasks

```bash
# Update dependencies
npm run update:all

# Security audit
npm audit
npm audit fix

# Clean build artifacts
npm run clean:all

# Rebuild everything
npm run clean:install
```

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **MongoDB** for the flexible database
- **Tailwind CSS** for the utility-first styling
- **AWS** for reliable cloud infrastructure
- **Open Source Community** for the incredible tools

---

<div align="center">

**Built with ❤️ by the Shoppers9 Team**

[🌟 Star this repo](https://github.com/rjprakash01/shoppers9-backend) • [🐛 Report Bug](https://github.com/rjprakash01/shoppers9-backend/issues) • [💡 Request Feature](https://github.com/rjprakash01/shoppers9-backend/issues)

</div>