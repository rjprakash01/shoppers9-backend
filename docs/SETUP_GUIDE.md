# Shoppers9 E-commerce Backend Setup Guide

## Overview
This guide will help you set up the complete Shoppers9 e-commerce backend with all required components.

## ✅ Current Status

### 1. MongoDB Database Setup
- **Status**: Configured for local MongoDB
- **Current**: Using local MongoDB connection string
- **Test Credentials**: Available for development without database

### 2. Twilio SMS Configuration
- **Status**: ✅ Configured with test credentials
- **Test Phone**: `1234567890`
- **Test OTP**: `1234`
- **Production**: Disabled (can be enabled by adding Twilio credentials to .env)

### 3. Order Processing Workflow
- **Status**: ✅ Fully implemented
- **Features**:
  - Create orders from cart
  - Order status management (PENDING → CONFIRMED → SHIPPED → DELIVERED)
  - Order cancellation with refund processing
  - Stock validation
  - Order analytics

### 4. Payment Gateway Integration
- **Status**: ✅ Implemented with mock provider
- **Current**: Mock payment provider for development
- **Supported**: Razorpay and Stripe (placeholders ready)
- **Features**:
  - Payment intent creation
  - Payment verification
  - Refund processing
  - Platform fee calculation

### 5. Admin Backend Setup
- **Status**: ✅ Fully implemented
- **Features**:
  - Dashboard analytics
  - User management
  - Product management
  - Order management
  - Category management
  - Sales analytics

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (optional for development)

### 1. Install Dependencies
```bash
cd /Users/rjprakash/Desktop/shoppers9-backend
npm install
```

### 2. Environment Configuration
The `.env` file is already configured with:
- Local MongoDB connection
- Test credentials for SMS
- Mock payment provider
- Development settings

### 3. Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:5001` and work without MongoDB for testing.

## 📱 Test Credentials

### SMS/OTP Testing
- **Phone Number**: `1234567890`
- **OTP**: `1234`
- **Usage**: Use these credentials to test authentication without real SMS

### Admin Access
- **Email**: `admin@shoppers9.com`
- **Phone**: `9999999999`

## 🗄️ MongoDB Setup (Optional for Persistence)

### Quick Installation (Recommended)
```bash
# Run the automated installation script
./install-mongodb.sh
```

### Manual Installation

#### macOS (using Homebrew)
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Update .env file
MONGODB_URI=mongodb://localhost:27017/shoppers9
```

#### Manual Installation (Alternative)
1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Follow installation instructions for your OS
3. Start MongoDB service:
   ```bash
   mongod --dbpath /usr/local/var/mongodb
   ```

### Option 2: Docker (if Docker is available)
```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name shoppers9-mongo mongo:latest
```

### Option 3: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a cluster
3. Get connection string
4. Update `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/shoppers9
   ```

## 🔧 Production Configuration

### 1. Twilio SMS Setup
1. Create Twilio account: https://www.twilio.com/
2. Get Account SID, Auth Token, and Phone Number
3. Update `.env`:
   ```
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_number
   ```

### 2. Payment Gateway Setup

#### Razorpay
1. Create Razorpay account: https://razorpay.com/
2. Get API keys
3. Update `.env`:
   ```
   PAYMENT_PROVIDER=razorpay
   RAZORPAY_KEY_ID=your_key_id
   RAZORPAY_KEY_SECRET=your_key_secret
   ```

#### Stripe
1. Create Stripe account: https://stripe.com/
2. Get API keys
3. Update `.env`:
   ```
   PAYMENT_PROVIDER=stripe
   STRIPE_SECRET_KEY=your_secret_key
   STRIPE_PUBLISHABLE_KEY=your_publishable_key
   ```

## 🏗️ Admin Backend Setup

The admin backend is located in `shoppers9-admin-backend/` directory.

### Setup Steps
```bash
cd shoppers9-admin-backend
npm install
npm run dev
```

### Configuration
1. Copy `.env.example` to `.env`
2. Update database connection to match main backend
3. Configure admin credentials

## 📊 API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP and login
- `POST /api/auth/refresh-token` - Refresh access token

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/refund` - Process refund

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - Manage users
- `GET /api/admin/orders` - Manage orders
- `GET /api/admin/products` - Manage products

## 🔍 Testing

### Test the Setup
1. Start the server: `npm run dev`
2. Visit: `http://localhost:5001/health`
3. Test authentication with phone `1234567890` and OTP `1234`
4. Create test orders using the API

### API Documentation
Visit `http://localhost:5001/api` for interactive API documentation.

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Server will continue without database in development mode

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill existing process: `lsof -ti:5001 | xargs kill`

3. **SMS Not Working**
   - Use test credentials: phone `1234567890`, OTP `1234`
   - Check Twilio configuration for production

4. **Payment Issues**
   - Mock provider is used by default
   - Configure real payment gateway for production

## 📞 Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Ensure all environment variables are properly set
3. Verify all dependencies are installed

## 🎉 Success!

If you see this message in the console, everything is working:
```
🚀 Shoppers9 API Server running on port 5001
📱 Environment: development
🌐 Health check: http://localhost:5001/health
📚 API docs: http://localhost:5001/api
```

Your e-commerce backend is now ready for development and testing!