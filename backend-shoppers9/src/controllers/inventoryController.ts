import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { inventoryService, StockUpdateRequest } from '../services/inventoryService';

/**
 * Get inventory overview and statistics
 */
export const getInventoryOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await inventoryService.getInventoryReport();
    
    res.json({
      success: true,
      message: 'Inventory overview retrieved successfully',
      data: report
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get low stock alerts
 */
export const getLowStockAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const alerts = await inventoryService.getLowStockAlerts();
    
    res.json({
      success: true,
      message: 'Low stock alerts retrieved successfully',
      data: {
        alerts,
        count: alerts.length,
        summary: {
          outOfStock: alerts.filter(a => a.severity === 'out_of_stock').length,
          critical: alerts.filter(a => a.severity === 'critical').length,
          low: alerts.filter(a => a.severity === 'low').length
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed inventory for all products
 */
export const getDetailedInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search, category, stockStatus } = req.query;
    
    // Build filter query
    const filter: any = { isActive: true };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (category) {
      filter.category = category;
    }
    
    // Get products with pagination
    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .skip(skip)
      .limit(Number(limit))
      .sort({ name: 1 });
    
    const total = await Product.countDocuments(filter);
    
    // Process products to include stock information
    const inventoryData = products.map(product => {
      const variants = product.variants.map(variant => {
        let stockStatus = 'in_stock';
        if (variant.stock === 0) {
          stockStatus = 'out_of_stock';
        } else if (variant.stock <= 5) {
          stockStatus = 'critical';
        } else if (variant.stock <= 10) {
          stockStatus = 'low';
        }
        
        return {
          _id: variant._id,
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
          price: variant.price,
          originalPrice: variant.originalPrice,
          stock: variant.stock,
          stockStatus,
          images: variant.images
        };
      });
      
      // Filter variants by stock status if requested
      const filteredVariants = stockStatus 
        ? variants.filter(v => v.stockStatus === stockStatus)
        : variants;
      
      return {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subCategory: product.subCategory,
        totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
        variants: filteredVariants,
        variantCount: variants.length,
        lowStockVariants: variants.filter(v => v.stockStatus === 'low' || v.stockStatus === 'critical').length,
        outOfStockVariants: variants.filter(v => v.stockStatus === 'out_of_stock').length
      };
    }).filter(product => !stockStatus || product.variants.length > 0);
    
    res.json({
      success: true,
      message: 'Detailed inventory retrieved successfully',
      data: {
        products: inventoryData,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update stock for a specific variant
 */
export const updateVariantStock = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId } = req.params;
    const { stock, operation = 'set', reason } = req.body;
    
    if (typeof stock !== 'number' || stock < 0) {
      return next(new AppError('Stock must be a non-negative number', 400));
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }
    
    const variant = product.variants.find(v => v._id?.toString() === variantId);
    if (!variant) {
      return next(new AppError('Product variant not found', 404));
    }
    
    let updateRequest: StockUpdateRequest;
    
    if (operation === 'set') {
      // Set absolute stock value
      const currentStock = variant.stock;
      const difference = stock - currentStock;
      
      updateRequest = {
        productId,
        variantId,
        quantity: Math.abs(difference),
        operation: difference >= 0 ? 'increase' : 'decrease',
        reason: reason || 'Manual stock adjustment'
      };
    } else {
      // Increase or decrease stock
      updateRequest = {
        productId,
        variantId,
        quantity: stock,
        operation: operation as 'increase' | 'decrease',
        reason: reason || `Manual stock ${operation}`
      };
    }
    
    const updatedVariant = await inventoryService.updateStock(updateRequest);
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        variant: updatedVariant,
        previousStock: operation === 'set' ? variant.stock : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update stock from CSV or form data
 */
export const bulkUpdateStock = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return next(new AppError('Updates array is required', 400));
    }
    
    // Validate updates format
    for (const update of updates) {
      if (!update.sku || typeof update.newStock !== 'number' || update.newStock < 0) {
        return next(new AppError('Each update must have sku and valid newStock', 400));
      }
    }
    
    const result = await inventoryService.bulkUpdateStock(updates);
    
    res.json({
      success: true,
      message: 'Bulk stock update completed',
      data: {
        successful: result.successful,
        failed: result.failed,
        total: updates.length,
        successRate: `${((result.successful / updates.length) * 100).toFixed(1)}%`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get stock history for a product variant
 */
export const getStockHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId } = req.params;
    
    const history = await inventoryService.getStockHistory(productId, variantId);
    
    res.json({
      success: true,
      message: 'Stock history retrieved successfully',
      data: {
        history,
        count: history.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check stock availability for multiple items
 */
export const checkStockAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return next(new AppError('Items array is required', 400));
    }
    
    // Validate items format
    for (const item of items) {
      if (!item.productId || !item.variantId || typeof item.quantity !== 'number' || item.quantity <= 0) {
        return next(new AppError('Each item must have productId, variantId, and valid quantity', 400));
      }
    }
    
    const stockCheck = await inventoryService.checkStock(items);
    
    res.json({
      success: true,
      message: 'Stock availability checked successfully',
      data: {
        inStock: stockCheck.inStock,
        unavailableItems: stockCheck.unavailableItems,
        availableItems: items.filter(item => 
          !stockCheck.unavailableItems.some(unavailable => 
            unavailable.productId === item.productId && unavailable.variantId === item.variantId
          )
        )
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products with low stock for reorder suggestions
 */
export const getReorderSuggestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { threshold = 10 } = req.query;
    
    const products = await Product.find({ 
      isActive: true,
      'variants.stock': { $lte: Number(threshold) }
    })
    .populate('category', 'name')
    .populate('subCategory', 'name')
    .sort({ 'variants.stock': 1 });
    
    const suggestions = products.map(product => {
      const lowStockVariants = product.variants.filter(v => v.stock <= Number(threshold));
      
      return {
        _id: product._id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subCategory: product.subCategory,
        lowStockVariants: lowStockVariants.map(variant => ({
          _id: variant._id,
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
          currentStock: variant.stock,
          suggestedReorder: Math.max(50, variant.stock * 5), // Suggest 5x current stock or minimum 50
          priority: variant.stock === 0 ? 'urgent' : variant.stock <= 5 ? 'high' : 'medium'
        }))
      };
    }).filter(product => product.lowStockVariants.length > 0);
    
    res.json({
      success: true,
      message: 'Reorder suggestions retrieved successfully',
      data: {
        suggestions,
        count: suggestions.length,
        totalVariants: suggestions.reduce((sum, p) => sum + p.lowStockVariants.length, 0)
      }
    });
  } catch (error) {
    next(error);
  }
};