import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import productRoutes from './routes/product';
import cartRoutes from './routes/cart';
import wishlistRoutes from './routes/wishlist';
import orderRoutes from './routes/order';
import paymentRoutes from './routes/payment';
import adminRoutes from './routes/admin';
import bannerRoutes from './routes/banner';
import analyticsRoutes from './routes/analytics';
import categoryRoutes from './routes/category';
import supportRoutes from './routes/support';
import inventoryRoutes from './routes/inventory';
import shippingRoutes from './routes/shipping';
import couponRoutes from './routes/coupon';
import searchRoutes from './routes/search';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for load balancer
app.set('trust proxy', true);

// Connect to MongoDB (non-blocking)
connectDB().catch(console.error);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting - disabled for development
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // increased limit for development
    message: {
      error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    keyGenerator: (req) => {
      // Use X-Forwarded-For header from load balancer or fallback to connection IP
      return req.headers['x-forwarded-for'] as string || req.ip || req.connection.remoteAddress || 'unknown';
    },
    legacyHeaders: false
  });
  app.use('/api/', limiter);
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL || '',
        process.env.ADMIN_FRONTEND_URL || 'https://admin.shoppers9.com',
        'https://shoppers9.com',
        'https://admin.shoppers9.com'
      ].filter(url => url !== '')
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://192.168.1.5:5174', 'http://192.168.1.5:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Content-Type', req.path.endsWith('.svg') ? 'image/svg+xml' : undefined);
  next();
}, express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shoppers9 API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug route to test routing system
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API routing is working!' });
});

// Remove the direct products route - now using proper controller
// This route is handled by the productController through the routes system

// API Routes
console.log('🔧 Registering API routes...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
console.log('✅ Products route registered at /api/products');
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/analytics', analyticsRoutes);
console.log('✅ All API routes registered');

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Shoppers9 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      cart: '/api/cart',
      wishlist: '/api/wishlist',
      support: '/api/support',
      banners: '/api/banners'
    },
    documentation: 'https://api.shoppers9.com/docs'
  });
});

// Additional route mounting for load balancer compatibility
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/categories', categoryRoutes);
app.use('/cart', cartRoutes);
app.use('/wishlist', wishlistRoutes);
app.use('/orders', orderRoutes);
app.use('/payments', paymentRoutes);
app.use('/support', supportRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/shipping', shippingRoutes);
app.use('/coupons', couponRoutes);
app.use('/admin', adminRoutes);
app.use('/banners', bannerRoutes);
app.use('/analytics', analyticsRoutes);

// 404 handler for undefined routes (MUST be after all routes)
app.use(notFoundHandler);

// Global error handler (MUST be last)
app.use(errorHandler);

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📱 Network access: http://192.168.1.5:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  
  process.exit(0);
});

process.on('SIGINT', () => {
  
  process.exit(0);
});

export default app;
