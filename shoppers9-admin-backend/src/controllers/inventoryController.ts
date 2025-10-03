import { Request, Response } from 'express';
import Product from '../models/Product';
import { AuthRequest } from '../types';
import { NotificationService } from '../utils/notificationService';
import { applyPaginationWithFilter } from '../middleware/dataFilter';

export const getInventoryReport = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    // Apply data filtering for role-based access
    const filter = req.dataFilter?.getFilter('Product') || {};
    
    const totalProducts = await Product.countDocuments(filter);
    const activeProducts = await Product.countDocuments({ ...filter, isActive: true });
    
    // Calculate total variants and stock across all products
    const stockAggregation = await Product.aggregate([
      { $match: filter },
      {
        $project: {
          variantCount: { 
            $cond: {
              if: { $isArray: '$variants' },
              then: { $size: '$variants' },
              else: 0
            }
          },
          totalStock: { 
            $cond: {
              if: { $isArray: '$variants' },
              then: { $sum: '$variants.stock' },
              else: 0
            }
          },
          variants: 1
        }
      },
      {
        $group: {
          _id: null,
          totalVariants: { $sum: '$variantCount' },
          totalStock: { $sum: '$totalStock' }
        }
      }
    ]);

    const stockData = stockAggregation[0] || { totalVariants: 0, totalStock: 0 };

    // Count products with different stock levels
    const stockLevels = await Product.aggregate([
      { $match: filter },
      { $match: { variants: { $exists: true, $ne: null, $not: { $size: 0 } } } },
      { $unwind: '$variants' },
      {
        $group: {
          _id: {
            productId: '$_id',
            stockLevel: {
              $cond: {
                if: { $eq: ['$variants.stock', 0] },
                then: 'out_of_stock',
                else: {
                  $cond: {
                    if: { $lte: ['$variants.stock', 5] },
                    then: 'critical',
                    else: {
                      $cond: {
                        if: { $lte: ['$variants.stock', 10] },
                        then: 'low',
                        else: 'in_stock'
                      }
                    }
                  }
                }
              }
            }
          },
          variantCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.stockLevel',
          count: { $sum: '$variantCount' }
        }
      }
    ]);

    const stockCounts = {
      outOfStockItems: 0,
      criticalStockItems: 0,
      lowStockItems: 0,
      inStockItems: 0
    };

    stockLevels.forEach(level => {
      switch (level._id) {
        case 'out_of_stock':
          stockCounts.outOfStockItems = level.count;
          break;
        case 'critical':
          stockCounts.criticalStockItems = level.count;
          break;
        case 'low':
          stockCounts.lowStockItems = level.count;
          break;
        case 'in_stock':
          stockCounts.inStockItems = level.count;
          break;
      }
    });

    // Get top selling variants (placeholder - would need order data)
    const topSellingVariants = await Product.aggregate([
      { $unwind: '$variants' },
      {
        $project: {
          productName: '$name',
          variant: {
            color: '$variants.color',
            size: '$variants.size',
            sku: '$variants.sku',
            stock: '$variants.stock'
          }
        }
      },
      { $sort: { 'variant.stock': -1 } },
      { $limit: 10 }
    ]);

    const report = {
      totalProducts,
      totalVariants: stockData.totalVariants,
      totalStock: stockData.totalStock,
      ...stockCounts,
      topSellingVariants
    };

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching inventory report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getLowStockAlerts = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    // Apply data filtering for role-based access
    const filter = req.dataFilter?.getFilter('Product') || {};
    
    const alerts = await Product.aggregate([
      { $match: filter },
      { $unwind: '$variants' },
      {
        $match: {
          $or: [
            { 'variants.stock': 0 }, // Include out of stock
            { 'variants.stock': { $lte: 10, $gt: 0 } } // Include low stock
          ]
        }
      },
      {
        $project: {
          productId: '$_id',
          productName: '$name',
          variantId: '$variants._id',
          variant: {
            color: '$variants.color',
            size: '$variants.size',
            sku: '$variants.sku',
            currentStock: '$variants.stock'
          },
          threshold: {
            $cond: {
              if: { $eq: ['$variants.stock', 0] },
              then: 0,
              else: {
                $cond: {
                  if: { $lte: ['$variants.stock', 5] },
                  then: 5,
                  else: 10
                }
              }
            }
          },
          severity: {
            $cond: {
              if: { $eq: ['$variants.stock', 0] },
              then: 'out_of_stock',
              else: {
                $cond: {
                  if: { $lte: ['$variants.stock', 5] },
                  then: 'critical',
                  else: 'low'
                }
              }
            }
          }
        }
      },
      {
        $sort: {
          'variant.currentStock': 1, // Sort by stock level (lowest first)
          productName: 1
        }
      }
    ]);

    // Count alerts by severity
    const summary = {
      outOfStock: alerts.filter(alert => alert.severity === 'out_of_stock').length,
      critical: alerts.filter(alert => alert.severity === 'critical').length,
      low: alerts.filter(alert => alert.severity === 'low').length
    };

    res.json({
      success: true,
      data: {
        alerts,
        count: alerts.length,
        summary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stock alerts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDetailedInventory = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const stockStatus = req.query.stockStatus as string;

    // Build base query
    const baseQuery: any = {};
    const andConditions: any[] = [];

    if (search) {
      andConditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { 'variants.sku': { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (category) {
      andConditions.push({ category: category });
    }

    if (andConditions.length > 0) {
      baseQuery.$and = andConditions;
    }

    // Apply role-based filtering and pagination
    const { query: filteredQuery, pagination } = applyPaginationWithFilter(req, baseQuery, 'Product');

    // Build aggregation pipeline - simplified version to avoid $size errors
    const pipeline: any[] = [
      { $match: filteredQuery },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategoryInfo'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          brand: 1,
          category: { $arrayElemAt: ['$categoryInfo', 0] },
          subCategory: { $arrayElemAt: ['$subCategoryInfo', 0] },
          variants: { $ifNull: ['$variants', []] },
          totalStock: { $sum: { $ifNull: ['$variants.stock', []] } },
          variantCount: { $size: { $ifNull: ['$variants', []] } }
        }
      }
    ];

    // Add stock status filter if specified
    if (stockStatus) {
      let stockCondition: any;
      switch (stockStatus) {
        case 'out_of_stock':
          stockCondition = { totalStock: 0 };
          break;
        case 'critical':
          stockCondition = { 
            $and: [
              { totalStock: { $gt: 0 } },
              { 'variants.stock': { $lte: 5 } }
            ]
          };
          break;
        case 'low':
          stockCondition = { 
            $and: [
              { totalStock: { $gt: 0 } },
              { 'variants.stock': { $lte: 10, $gt: 5 } }
            ]
          };
          break;
        case 'in_stock':
          stockCondition = { totalStock: { $gt: 10 } };
          break;
      }
      if (stockCondition) {
        pipeline.push({ $match: stockCondition });
      }
    }

    // Add pagination
    pipeline.push(
      { $sort: { name: 1 } },
      { $skip: pagination.skip },
      { $limit: pagination.limit }
    );

    const [products, totalCount] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate([
        ...pipeline.slice(0, -3), // Remove sort, skip, limit for count
        { $count: 'total' }
      ])
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / pagination.limit);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: totalPages
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching detailed inventory',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateVariantStock = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const { productId, variantId } = req.params;
    const { stock, operation = 'set', reason } = req.body;
    
    if (typeof stock !== 'number' || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative number'
      });
    }
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const variant = product.variants.find(v => v.sku === variantId);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: 'Product variant not found'
      });
    }
    
    const previousStock = variant.stock;
    
    if (operation === 'set') {
      variant.stock = stock;
    } else if (operation === 'increase') {
      variant.stock += stock;
    } else if (operation === 'decrease') {
      variant.stock = Math.max(0, variant.stock - stock);
    }
    
    // Check if product should be reactivated when total stock becomes available
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    
    if (totalStock === 0 && product.isActive) {
      product.isActive = false;
      console.log(`Product ${product.name} (${productId}) automatically deactivated - total stock is zero`);
    } else if (totalStock > 0 && !product.isActive) {
      // Reactivate product if stock becomes available again
      product.isActive = true;
      console.log(`Product ${product.name} (${productId}) automatically reactivated - stock available`);
    }
    
    await product.save();
    
    // Create notifications for stock changes
    try {
      const newStock = variant.stock;
      
      // Check if stock became low (5 or less) or out of stock
      if (newStock === 0 && previousStock > 0) {
        // Stock became out of stock
        await NotificationService.createOutOfStockNotification({
          productId: product._id.toString(),
          productName: product.name,
          variantId: variant.sku,
          color: variant.color,
          size: variant.size
        });
      } else if (newStock <= 5 && newStock > 0 && previousStock > 5) {
        // Stock became low (crossed the threshold from high to low)
        await NotificationService.createLowStockNotification({
          productId: product._id.toString(),
          productName: product.name,
          variantId: variant.sku,
          color: variant.color,
          size: variant.size,
          stock: newStock
        });
      }
    } catch (notificationError) {
      console.error('Error creating stock notification:', notificationError);
      // Don't fail the stock update if notification fails
    }
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: {
        variant,
        previousStock,
        newStock: variant.stock,
        operation,
        reason
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating stock',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getReorderSuggestions = async (req: AuthRequest, res: Response): Promise<Response | void> => {
  try {
    const threshold = parseInt(req.query.threshold as string) || 10;
    
    // Apply data filtering for role-based access
    const filter = req.dataFilter?.getFilter('Product') || {};
    
    const suggestions = await Product.aggregate([
      { $match: filter },
      { $unwind: '$variants' },
      {
        $match: {
          'variants.stock': { $lte: threshold }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'subCategory',
          foreignField: '_id',
          as: 'subCategoryInfo'
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          brand: { $first: '$brand' },
          category: { $first: { $arrayElemAt: ['$categoryInfo', 0] } },
          subCategory: { $first: { $arrayElemAt: ['$subCategoryInfo', 0] } },
          lowStockVariants: {
            $push: {
              _id: '$variants._id',
              color: '$variants.color',
              size: '$variants.size',
              sku: '$variants.sku',
              currentStock: '$variants.stock',
              suggestedReorder: {
                $cond: {
                  if: { $eq: ['$variants.stock', 0] },
                  then: 50,
                  else: { $multiply: ['$variants.stock', 5] }
                }
              },
              priority: {
                $cond: {
                  if: { $eq: ['$variants.stock', 0] },
                  then: 'urgent',
                  else: {
                    $cond: {
                      if: { $lte: ['$variants.stock', 5] },
                      then: 'high',
                      else: 'medium'
                    }
                  }
                }
              }
            }
          }
        }
      },
      { $sort: { name: 1 } }
    ]);

    const totalVariants = suggestions.reduce((sum, product) => sum + product.lowStockVariants.length, 0);

    res.json({
      success: true,
      data: {
        suggestions,
        count: suggestions.length,
        totalVariants
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reorder suggestions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};