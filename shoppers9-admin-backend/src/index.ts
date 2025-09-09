import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import productRoutes from './routes/product';
import userRoutes from './routes/user';
import orderRoutes from './routes/order';
import analyticsRoutes from './routes/analytics';
import categoryRoutes from './routes/category';
import filterRoutes from './routes/filter';
import categoryFilterRoutes from './routes/categoryFilter';
import productFilterValueRoutes from './routes/productFilterValue';
import filterOptionRoutes from './routes/filterOption';
import bannerRoutes from './routes/banner';
import publicBannerRoutes from './routes/publicBanner';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
  next();
});

// Serve static files from uploads directory with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static('uploads'));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Shoppers9 Admin Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Special initialization route for creating first super admin
app.post('/api/init-super-admin', async (req, res): Promise<void> => {
  try {
    const Admin = require('./models/Admin').default;
    
    // Check if any super admin exists
    const existingSuperAdmin = await Admin.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      res.status(400).json({
        success: false,
        message: 'Super admin already exists',
        data: {
          email: existingSuperAdmin.email,
          firstName: existingSuperAdmin.firstName,
          lastName: existingSuperAdmin.lastName
        }
      });
      return;
    }

    // Create super admin
    const superAdminData = {
      email: 'superadmin@shoppers9.com',
      password: 'superadmin123',
      firstName: 'Super',
      lastName: 'Admin',
      phone: '9876543210',
      role: 'super_admin',
      isActive: true
    };

    const superAdmin = new Admin(superAdminData);
    await superAdmin.save();
    
    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      data: {
        email: 'superadmin@shoppers9.com',
        password: 'superadmin123',
        role: 'super_admin',
        firstName: 'Super',
        lastName: 'Admin',
        phone: '9876543210'
      }
    });
    
  } catch (error) {
    console.error('Error creating super admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating super admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
// Public category routes (for frontend dropdown access)
app.use('/api/categories', categoryRoutes);
// Public banner routes (for frontend carousel access)
app.use('/api/banners', publicBannerRoutes);
// Specific admin routes must come before the general admin route
app.use('/api/admin/products', productRoutes);
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/filters', filterRoutes);
app.use('/api/admin/filter-options', filterOptionRoutes);
app.use('/api/admin', categoryFilterRoutes);
app.use('/api/admin', productFilterValueRoutes);
app.use('/api/admin/banners', bannerRoutes);
// General admin routes (for admin management)
app.use('/api/admin', adminRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Shoppers9 Admin Backend running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Access restrictions removed - all authenticated users can access admin features`);
  console.log(`🌟 Server ready to accept connections`);
});

export default app;
