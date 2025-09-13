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
import variantRoutes from './routes/variantRoutes';
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
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5174',
  process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5175',
  'https://admin.shoppers9.com',
  'https://shoppers9.com'
];

// Add CORS_ORIGIN if specified in environment
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Test endpoint for frontend connectivity
app.get('/api/test-connection', (req, res) => {
  res.json({
    success: true,
    message: 'Frontend can reach backend successfully!',
    timestamp: new Date().toISOString(),
    origin: req.get('origin') || 'unknown'
  });
});

// Test POST endpoint
app.post('/api/test-post', (req, res) => {
  res.json({
    success: true,
    message: 'POST request successful!',
    receivedData: req.body,
    timestamp: new Date().toISOString()
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
    
    // Also create the mock admin user for backward compatibility
    const mockAdminData = {
      email: 'admin@shoppers9.com',
      password: 'admin123',
      firstName: 'Test',
      lastName: 'Admin',
      phone: '9999999999',
      role: 'admin',
      isActive: true
    };
    
    const mockAdmin = new Admin(mockAdminData);
    await mockAdmin.save();
    
    res.status(201).json({
      success: true,
      message: 'Super admin and test admin created successfully',
      data: {
        superAdmin: {
          email: 'superadmin@shoppers9.com',
          password: 'superadmin123',
          role: 'super_admin'
        },
        testAdmin: {
          email: 'admin@shoppers9.com',
          password: 'admin123',
          role: 'admin'
        },
        firstName: 'Super',
        lastName: 'Admin',
        phone: '9876543210'
      }
    });
    
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: 'Error creating super admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create test admin endpoint
app.post('/api/create-test-admin', async (req, res): Promise<void> => {
  try {
    const Admin = require('./models/Admin').default;
    
    // Check if test admin already exists
    const existingTestAdmin = await Admin.findOne({ email: 'admin@shoppers9.com' });
    
    if (existingTestAdmin) {
      res.status(200).json({
        success: true,
        message: 'Test admin already exists',
        data: {
          email: 'admin@shoppers9.com',
          password: 'admin123'
        }
      });
      return;
    }

    // Create test admin
    const testAdminData = {
      email: 'admin@shoppers9.com',
      password: 'admin123',
      firstName: 'Test',
      lastName: 'Admin',
      phone: '9999999999',
      role: 'admin',
      isActive: true
    };

    const testAdmin = new Admin(testAdminData);
    await testAdmin.save();
    
    res.status(201).json({
      success: true,
      message: 'Test admin created successfully',
      data: {
        email: 'admin@shoppers9.com',
        password: 'admin123',
        role: 'admin'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error creating test admin',
      error: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
// Public category routes (for frontend dropdown access)
app.use('/api/categories', categoryRoutes);
// Public banner routes (for frontend carousel access)
app.use('/api/banners', publicBannerRoutes);

// Temporary fix endpoint (no auth required)
app.post('/api/fix-order-amounts', async (req, res) => {
  try {
    const Order = (await import('./models/Order')).default;
    console.log('Starting order amounts fix...');
    
    // Find all orders
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to check`);

    let fixedCount = 0;

    for (const order of orders) {
      try {
        // Calculate the correct original amount from items
        const originalAmount = order.items.reduce((sum: number, item: any) => {
          return sum + (item.originalPrice * item.quantity);
        }, 0);

        // Calculate the correct discounted amount from items
        const discountedAmount = order.items.reduce((sum: number, item: any) => {
          return sum + (item.price * item.quantity);
        }, 0);

        // Calculate fees based on discounted amount
        const platformFee = discountedAmount > 500 ? 0 : 20;
        const deliveryCharge = discountedAmount > 500 ? 0 : 50;

        // Calculate correct finalAmount
        const correctFinalAmount = discountedAmount + platformFee + deliveryCharge;
        const correctTotalAmount = originalAmount;

        // Update the order if amounts are different
        if (order.totalAmount !== correctTotalAmount || order.finalAmount !== correctFinalAmount) {
          await Order.updateOne(
            { _id: order._id },
            {
              totalAmount: correctTotalAmount,
              finalAmount: correctFinalAmount
            }
          );

          console.log(`Fixed order ${order.orderNumber}:`);
          console.log(`  Old totalAmount: ${order.totalAmount} -> New: ${correctTotalAmount}`);
          console.log(`  Old finalAmount: ${order.finalAmount} -> New: ${correctFinalAmount}`);
          fixedCount++;
        }
      } catch (error) {
        console.error(`Error fixing order ${order.orderNumber}:`, error);
      }
    }

    res.json({
      success: true,
      message: `Fixed ${fixedCount} orders successfully`,
      data: {
        totalOrders: orders.length,
        fixedOrders: fixedCount
      }
    });
  } catch (error: any) {
    console.error('Error fixing order amounts:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing order amounts',
      error: error.message || 'Unknown error'
    });
  }
});
// Specific admin routes must come before the general admin route
app.use('/api/admin/products', productRoutes);
app.use('/api/admin', variantRoutes); // Variant management routes
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
  console.log(`Admin backend server running on port ${PORT}`);
});

export default app;
