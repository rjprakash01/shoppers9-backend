import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAllProducts,
  getProductsByCategory,
  updateProductStatus,
  createProduct,
  getAllOrders,
  getOrderDetails,
  getAllCategories,
  updateCategoryStatus,
  createCategory,
  getSalesAnalytics,
  getReviewQueue,
  approveProduct,
  rejectProduct,
  requestProductChanges,
  bulkReviewAction
} from '../controllers/adminController';
import { updateOrderStatus } from '../controllers/orderController';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import bannerRoutes from './banner';
import { Category } from '../models/Category';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateUserStatusSchema = Joi.object({
  isVerified: Joi.boolean().required()
});

const updateProductStatusSchema = Joi.object({
  isActive: Joi.boolean().required()
});

const updateCategoryStatusSchema = Joi.object({
  isActive: Joi.boolean().required()
});

const createCategorySchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(100),
  description: Joi.string().optional().trim().max(500),
  slug: Joi.string().optional().trim().pattern(/^[a-z0-9-]+$/),
  image: Joi.string().optional().trim(),
  parentCategory: Joi.string().optional().trim(),
  isActive: Joi.boolean().optional().default(true),
  sortOrder: Joi.number().integer().min(0).optional().default(0)
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string().required().valid(
    'pending', 'confirmed', 'processing', 'shipped', 
    'delivered', 'cancelled', 'return_requested', 'returned'
  ),
  trackingId: Joi.string().optional().trim()
});

const createProductSchema = Joi.object({
  name: Joi.string().required().trim().min(1).max(200),
  description: Joi.string().required().trim().min(1),
  brand: Joi.string().required().trim().min(1).max(100),
  category: Joi.string().required().trim(),
  subCategory: Joi.string().optional().trim(),
  color: Joi.string().optional().trim(),
  colorCode: Joi.string().optional().trim(),
  size: Joi.string().optional().trim(),
  price: Joi.number().required().min(0),
  originalPrice: Joi.number().optional().min(0),
  stock: Joi.number().integer().optional().min(0).default(0),
  images: Joi.array().items(Joi.string().trim()).optional().default([]),
  specifications: Joi.object().optional().default({}),
  tags: Joi.array().items(Joi.string().trim()).optional().default([]),
  isActive: Joi.boolean().optional().default(true),
  isFeatured: Joi.boolean().optional().default(false),
  isTrending: Joi.boolean().optional().default(false)
});

// Middleware to check admin access
// TODO: Implement proper admin authentication
// For now, we'll use basic authentication - in production, add proper admin role checking
const requireAdmin = (req: any, res: any, next: any) => {
  // This is a placeholder - implement proper admin role checking
  // For now, any authenticated user can access admin routes (not recommended for production)
  next();
};

// Dashboard
router.get('/dashboard/stats', 
  authenticateToken, 
  requireAdmin, 
  getDashboardStats
);

// Analytics routes
router.get('/analytics/dashboard', 
  authenticateToken, 
  requireAdmin, 
  getDashboardStats
);

router.get('/analytics/sales', 
  authenticateToken, 
  requireAdmin, 
  getSalesAnalytics
);

// User Management
router.get('/users', 
  authenticateToken, 
  requireAdmin, 
  getAllUsers
);

router.get('/users/:userId', 
  authenticateToken, 
  requireAdmin, 
  getUserById
);

router.patch('/users/:userId/status', 
  authenticateToken, 
  requireAdmin, 
  validateRequest(updateUserStatusSchema), 
  updateUserStatus
);

// Product Management
router.get('/products', 
  authenticateToken, 
  requireAdmin, 
  getAllProducts
);

router.get('/products/category/:categoryId', 
  authenticateToken, 
  requireAdmin, 
  getProductsByCategory
);

router.post('/products', 
  authenticateToken, 
  requireAdmin, 
  validateRequest(createProductSchema), 
  createProduct
);

router.patch('/products/:productId/status', 
  authenticateToken, 
  requireAdmin, 
  validateRequest(updateProductStatusSchema), 
  updateProductStatus
);

// Product Review Management
router.get('/products/review-queue', 
  authenticateToken, 
  requireAdmin, 
  getReviewQueue
);

router.patch('/products/:productId/approve', 
  authenticateToken, 
  requireAdmin, 
  approveProduct
);

router.patch('/products/:productId/reject', 
  authenticateToken, 
  requireAdmin, 
  rejectProduct
);

router.patch('/products/:productId/request-changes', 
  authenticateToken, 
  requireAdmin, 
  requestProductChanges
);

router.post('/products/bulk-review', 
  authenticateToken, 
  requireAdmin, 
  bulkReviewAction
);

// Order Management
router.get('/orders', 
  authenticateToken, 
  requireAdmin, 
  getAllOrders
);

router.get('/orders/:orderNumber', 
  authenticateToken, 
  requireAdmin, 
  getOrderDetails
);

