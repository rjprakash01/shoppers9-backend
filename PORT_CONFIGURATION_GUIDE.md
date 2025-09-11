# Port Configuration Guide for Shoppers9

## Development Environment Ports

### Frontend Services
- **Main Frontend (Customer)**: Port `3000` (Vite dev server)
  - Command: `npm run dev` in `shoppers9-frontend/`
  - URL: `http://localhost:3000`

- **Admin Frontend**: Port `5173` (Vite dev server)
  - Command: `npm run dev` in `shoppers9-admin-frontend/`
  - URL: `http://localhost:5173`

### Backend Services
- **Main Backend API**: Port `3001` (Express server)
  - Command: `npm start` in `backend-shoppers9/`
  - URL: `http://localhost:3001`
  - Health Check: `http://localhost:3001/health`

- **Admin Backend API**: Port `4000` (Express server)
  - Command: `npm start` in `shoppers9-admin-backend/`
  - URL: `http://localhost:4000`
  - Health Check: `http://localhost:4000/health`

### Database Services
- **MongoDB (Local)**: Port `27017` (default MongoDB port)
- **Redis (Local)**: Port `6379` (default Redis port)

## Production Environment Ports

### Frontend Services (Docker Containers)
- **Main Frontend**: Port `3000` (internal) → `8080` (external)
  - Docker command: `docker run -p 8080:3000 shoppers9-frontend`
  - URL: `https://shoppers9.com`

- **Admin Frontend**: Port `3000` (internal) → `3001` (external)
  - Docker command: `docker run -p 3001:3000 shoppers9-admin-frontend`
  - URL: `https://admin.shoppers9.com`

### Backend Services (Docker Containers)
- **Main Backend API**: Port `3001` (internal) → `8081` (external)
  - Docker command: `docker run -p 8081:3001 shoppers9-backend`
  - URL: `https://api.shoppers9.com`

- **Admin Backend API**: Port `4000` (internal) → `8082` (external)
  - Docker command: `docker run -p 8082:4000 shoppers9-admin-backend`
  - URL: `https://admin-api.shoppers9.com`

### Load Balancer
- **ALB/Nginx**: Ports `80` (HTTP) and `443` (HTTPS)
  - Redirects HTTP to HTTPS
  - SSL termination

## Environment Configuration Rules

### Development Rules
1. **Always use localhost URLs** for API endpoints in development
2. **Frontend dev servers** should proxy API calls to local backend ports
3. **Hot reload** should be enabled for all frontend applications
4. **CORS** should allow localhost origins for development

### Production Rules
1. **Use production domain URLs** for all API endpoints
2. **HTTPS only** - no HTTP traffic allowed
3. **Environment variables** must be properly configured for production
4. **CORS** should only allow production domains
5. **Security headers** must be enabled

## Configuration Files

### Development Configuration
- Frontend apps use `vite.config.ts` for dev server configuration
- Backend apps use `.env` files for port and database configuration
- API base URLs should be configurable via environment variables

### Production Configuration
- Docker containers expose specific ports as defined above
- Environment variables are injected via Docker or ECS task definitions
- Load balancer routes traffic to appropriate backend services

## Common Issues and Solutions

### Development Issues
1. **Port conflicts**: Ensure no other services are using the defined ports
2. **CORS errors**: Check that backend CORS configuration allows frontend origins
3. **API connection failures**: Verify backend services are running on correct ports

### Production Issues
1. **502 Bad Gateway**: Check if backend containers are healthy and accessible
2. **CORS errors**: Verify production domains are whitelisted in backend CORS config
3. **SSL certificate issues**: Ensure certificates are valid and properly configured

## Deployment Checklist

### Before Deployment
- [ ] Verify all environment variables are set correctly
- [ ] Test API endpoints with production URLs
- [ ] Confirm SSL certificates are valid
- [ ] Check database connectivity
- [ ] Verify CORS configuration for production domains

### After Deployment
- [ ] Test all frontend applications
- [ ] Verify API health checks
- [ ] Test admin panel login functionality
- [ ] Monitor application logs for errors
- [ ] Confirm SSL redirects are working

## Security Considerations

1. **Never expose development ports** in production
2. **Use environment-specific configurations** for API URLs
3. **Implement proper authentication** for admin endpoints
4. **Enable security headers** (HSTS, CSP, etc.)
5. **Regular security updates** for all dependencies