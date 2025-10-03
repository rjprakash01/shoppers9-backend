# Shoppers9 Docker Setup Guide

This guide will help you set up and run the complete Shoppers9 e-commerce platform using Docker.

## 🚀 Quick Start

### Prerequisites

1. **Docker Desktop** - [Download and install Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. **Git** - For cloning the repository
3. **PowerShell** (Windows) or **Bash** (Linux/macOS)

### Automated Setup (Recommended)

Run the setup script to automatically configure your development environment:

```powershell
# Windows (PowerShell)
.\setup-docker-dev.ps1
```

```bash
# Linux/macOS (if you create a bash version)
./setup-docker-dev.sh
```

### Manual Setup

If you prefer to set up manually:

1. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

2. **Build and start services:**
   ```bash
   docker compose up --build -d
   ```

## 📋 Services Overview

| Service | Port | Description |
|---------|------|-------------|
| **shoppers9-frontend** | 3000 | Customer-facing React application |
| **shoppers9-admin-frontend** | 3001 | Admin dashboard React application |
| **backend-shoppers9** | 5000 | Customer API (Node.js/Express) |
| **shoppers9-admin-backend** | 5001 | Admin API (Node.js/Express) |
| **mongodb** | 27017 | MongoDB database |
| **redis** | 6379 | Redis cache and session store |

## 🌐 Application URLs

After starting the services, you can access:

- **Customer Store:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3001
- **Customer API:** http://localhost:5000/api
- **Admin API:** http://localhost:5001/api

## 🛠️ Development Commands

### Basic Operations

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Restart all services
docker compose restart

# Rebuild and start (after code changes)
docker compose up --build

# View service status
docker compose ps
```

### Logs and Debugging

```bash
# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f backend-shoppers9
docker compose logs -f shoppers9-admin-backend
docker compose logs -f shoppers9-frontend
docker compose logs -f shoppers9-admin-frontend

# Access service shell
docker compose exec backend-shoppers9 sh
docker compose exec mongodb mongosh
```

### Database Operations

```bash
# Access MongoDB shell
docker compose exec mongodb mongosh -u admin -p admin123

# Backup database
docker compose exec mongodb mongodump --uri="mongodb://admin:admin123@localhost:27017/shoppers9?authSource=admin" --out=/data/backup

# Access Redis CLI
docker compose exec redis redis-cli
```

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=admin123

# JWT Secrets
CUSTOMER_JWT_SECRET=your_customer_jwt_secret
ADMIN_JWT_SECRET=your_admin_jwt_secret

# Frontend URLs
CUSTOMER_FRONTEND_URL=http://localhost:3000
ADMIN_FRONTEND_URL=http://localhost:3001
```

### Development vs Production

- **Development:** Uses `docker-compose.yml` with hot reloading
- **Production:** Uses `docker-compose.prod.yml` with optimized builds

```bash
# Production deployment
docker compose -f docker-compose.prod.yml up -d
```

## 📁 Project Structure

```
shoppers9-backend/
├── backend-shoppers9/          # Customer API service
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── shoppers9-admin-backend/    # Admin API service
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
├── shoppers9-frontend/         # Customer frontend
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   └── src/
├── shoppers9-admin-frontend/   # Admin frontend
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   └── src/
├── docker-compose.yml          # Development configuration
├── docker-compose.prod.yml     # Production configuration
├── setup-docker-dev.ps1        # Setup script
└── .env                        # Environment variables
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using the port
   netstat -ano | findstr :3000
   # Kill the process or change ports in docker-compose.yml
   ```

2. **Database connection issues:**
   ```bash
   # Check MongoDB logs
   docker compose logs mongodb
   
   # Restart MongoDB
   docker compose restart mongodb
   ```

3. **Frontend not loading:**
   ```bash
   # Check if backend is running
   curl http://localhost:5000/api/health
   
   # Rebuild frontend
   docker compose up --build shoppers9-frontend
   ```

4. **Permission issues (Linux/macOS):**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   ```

### Clean Reset

If you need to start fresh:

```bash
# Stop and remove all containers, networks, and volumes
docker compose down -v --remove-orphans

# Remove all images
docker compose down --rmi all

# Rebuild everything
docker compose up --build
```

## 🔒 Security Notes

- Default passwords are for development only
- Change all secrets before production deployment
- Use environment variables for sensitive data
- Enable SSL/TLS in production

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Redis Docker Hub](https://hub.docker.com/_/redis)

## 🤝 Contributing

When contributing:

1. Test your changes with Docker
2. Update this README if needed
3. Ensure all services start successfully
4. Check logs for any errors

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review service logs
3. Ensure Docker Desktop is running
4. Verify all prerequisites are installed

---

**Happy coding! 🚀**