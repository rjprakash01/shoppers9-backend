import { Product, IProductVariant } from '../models/Product';
import { IProduct } from '../types';
import mongoose from 'mongoose';

export interface StockUpdateRequest {
  productId: string;
  variantId: string;
  quantity: number;
  operation: 'increase' | 'decrease';
  reason?: string;
}

export interface LowStockAlert {
  productId: string;
  productName: string;
  variantId: string;
  variant: {
    color: string;
    size: string;
    sku: string;
    currentStock: number;
  };
  threshold: number;
  severity: 'low' | 'critical' | 'out_of_stock';
}

export interface InventoryReport {
  totalProducts: number;
  totalVariants: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  criticalStockItems: number;
  topSellingVariants: Array<{
    productId: string;
    productName: string;
    variantId: string;
    variant: {
      color: string;
      size: string;
      sku: string;
      stock: number;
    };
  }>;
}

class InventoryService {
  private readonly LOW_STOCK_THRESHOLD = 10;
  private readonly CRITICAL_STOCK_THRESHOLD = 5;

  /**
   * Update stock for a specific product variant
   */
  async updateStock(request: StockUpdateRequest, session?: mongoose.ClientSession): Promise<IProductVariant | null> {
    const { productId, variantId, quantity, operation } = request;

    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const variant = product.variants.find(v => v._id?.toString() === variantId);
    if (!variant) {
      throw new Error('Product variant not found');
    }

    const currentStock = variant.stock;
    let newStock: number;

    if (operation === 'increase') {
      newStock = currentStock + quantity;
    } else {
      newStock = Math.max(0, currentStock - quantity);
      if (currentStock < quantity) {
        throw new Error(`Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`);
      }
    }

    variant.stock = newStock;
    
    // Check if product should be deactivated when total stock reaches zero
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    
    if (totalStock === 0 && product.isActive) {
      product.isActive = false;
      console.log(`Product ${product.name} (${productId}) automatically deactivated - total stock is zero`);
    } else if (totalStock > 0 && !product.isActive) {
      // Reactivate product if stock becomes available again
      product.isActive = true;
      console.log(`Product ${product.name} (${productId}) automatically reactivated - stock available`);
    }
    
    await product.save({ session });

    // Log stock change
    console.log(`Stock updated for ${variant.sku}: ${currentStock} → ${newStock} (${operation} ${quantity}). Total product stock: ${totalStock}`);

    return variant;
  }

  /**
   * Reserve stock for order processing
   */
  async reserveStock(items: Array<{ productId: string; variantId: string; quantity: number }>): Promise<boolean> {
    // Try with transactions first, fallback to regular operations if not supported
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        for (const item of items) {
          await this.updateStock({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            operation: 'decrease',
            reason: 'Order placement'
          }, session);
        }

        await session.commitTransaction();
        return true;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (transactionError: any) {
      // If transactions are not supported (standalone MongoDB), use regular operations
      if (transactionError.code === 20 || transactionError.codeName === 'IllegalOperation') {
        console.log('Transactions not supported, using regular operations');
        for (const item of items) {
          await this.updateStock({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            operation: 'decrease',
            reason: 'Order placement'
          });
        }
        return true;
      }
      throw transactionError;
    }
  }

  /**
   * Release reserved stock (for cancelled orders)
   */
  async releaseStock(items: Array<{ productId: string; variantId: string; quantity: number }>): Promise<boolean> {
    // Try with transactions first, fallback to regular operations if not supported
    try {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        for (const item of items) {
          await this.updateStock({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            operation: 'increase',
            reason: 'Order cancellation'
          }, session);
        }

        await session.commitTransaction();
        return true;
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    } catch (transactionError: any) {
      // If transactions are not supported (standalone MongoDB), use regular operations
      if (transactionError.code === 20 || transactionError.codeName === 'IllegalOperation') {
        console.log('Transactions not supported, using regular operations');
        for (const item of items) {
          await this.updateStock({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            operation: 'increase',
            reason: 'Order cancellation'
          });
        }
        return true;
      }
      throw transactionError;
    }
  }

  /**
   * Check if items are in stock
   */
  async checkStock(items: Array<{ productId: string; variantId: string; quantity: number }>): Promise<{
    inStock: boolean;
    unavailableItems: Array<{
      productId: string;
      variantId: string;
      requested: number;
      available: number;
    }>;
  }> {
    const unavailableItems: Array<{
      productId: string;
      variantId: string;
      requested: number;
      available: number;
    }> = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        unavailableItems.push({
          productId: item.productId,
          variantId: item.variantId,
          requested: item.quantity,
          available: 0
        });
        continue;
      }

