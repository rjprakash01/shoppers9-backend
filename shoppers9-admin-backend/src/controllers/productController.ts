import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Product, { productSchema } from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import { AuthenticatedRequest } from '../types';
import { DualWriteService } from '../services/dualWriteService';

/**
 * Get all products with pagination and filters
 */
export const getAllProducts = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    
    // Apply filters based on query parameters
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.approval) {
      query.approval = req.query.approval;
    }

    // Apply role-based data filtering
    const dataFilter = req.dataFilter?.getFilter('Product') || {};
    const filteredQuery = { ...query, ...dataFilter };

    console.log('Product query with data filter:', filteredQuery);
    console.log('User role:', req.admin?.role);
    console.log('User ID:', req.admin?._id);

    const products = await Product.find(filteredQuery)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Product.countDocuments(filteredQuery);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
};

/**
 * Get single product by ID
 */
export const getProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('subCategory', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product'
    });
  }
};

/**
 * Create new product
 */
export const createProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Creating product with data:', JSON.stringify(req.body, null, 2));
    console.log('Uploaded files:', req.files);
    
    // Process uploaded files
    const uploadedFiles = req.files as Express.Multer.File[];
    const imageUrls: string[] = [];
    
    if (uploadedFiles && uploadedFiles.length > 0) {
      uploadedFiles.forEach(file => {
        // Create relative URL path for the uploaded file
        const imageUrl = `/uploads/products/${file.filename}`;
        imageUrls.push(imageUrl);
      });
    }
    
    // Parse JSON strings for complex fields that come from FormData
    const parseJsonField = (field: any) => {
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          return field;
        }
      }
      return field;
    };

    const productData = {
      ...req.body,
      variants: parseJsonField(req.body.variants),
      filterValues: parseJsonField(req.body.filterValues),
      displayFilters: parseJsonField(req.body.displayFilters),
      features: parseJsonField(req.body.features),
      tags: parseJsonField(req.body.tags),
      specifications: parseJsonField(req.body.specifications),
      images: imageUrls.length > 0 ? imageUrls : [], // Ensure images array is always present
      createdBy: req.admin?._id,
      isActive: false, // Products created by admin should be inactive until approved
      approvalStatus: 'pending', // Explicitly set approval status
      reviewStatus: 'pending' // Explicitly set review status
    };
    
    // If no variants are provided, create a default variant
    if (!productData.variants || productData.variants.length === 0) {
      const defaultVariant = {
        color: 'Default',
        size: 'One Size',
        price: productData.price || 0,
        originalPrice: productData.originalPrice || productData.price || 0,
        stock: productData.stock || 0,
        sku: `${productData.name?.replace(/\s+/g, '-').toLowerCase() || 'product'}-default-${Date.now()}`,
        images: imageUrls.length > 0 ? imageUrls : []
      };
      productData.variants = [defaultVariant];
    }
    
    console.log('Final product data with images:', JSON.stringify(productData, null, 2));

    const product = new Product(productData);
    await product.save();
    
    // Use dual-write service to sync with external systems
    // If dual write fails, log the error but still return success since the product was created in admin DB
    try {
      await DualWriteService.create('Product', product.toObject(), productSchema);
      console.log('✅ Product successfully synced to main database');
    } catch (dualWriteError) {
      console.error('⚠️ Dual write failed, but product created in admin database:', dualWriteError.message);
      // Continue execution - don't fail the entire operation
    }

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      errors: error.errors
    });
    
    // Handle validation errors specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

/**
 * Update product
 */
export const updateProduct = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user?.id },
      { new: true, runValidators: true }
    );
    
    // Use dual-write service to sync with external systems
    if (product) {
      await DualWriteService.update('Product', { _id: product._id }, product.toObject(), productSchema);
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product'
    });
  }
};

/**
 * Delete product
 */
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    // Use dual-write service to sync with external systems
    if (product) {
      await DualWriteService.delete('Product', { _id: req.params.id }, productSchema);
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product'
    });
  }
};

/**
 * Toggle product status
 */
export const toggleProductStatus = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    product.isActive = !product.isActive;
    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
      data: product
    });
  } catch (error) {
    console.error('Error toggling product status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling product status'
    });
  }
};

/**
 * Get product analytics
 */
