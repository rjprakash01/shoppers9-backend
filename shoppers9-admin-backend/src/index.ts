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
import inventoryRoutes from './routes/inventory';
import notificationRoutes from './routes/notifications';
import settingsRoutes from './routes/settings';
import testimonialRoutes from './routes/testimonials';
import permissionRoutes from './routes/permission';
import dashboardRoutes from './routes/dashboard';
import couponRoutes from './routes/coupon';
import roleRoutes from './routes/roles';
import { startScheduler } from './utils/scheduler';
import { auth } from './middleware/auth';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Connect to database
connectDB().then(async () => {
  // Initialize demo accounts
    try {
      const { createDemoAccounts } = await import('./controllers/authController');
      await createDemoAccounts();
      console.log('✅ Demo accounts initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing demo accounts:', error);
    }
});

// Local SVG placeholder generator endpoint
app.get('/api/placeholder/:text', (req, res) => {
  const text = decodeURIComponent(req.params.text || 'Product');
  const width = req.query.width || 300;
  const height = req.query.height || 300;
  const bgColor = req.query.bg || 'e3f2fd';
  const textColor = req.query.color || '1976d2';
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${bgColor}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" font-weight="bold" 
            fill="#${textColor}" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
    </svg>
  `;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(svg);
});

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5174',
  process.env.ADMIN_FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
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

// Test discount calculation endpoint
app.post('/api/test-discount-calculation', async (req, res) => {
  try {
    const { testDiscountCalculation } = await import('./controllers/orderController');
    await testDiscountCalculation(req, res);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error testing discount calculation',
      error: error.message
    });
  }
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

// Public notification endpoint for testing
app.post('/public/notifications', async (req, res) => {
  try {
    console.log('Public notification endpoint called:', req.body);
    const { type, title, message, data } = req.body;
    const { Notification } = require('./models/Notification');
    
    const notification = new Notification({
      type,
      title,
      message,
      data: data || {}
    });
    
    await notification.save();
    console.log('Notification saved successfully:', notification._id);
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
       success: false,
       message: 'Failed to create notification',
       error: error instanceof Error ? error.message : 'Unknown error'
     });
  }
});

// Seller-specific notification endpoint
app.post('/public/notifications/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    console.log(`Seller-specific notification endpoint called for ${sellerId}:`, req.body);
    const { type, title, message, data } = req.body;
    const { Notification } = require('./models/Notification');
    
    const notification = new Notification({
      type,
      title,
      message,
      data: data || {},
      targetUserId: sellerId, // Associate notification with specific admin
      isSellerSpecific: true
    });
    
    await notification.save();
    console.log(`Seller notification saved successfully for ${sellerId}:`, notification._id);
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating seller notification:', error);
    res.status(500).json({
       success: false,
       message: 'Failed to create seller notification',
       error: error instanceof Error ? error.message : 'Unknown error'
     });
  }
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
app.use('/api/public/categories', categoryRoutes);
// Public coupon routes (for admin frontend access)
app.use('/api/public/coupons', couponRoutes);
// Public banner routes (for frontend carousel access)
app.use('/api/banners', publicBannerRoutes);
// Public testimonial routes
app.use('/api/public/testimonials', testimonialRoutes);

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

        // Apply coupon discount if available
        const couponDiscount = order.couponDiscount || 0;
        
        // Calculate correct discount (only item-level, not including coupon)
        const itemLevelDiscount = originalAmount - discountedAmount;

        // Calculate correct finalAmount (discounted amount - coupon discount + fees)
        let correctFinalAmount = discountedAmount - couponDiscount + platformFee + deliveryCharge;
        if (correctFinalAmount < 0) {
          correctFinalAmount = platformFee + deliveryCharge; // Minimum amount should be fees only
        }
        const correctTotalAmount = originalAmount;
        const correctDiscount = itemLevelDiscount;

        // Update the order if amounts are different
        if (order.totalAmount !== correctTotalAmount || order.finalAmount !== correctFinalAmount || order.discount !== correctDiscount) {
          await Order.updateOne(
            { _id: order._id },
            {
              totalAmount: correctTotalAmount,
              finalAmount: correctFinalAmount,
              discount: correctDiscount
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

// Temporary test endpoint for debugging with proper data filtering
app.get('/api/test/products', auth, async (req: any, res) => {
  try {
    console.log('=== TEST PRODUCTS ENDPOINT CALLED ===');
    const Product = (await import('./models/Product')).default;
    const Category = (await import('./models/Category')).default;
    
    // Get user role and ID from authenticated user (from auth middleware)
    const currentUser = req.admin;
    const userRole = currentUser.primaryRole;
    const currentUserId = currentUser._id;
    
    console.log('Authenticated user:', {
      id: currentUserId.toString(),
      role: userRole,
      name: `${currentUser.firstName} ${currentUser.lastName}`,
      email: currentUser.email
    });
    
    // Only create admin-specific products when testing as admin (not super admin)
      if (userRole === 'admin') {
        const existingProducts = await Product.find({ createdBy: currentUserId });
        
        if (existingProducts.length === 0) {
          console.log('No products found for current admin, creating test products...');
          
          const testProducts = [
            {
              name: 'Admin Test Product 1',
              description: 'This is a test product for the current admin',
              price: 100,
              stock: 50,
              isActive: true,
              createdBy: currentUserId,
              images: [],
              variants: []
            },
            {
              name: 'Admin Test Product 2', 
              description: 'Another test product for the current admin',
              price: 200,
              stock: 30,
              isActive: true,
              createdBy: currentUserId,
              images: [],
              variants: []
            }
          ];
          
          await Product.insertMany(testProducts);
          console.log('Created test products for current admin');
        }
      }
    
    // Apply data filtering based on role
     let query = {};
     if (userRole === 'super_admin') {
       query = {}; // Super admin sees everything
       console.log('Super admin access: showing all products');
     } else if (userRole === 'admin') {
       query = { createdBy: currentUserId }; // Admin sees only their own products
       console.log('Admin access: filtering by createdBy =', currentUserId.toString());
     }
     
     console.log('Applied query filter:', query);
    
    // Get products with proper filtering
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log('Products found after filtering:', products.length);
    console.log('Sample filtered product:', products[0] ? {
      name: products[0].name,
      price: products[0].price,
      discountedPrice: products[0].discountedPrice,
      originalPrice: products[0].originalPrice,
      variants: products[0].variants?.length || 0,
      variantPrice: products[0].variants?.[0]?.price,
      images: products[0].images?.length || 0,
      variantImages: products[0].variants?.[0]?.images?.length || 0,
      createdBy: products[0].createdBy?.toString(),
      userRole: userRole
    } : 'No products');
    
    // Transform products to match frontend expectations
    const transformedProducts = products.map(product => {
      // Calculate stock from variants if available
      let totalStock = 0;
      if (product.variants && product.variants.length > 0) {
        totalStock = product.variants.reduce((sum, variant) => {
          return sum + (variant.stock || 0);
        }, 0);
      } else {
        totalStock = product.stock || 100; // Default stock if no variants
      }
      
      // This section is now handled below in the improved logic
      
      // Get price from product or first variant
      let productPrice = product.discountedPrice || product.price;
      let originalPrice = product.price;
      
      if (!productPrice && product.variants && product.variants.length > 0) {
        productPrice = product.variants[0].discountedPrice || product.variants[0].price;
        originalPrice = product.variants[0].price;
      }
      
      // Default to reasonable prices if still no price found
      productPrice = productPrice || 100;
      originalPrice = originalPrice || productPrice;
      
      // Get images from product or variants
       let finalImages = [];
       console.log(`Processing images for ${product.name}:`);
       console.log('  Product images:', product.images);
       console.log('  Variant images:', product.variants?.[0]?.images);
       
       // Check if product images are valid (not empty arrays or empty strings)
        const hasValidProductImages = product.images && product.images.length > 0 && 
          product.images.some(img => img && typeof img === 'string' && img.length > 10);
        
        if (hasValidProductImages) {
          finalImages = product.images.filter(img => img && typeof img === 'string' && img.length > 10);
          console.log('  Using product images:', finalImages.length, 'valid images');
        } else if (product.variants && product.variants.length > 0 && product.variants[0].images && product.variants[0].images.length > 0) {
          const hasValidVariantImages = product.variants[0].images.some(img => img && typeof img === 'string' && img.length > 10);
          if (hasValidVariantImages) {
            finalImages = product.variants[0].images.filter(img => img && typeof img === 'string' && img.length > 10);
            console.log('  Using variant images:', finalImages.length, 'valid images');
          }
        }
       
       // If no real images, use local SVG placeholder
        if (finalImages.length === 0) {
          finalImages = [`http://localhost:5003/api/placeholder/${encodeURIComponent(product.name || 'Product')}`];
          console.log('  Using local placeholder:', finalImages);
        } else {
          console.log('  Final images to send:', finalImages.length, 'images');
        }
      
      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description || '',
        price: productPrice,
        originalPrice: originalPrice,
        category: {
          id: product.category?._id?.toString() || '',
          name: product.category?.name || 'Uncategorized'
        },
        images: finalImages,
        stock: totalStock,
        isActive: product.isActive !== false, // Default to true if undefined
        rating: product.rating || 4.5, // Default rating
        reviewCount: product.reviewCount || 0,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
        brand: product.brand || 'Generic',
        createdBy: product.createdBy
      };
    });
    
    res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          currentPage: 1,
          totalPages: Math.ceil(products.length / 50),
          totalItems: products.length,
          limit: 50,
          hasPrev: false,
          hasNext: products.length > 50
        }
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use('/api/admin/products', productRoutes);
app.use('/api/admin', variantRoutes); // Variant management routes
app.use('/api/admin/users', userRoutes);
app.use('/api/admin/orders', orderRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/inventory', inventoryRoutes);
app.use('/api/admin/coupons', couponRoutes);
app.use('/api/admin/categories', categoryRoutes);
app.use('/api/admin/filters', filterRoutes);
app.use('/api/admin/filter-options', filterOptionRoutes);
app.use('/api/admin', categoryFilterRoutes);
app.use('/api/admin', productFilterValueRoutes);
app.use('/api/admin/banners', bannerRoutes);
// Public settings endpoint (no auth required)
app.get('/api/settings/public', async (req, res) => {
  try {
    const { getSettings } = require('./controllers/settingsController');
    await getSettings(req, res);
  } catch (error) {
    console.error('Error in public settings endpoint:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/testimonials', testimonialRoutes);
app.use('/api/admin', permissionRoutes);
app.use('/api/admin/roles', roleRoutes);
// Public notification endpoint for service-to-service communication
app.post('/api/admin/notifications', async (req, res) => {
  try {
    const { type, title, message, data } = req.body;
    const { Notification } = require('./models/Notification');
    
    const notification = new Notification({
      type,
      title,
      message,
      data: data || {}
    });
    
    await notification.save();
    
    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
});

// Protected notification routes
app.use('/api/admin/notifications', notificationRoutes);
// Admin management routes (for managing admin users)
app.use('/api/admin/admins', adminRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Admin backend server running on port ${PORT}`);
  
  // Start notification schedulers
  startScheduler();
});

export default app;