      const variant = product.variants.find(v => v._id?.toString() === item.variantId);
      if (!variant || variant.stock < item.quantity) {
        unavailableItems.push({
          productId: item.productId,
          variantId: item.variantId,
          requested: item.quantity,
          available: variant?.stock || 0
        });
      }
    }

    return {
      inStock: unavailableItems.length === 0,
      unavailableItems
    };
  }

  /**
   * Get low stock alerts
   */
  async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const products = await Product.find({ isActive: true }).lean();
    const alerts: LowStockAlert[] = [];

    for (const product of products) {
      for (const variant of product.variants) {
        let severity: 'low' | 'critical' | 'out_of_stock';
        
        if (variant.stock === 0) {
          severity = 'out_of_stock';
        } else if (variant.stock <= this.CRITICAL_STOCK_THRESHOLD) {
          severity = 'critical';
        } else if (variant.stock <= this.LOW_STOCK_THRESHOLD) {
          severity = 'low';
        } else {
          continue; // Skip if stock is sufficient
        }

        alerts.push({
          productId: product._id.toString(),
          productName: product.name,
          variantId: variant._id!.toString(),
          variant: {
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
            currentStock: variant.stock
          },
          threshold: severity === 'critical' ? this.CRITICAL_STOCK_THRESHOLD : this.LOW_STOCK_THRESHOLD,
          severity
        });
      }
    }

    // Sort by severity (out_of_stock first, then critical, then low)
    return alerts.sort((a, b) => {
      const severityOrder = { out_of_stock: 0, critical: 1, low: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * Get inventory report
   */
  async getInventoryReport(): Promise<InventoryReport> {
    const products = await Product.find({ isActive: true }).lean();
    
    let totalVariants = 0;
    let totalStock = 0;
    let lowStockItems = 0;
    let outOfStockItems = 0;
    let criticalStockItems = 0;
    const topSellingVariants: Array<{
      productId: string;
      productName: string;
      variantId: string;
      variant: {
        color: string;
        size: string;
        sku: string;
        stock: number;
      };
    }> = [];

    for (const product of products) {
      for (const variant of product.variants) {
        totalVariants++;
        totalStock += variant.stock;

        if (variant.stock === 0) {
          outOfStockItems++;
        } else if (variant.stock <= this.CRITICAL_STOCK_THRESHOLD) {
          criticalStockItems++;
        } else if (variant.stock <= this.LOW_STOCK_THRESHOLD) {
          lowStockItems++;
        }

        // Add to top selling (for now, just add all variants - can be enhanced with sales data)
        topSellingVariants.push({
          productId: product._id.toString(),
          productName: product.name,
          variantId: variant._id!.toString(),
          variant: {
            color: variant.color,
            size: variant.size,
            sku: variant.sku,
            stock: variant.stock
          }
        });
      }
    }

    return {
      totalProducts: products.length,
      totalVariants,
      totalStock,
      lowStockItems,
      outOfStockItems,
      criticalStockItems,
      topSellingVariants: topSellingVariants.slice(0, 10) // Top 10
    };
  }

  /**
   * Bulk update stock from CSV or admin interface
   */
  async bulkUpdateStock(updates: Array<{
    sku: string;
    newStock: number;
    reason?: string;
  }>): Promise<{
    successful: number;
    failed: Array<{ sku: string; error: string }>;
  }> {
    let successful = 0;
    const failed: Array<{ sku: string; error: string }> = [];

    for (const update of updates) {
      try {
        const product = await Product.findOne({ 'variants.sku': update.sku });
        if (!product) {
          failed.push({ sku: update.sku, error: 'Product not found' });
          continue;
        }

        const variant = product.variants.find(v => v.sku === update.sku);
        if (!variant) {
          failed.push({ sku: update.sku, error: 'Variant not found' });
          continue;
        }

        const oldStock = variant.stock;
        variant.stock = Math.max(0, update.newStock);
        
        // Check if product should be deactivated when total stock reaches zero
        const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        
        if (totalStock === 0 && product.isActive) {
          product.isActive = false;
          console.log(`Product ${product.name} (${product._id}) automatically deactivated - total stock is zero`);
        } else if (totalStock > 0 && !product.isActive) {
          // Reactivate product if stock becomes available again
          product.isActive = true;
          console.log(`Product ${product.name} (${product._id}) automatically reactivated - stock available`);
        }
        
        await product.save();

        console.log(`Bulk stock update for ${update.sku}: ${oldStock} → ${variant.stock}. Total product stock: ${totalStock}`);
        successful++;
      } catch (error) {
        failed.push({ sku: update.sku, error: (error as Error).message });
      }
    }

    return { successful, failed };
  }

  /**
   * Get stock history (placeholder for future implementation)
   */
  async getStockHistory(productId: string, variantId?: string): Promise<any[]> {
    // This would require a separate StockHistory model to track all stock changes
    // For now, return empty array
    return [];
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;