export const getProductAnalytics = async (req: Request, res: Response) => {
  try {
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const inactiveProducts = await Product.countDocuments({ isActive: false });
    const pendingApproval = await Product.countDocuments({ approval: 'pending' });
    const approvedProducts = await Product.countDocuments({ approval: 'approved' });

    res.json({
      success: true,
      data: {
        totalProducts,
        activeProducts,
        inactiveProducts,
        pendingApproval,
        approvedProducts
      }
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product analytics'
    });
  }
};

// Placeholder functions for other imports
export const bulkUpdateProducts = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getProductFilters = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getProductFilterValues = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const setProductFilterValues = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const getAvailableFilterOptionsForCategory = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

export const submitProductForReview = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { submissionNotes } = req.body;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product status to pending for review
    product.status = 'pending';
    product.updatedBy = userId;
    await product.save();

    res.json({
      success: true,
      message: 'Product submitted for review successfully',
      data: product
    });
  } catch (error) {
    console.error('Error submitting product for review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting product for review'
    });
  }
};

export const approveProduct = async (req: Request, res: Response) => {
  try {
    const { id: productId } = req.params;
    const { approvalComments } = req.body;
    const userId = (req as AuthenticatedRequest).admin?._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product in admin database first
    product.status = 'active';
    product.isActive = true;
    product.approvalStatus = 'approved';
    product.updatedBy = userId;
    product.updatedAt = new Date();
    await product.save();

    console.log('✅ Product approved in admin database:', productId);

    // Create the approved product in main database (since it doesn't exist there yet)
    try {
      const productData = product.toObject();
      // Ensure the product has the same _id in both databases
      const dualWriteResult = await DualWriteService.create(
        'Product',
        productData,
        productSchema
      );
      
      console.log('✅ Product created in main website database:', productId);
    } catch (mainDbError) {
      console.log('⚠️ Product might already exist in main database, trying update instead...');
      
      // If create fails (product might already exist), try update
      const updateData = {
        status: 'active',
        isActive: true,
        approvalStatus: 'approved',
        updatedBy: userId,
        updatedAt: new Date()
      };
      
      await DualWriteService.update(
        'Product',
        { _id: productId },
        updateData,
        productSchema
      );
      
      console.log('✅ Product updated in main website database:', productId);
    }

    res.json({
      success: true,
      message: 'Product approved successfully and synced to main website',
      data: product
    });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving product: ' + error.message
    });
  }
};

export const rejectProduct = async (req: Request, res: Response) => {
  try {
    const { id: productId } = req.params;
    const { rejectionReason } = req.body;
    const userId = (req as AuthenticatedRequest).admin?._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product status to rejected
    product.status = 'rejected';
    product.isActive = false;
    product.updatedBy = userId;
    await product.save();

    res.json({
      success: true,
      message: 'Product rejected successfully',
      data: product
    });
  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting product'
    });
  }
};

export const requestProductChanges = async (req: Request, res: Response) => {
  try {
    const { id: productId } = req.params;
    const { reason, comments } = req.body;
    const userId = (req as AuthenticatedRequest).admin?._id;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for changes is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Update product status to inactive (needs changes)
    product.status = 'inactive';
    product.isActive = false;
    product.updatedBy = userId;
    await product.save();

    res.json({
      success: true,
      message: 'Change requests sent successfully',
      data: product
    });
  } catch (error) {
    console.error('Error requesting product changes:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting product changes'
    });
  }
};

export const getReviewQueue = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    
    const query: any = {
      status: { $in: ['pending', 'inactive'] }
    };
    
    // Apply additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.category) {
      query.category = req.query.category;
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform _id to id for frontend compatibility
    const transformedProducts = products.map(product => ({
      ...product,
      id: product._id.toString(),
      reviewStatus: product.status, // Map status to reviewStatus for frontend compatibility
      submittedBy: {
        id: product.createdBy?._id?.toString() || '',
        name: product.createdBy ? `${product.createdBy.firstName || ''} ${product.createdBy.lastName || ''}`.trim() : 'Unknown'
      },
      submittedAt: product.createdAt
    }));

    const total = await Product.countDocuments(query);
    
    // Get counts for different statuses
    const statusCounts = await Product.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      pending: 0,
      active: 0,
      rejected: 0,
      inactive: 0
    };
    
    statusCounts.forEach(item => {
      if (item._id in counts) {
        counts[item._id as keyof typeof counts] = item.count;
      }
    });

    res.json({
      success: true,
      data: {
        products: transformedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        statusCounts: counts
      }
    });
  } catch (error) {
    console.error('Error fetching review queue:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review queue'
    });
  }
};

export const bulkReviewAction = async (req: Request, res: Response) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};