router.patch('/orders/:orderNumber/status', 
  authenticateToken, 
  requireAdmin, 
  validateRequest(updateOrderStatusSchema), 
  updateOrderStatus
);

// Category Management
router.get('/categories', 
  authenticateToken, 
  requireAdmin, 
  getAllCategories
);

// Category tree endpoint for admin
router.get('/categories/tree', 
  authenticateToken, 
  requireAdmin, 
  async (req: any, res: any, next: any) => {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 });

      // Build hierarchical tree structure
      const categoryMap = new Map();
      const tree: any[] = [];

      // First pass: create all category objects
      categories.forEach((category: any) => {
        const categoryJson = category.toJSON();
        categoryMap.set(category._id.toString(), {
          ...categoryJson,
          children: []
        });
      });

      // Second pass: build the tree structure
      categories.forEach((category: any) => {
        const categoryObj = categoryMap.get(category._id.toString());
        
        if (category.parentCategory) {
          const parentId = category.parentCategory.toString();
          const parent = categoryMap.get(parentId);
          if (parent) {
            parent.children.push(categoryObj);
          }
        } else {
          tree.push(categoryObj);
        }
      });

      res.json({
        success: true,
        data: {
          categories: tree
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Filters endpoint for admin
router.get('/filters', 
  authenticateToken, 
  requireAdmin, 
  async (req: any, res: any, next: any) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      // Mock filters data for now - replace with actual filter model when available
      const mockFilters = [
        {
          _id: '507f1f77bcf86cd799439011',
          name: 'Size',
          type: 'multi-select',
          options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
          isActive: true,
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Color',
          type: 'multi-select',
          options: ['Red', 'Blue', 'Green', 'Black', 'White'],
          isActive: true,
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Brand',
          type: 'single-select',
          options: ['Nike', 'Adidas', 'Puma', 'Reebok'],
          isActive: true,
          createdAt: new Date()
        }
      ];
      
      const total = mockFilters.length;
      const filters = mockFilters.slice(skip, skip + parseInt(limit));
      
      res.json({
        success: true,
        data: {
          filters,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Banner Management - Mount banner routes under admin
router.use('/banners', bannerRoutes);

router.post('/categories', 
  authenticateToken, 
  requireAdmin, 
  validateRequest(createCategorySchema), 
  createCategory
);

router.patch('/categories/:categoryId/status', 
  authenticateToken, 
  requireAdmin, 
  validateRequest(updateCategoryStatusSchema), 
  updateCategoryStatus
);

// Bulk Operations
router.post('/bulk/products/update-status', 
  authenticateToken, 
  requireAdmin,
  async (req: any, res: any, next: any) => {
    try {
      const { productIds, isActive } = req.body;
      
      if (!Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Product IDs array is required'
        });
      }

      const { Product } = require('../models/Product');
      
      await Product.updateMany(
        { _id: { $in: productIds } },
        { isActive }
      );

      res.json({
        success: true,
        message: `${productIds.length} products updated successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/bulk/orders/update-status', 
  authenticateToken, 
  requireAdmin,
  async (req: any, res: any, next: any) => {
    try {
      const { orderNumbers, status } = req.body;

    if (!Array.isArray(orderNumbers) || orderNumbers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Order IDs array is required'
        });
      }

      const { Order } = require('../models/Order');
      
      await Order.updateMany(
        { orderNumber: { $in: orderNumbers } },
        { orderStatus: status }
      );

      res.json({
        success: true,
        message: `${orderNumbers.length} orders updated successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

// Export/Import functionality
router.get('/export/orders', 
  authenticateToken, 
  requireAdmin,
  async (req: any, res: any, next: any) => {
    try {
      const { startDate, endDate, format = 'json' } = req.query;
      
      const query: any = {};
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const { Order } = require('../models/Order');
      
      const orders = await Order.find(query)
        .populate('userId', 'name phone email')
        .populate('items.productId', 'name brand')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        // TODO: Implement CSV export
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
        res.send('CSV export not implemented yet');
      } else {
        res.json({
          success: true,
          data: { orders },
          count: orders.length
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

router.get('/export/users', 
  authenticateToken, 
  requireAdmin,
  async (req: any, res: any, next: any) => {
    try {
      const { format = 'json' } = req.query;
      
      const { User } = require('../models/User');
      
      const users = await User.find({})
        .select('-__v')
        .sort({ createdAt: -1 });

      if (format === 'csv') {
        // TODO: Implement CSV export
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
        res.send('CSV export not implemented yet');
      } else {
        res.json({
          success: true,
          data: { users },
          count: users.length
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// System Health
router.get('/system/health', 
  authenticateToken, 
  requireAdmin,
  async (req: any, res: any, next: any) => {
    try {
      const mongoose = require('mongoose');
      
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      res.json({
        success: true,
        data: {
          status: 'healthy',
          database: dbStatus,
          uptime: `${Math.floor(uptime / 60)} minutes`,
          memory: {
            used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
          },
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;