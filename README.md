# Shoppers9 E-commerce Platform

A full-stack e-commerce platform with separate backend, frontend, and admin interfaces.

## Project Structure

```
shoppers9-backend/
├── backend-shoppers9/          # Main backend API server
├── shoppers9-frontend/         # Customer-facing frontend
├── shoppers9-admin-frontend/   # Admin dashboard frontend
├── shoppers9-admin-backend/    # Admin backend services
├── aws-deployment/             # AWS deployment configurations
├── scripts/                    # Utility scripts
├── docs/                       # Documentation files
└── package.json               # Root package.json for monorepo
```

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd shoppers9-backend
```

2. Install dependencies for all projects:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

Start all services in development mode:
```bash
npm run dev
```

Or start individual services:
```bash
# Backend API
cd backend-shoppers9 && npm run dev

# Frontend
cd shoppers9-frontend && npm run dev

# Admin Frontend
cd shoppers9-admin-frontend && npm run dev

# Admin Backend
cd shoppers9-admin-backend && npm run dev
```

### Build for Production

```bash
npm run build
```

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Complete Documentation](docs/COMPLETE_DOCUMENTATION.md)
- [Setup Guide](docs/SETUP_GUIDE.md)
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [Production Deployment](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)
- [MongoDB Atlas Setup](docs/MONGODB_ATLAS_SETUP.md)
- [Domain Setup](docs/DOMAIN_SETUP_GUIDE.md)

## Deployment

For AWS deployment, see the [AWS Deployment Guide](docs/DEPLOYMENT_GUIDE.md) and use the configurations in the `aws-deployment/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.