import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus, PaymentStatus, RefundStatus } from '../types';
import { inventoryService } from '../services/inventoryService';
import { shippingService } from '../services/shippingService';
import { couponService } from '../services/couponService';
import { notificationService } from '../services/notificationService';
import { settingsService } from '../services/settingsService';

// Create a new order from cart
export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;
    const userId = req.user?.userId || req.user?.id;

    console.log('Order creation request:', {
      userId,
      shippingAddress,
      paymentMethod,
      couponCode,
      userObject: req.user
    });

    if (!userId) {
      console.log('User not authenticated - no userId found');
      return next(new AppError('User not authenticated', 401));
    }

    // Validate required fields
    if (!shippingAddress) {
      console.log('Shipping address missing');
      return next(new AppError('Shipping address is required', 400));
    }

    if (!paymentMethod) {
      console.log('Payment method missing');
      return next(new AppError('Payment method is required', 400));
    }

    // Validate shipping address fields
    const requiredAddressFields = ['name', 'phone', 'addressLine1', 'city', 'state', 'pincode'];
    for (const field of requiredAddressFields) {
      if (!shippingAddress[field]) {
        return next(new AppError(`Shipping address ${field} is required`, 400));
      }
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId });
    
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }



    // Validate stock availability using inventory service
    const stockItems = cart.items.map(item => ({
      productId: item.product,
      variantId: item.variantId,
      quantity: item.quantity
    }));

    const stockCheck = await inventoryService.checkStock(stockItems);
    if (!stockCheck.inStock) {
      const unavailableItems = stockCheck.unavailableItems.map(item => {
        const cartItem = cart.items.find(ci => ci.product === item.productId && ci.variantId === item.variantId);
        return `${cartItem?.product || 'Unknown Product'} - Requested: ${item.requested}, Available: ${item.available}`;
      }).join(', ');
      return next(new AppError(`Insufficient stock for: ${unavailableItems}`, 400));
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD${Date.now()}${(orderCount + 1).toString().padStart(4, '0')}`;

    // Calculate totals correctly with null safety
    // totalAmount should be the original amount before any discounts
    // cart.totalAmount is already discounted, so we need to calculate the original amount
    const originalAmount = cart.items.reduce((sum, item) => {
      const originalPrice = item.originalPrice || 0;
      const quantity = item.quantity || 1;
      return sum + (originalPrice * quantity);
    }, 0);
    
    // Validate that we have valid amounts
    if (originalAmount === 0 || isNaN(originalAmount)) {
      console.error('Invalid original amount calculated:', originalAmount);
      console.error('Cart items:', cart.items.map(item => ({
        product: item.product,
        originalPrice: item.originalPrice,
        price: item.price,
        quantity: item.quantity
      })));
      return next(new AppError('Invalid cart data - unable to calculate order amount', 400));
    }
    
    const totalAmount = originalAmount; // Original amount before discounts
    const discount = cart.totalDiscount || 0; // Only item-level discounts, not coupon discount
    const discountedAmount = cart.totalAmount || originalAmount; // This is the amount after item-level discounts
    
    // Calculate fees based on discounted amount using dynamic settings
    const platformFee = await settingsService.calculatePlatformFee(discountedAmount);
    const deliveryCharge = await settingsService.calculateDeliveryFee(discountedAmount);
    
    // Apply coupon discount if available
    let couponDiscount = 0;
    if (couponCode && cart.couponDiscount) {
      couponDiscount = cart.couponDiscount;
    }
    
    // finalAmount should be the discounted amount minus coupon discount plus fees
    let finalAmount = discountedAmount - couponDiscount + platformFee + deliveryCharge;
    if (finalAmount < 0) {
      finalAmount = platformFee + deliveryCharge; // Minimum amount should be fees only
    }
    
    // Validate final amount
    if (isNaN(finalAmount) || finalAmount === null || finalAmount === undefined) {
      console.error('Invalid final amount calculated:', finalAmount);
      console.error('Calculation details:', {
        discountedAmount,
        couponDiscount,
        platformFee,
        deliveryCharge
      });
      return next(new AppError('Invalid order calculation - unable to determine final amount', 400));
    }

    // Fetch product details to set sellerId for each item
    // Handle both populated objects and string IDs from cart items
    const productIds = cart.items.map(item => {
      // Extract the actual product ID whether it's a string, ObjectId, or populated object
      let productId;
      if (typeof item.product === 'string') {
        productId = item.product;
      } else if (item.product && (item.product as any)._id) {
        // If it's a populated object, get the _id
        productId = (item.product as any)._id.toString();
      } else if (item.product && typeof item.product === 'object') {
        // If it's an ObjectId, convert to string
        productId = (item.product as any).toString();
      } else {
        productId = item.product;
      }
      
      try {
        return new mongoose.Types.ObjectId(productId);
      } catch (error) {
        console.log(`Warning: Invalid ObjectId format for product ${productId}`);
        return productId;
      }
    });
    
    const products = await Product.find({ 
      _id: { $in: productIds },
      isActive: true,
      approvalStatus: 'approved'
    }).select('_id createdBy');
    
    console.log('Order creation - Product mapping debug:');
    console.log('Cart items:', cart.items.length);
    console.log('Products found:', products.length);
    
    // Add sellerId to each cart item with enhanced error handling
    const itemsWithSeller = [];
    
    for (let index = 0; index < cart.items.length; index++) {
      const item = cart.items[index];
      
      // Extract product ID consistently
      let itemProductId;
      if (typeof item.product === 'string') {
        itemProductId = item.product;
      } else if (item.product && (item.product as any)._id) {
        itemProductId = (item.product as any)._id.toString();
      } else if (item.product && typeof item.product === 'object') {
        itemProductId = (item.product as any).toString();
      } else {
        itemProductId = item.product;
      }
      
      const product = products.find(p => p._id.toString() === itemProductId);
      
      console.log(`Item ${index + 1}:`);
      console.log(`  Product ID: ${itemProductId}`);
      console.log(`  Product found: ${product ? 'YES' : 'NO'}`);
      
      if (product) {
        console.log(`  Created By: ${product.createdBy}`);
        console.log(`  Seller ID set to: ${product.createdBy}`);
        itemsWithSeller.push({
          ...item,
          product: itemProductId, // Ensure we store the ID, not the populated object
          sellerId: product.createdBy
        });
      } else {
        console.log(`  ❌ WARNING: Product not found for ID ${itemProductId}`);
        console.log(`  Available product IDs: ${products.map(p => p._id.toString()).join(', ')}`);
        
        // Try to find product with direct query as fallback
        try {
          const fallbackProduct = await Product.findOne({
            _id: itemProductId,
            isActive: true,
            approvalStatus: 'approved'
          }).select('_id createdBy');
          if (fallbackProduct) {
            console.log(`  ✅ Fallback: Found product with direct query`);
            console.log(`  Fallback Created By: ${fallbackProduct.createdBy}`);
            itemsWithSeller.push({
              ...item,
              product: itemProductId,
              sellerId: fallbackProduct.createdBy
            });
          } else {
            console.log(`  ❌ CRITICAL: Product not found even with fallback query`);
            itemsWithSeller.push({
              ...item,
              product: itemProductId,
              sellerId: null
            });
          }
        } catch (fallbackError) {
          console.log(`  ❌ ERROR in fallback query: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`);
          itemsWithSeller.push({
            ...item,
            product: itemProductId,
            sellerId: null
          });
        }
      }
    }
    
    // Verify all items have sellerId
    const itemsWithoutSeller = itemsWithSeller.filter(item => !item.sellerId);
    if (itemsWithoutSeller.length > 0) {
      console.log(`❌ WARNING: ${itemsWithoutSeller.length} items don't have sellerId set`);
      itemsWithoutSeller.forEach((item, index) => {
        console.log(`  Item ${index + 1}: Product ${item.product} - No seller ID`);
      });
    } else {
      console.log(`✅ All ${itemsWithSeller.length} items have sellerId set`);
    }

    // Create order
    const order = new Order({
      orderNumber,
      userId,
      items: itemsWithSeller,
      shippingAddress,
      billingAddress: shippingAddress, // Use same as shipping for now
      paymentMethod,
      totalAmount,
      discount,
      platformFee,
      deliveryCharge,
      finalAmount,
      couponCode,
      couponDiscount,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await order.save();

    // Create notifications for admin panel - both super admin and product owners
    try {
      const user = await User.findById(userId).select('firstName lastName');
      const customerName = user ? `${(user as any).firstName} ${(user as any).lastName}` : 'Customer';
      
      // Get product details to identify sellers
      const productIds = order.items.map(item => item.product);
      const products = await Product.find({ 
        _id: { $in: productIds },
        isActive: true,
        approvalStatus: 'approved'
      }).select('_id createdBy name');
      
      // Group items by seller
      const sellerGroups = new Map();
      
      for (const item of order.items) {
        const product = products.find(p => p._id.toString() === item.product.toString());
        if (product && product.createdBy) {
          const sellerId = product.createdBy.toString();
          if (!sellerGroups.has(sellerId)) {
            sellerGroups.set(sellerId, {
              items: [],
              totalAmount: 0
            });
          }
          const group = sellerGroups.get(sellerId);
          group.items.push({ ...item, productName: product.name });
          group.totalAmount += item.price * item.quantity;
        }
      }
      
      // Send notification to super admin (global notification)
      await notificationService.createNewOrderNotification({
        orderId: order.orderNumber,
        customerName,
        customerId: userId,
        totalAmount: order.finalAmount,
        itemCount: order.items.length
      });
      
      // Send individual notifications to each seller/admin
      for (const [sellerId, group] of sellerGroups) {
        await notificationService.createNewOrderNotification({
          orderId: order.orderNumber,
          customerName,
          customerId: userId,
          totalAmount: group.totalAmount,
          itemCount: group.items.length,
          sellerId: sellerId // Add seller-specific info
        });
      }
      
    } catch (notificationError) {
      console.error('Failed to create new order notification:', notificationError);
      // Continue with order creation even if notification fails
    }

    // Reserve stock using inventory service
    try {
      await inventoryService.reserveStock(stockItems);
    } catch (error) {
      // If stock reservation fails, delete the order and throw error
      await Order.findByIdAndDelete(order._id);
      return next(new AppError(`Failed to reserve stock: ${(error as Error).message}`, 400));
    }

    // Increment coupon usage if coupon was applied
    if (cart.appliedCoupon) {
      try {
        await couponService.incrementCouponUsage(cart.appliedCoupon);
      } catch (error) {
        console.error('Failed to increment coupon usage:', error);
        // Don't fail the order for coupon tracking issues
      }
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId }, { items: [], totalAmount: 0, totalDiscount: 0, subtotal: 0, couponDiscount: 0, appliedCoupon: '' });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.finalAmount,
          estimatedDelivery: order.estimatedDelivery,
          status: order.orderStatus
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user's orders
export const getUserOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    console.log('Fetching orders for userId:', userId);
    const query: any = { userId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('items.product', 'name images brand variants');

    const total = await Order.countDocuments(query);
    
    console.log('Found orders:', orders.length, 'Total count:', total);
    if (orders.length > 0) {
      console.log('First order:', JSON.stringify(orders[0], null, 2));
    }

    res.json({
      success: true,
      data: {
        orders,
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

// Get order by ID
export const getOrderById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const order = await Order.findOne({ orderNumber, userId })
      .populate('items.product', 'name images brand variants');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Cancel order
export const cancelOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const order = await Order.findOne({ orderNumber, userId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if order can be cancelled
    if (order.orderStatus === OrderStatus.DELIVERED || order.orderStatus === OrderStatus.CANCELLED) {
      return next(new AppError('Order cannot be cancelled at this stage', 400));
    }

    // Update order status
    order.orderStatus = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;

    // If payment was made, initiate refund
    if (order.paymentStatus === PaymentStatus.SUCCESS) {
      order.refundStatus = RefundStatus.PENDING;
      order.refundAmount = order.finalAmount;
    }

    await order.save();

    // Create notification for admin panel
    try {
      const user = await User.findById(userId).select('firstName lastName');
      const customerName = user ? `${(user as any).firstName} ${(user as any).lastName}` : 'Customer';
      
      await notificationService.createOrderCancelledNotification({
        orderId: order.orderNumber,
        customerName,
        customerId: userId,
        reason: reason || 'No reason provided'
      });
    } catch (notificationError) {
      console.error('Failed to create cancellation notification:', notificationError);
      // Continue with cancellation even if notification fails
    }

    // Restore product stock using inventory service
    const stockItems = order.items.map(item => ({
      productId: item.product,
      variantId: item.variantId,
      quantity: item.quantity
    }));

    try {
      await inventoryService.releaseStock(stockItems);
    } catch (error) {
      console.error('Failed to restore stock for cancelled order:', error);
      // Continue with cancellation even if stock restoration fails
    }

    // Restore coupon usage if coupon was used
    if (order.couponCode) {
      try {
        await couponService.decrementCouponUsage(order.couponCode);
      } catch (error) {
        console.error('Failed to restore coupon usage for cancelled order:', error);
        // Continue with cancellation even if coupon restoration fails
      }
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Update order status (for admin)
export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;
    const { status, trackingId } = req.body;

    const order = await Order.findOne({ orderNumber });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Update order status
    order.orderStatus = status as OrderStatus;
    
    // Set delivery date if status is delivered
    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }
    
    if (trackingId) {
      order.trackingId = trackingId;
    }

    if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
      order.paymentStatus = PaymentStatus.SUCCESS;
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Process payment
export const processPayment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;
    const { paymentId, paymentMethod } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const order = await Order.findOne({ orderNumber, userId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // For now, we'll simulate payment processing
    // In a real app, you'd integrate with payment gateways like Razorpay, Stripe, etc.
    
    order.paymentStatus = PaymentStatus.SUCCESS;
    order.paymentId = paymentId;
    order.orderStatus = OrderStatus.CONFIRMED;

    await order.save();

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

// Request return for an order
export const requestReturn = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const order = await Order.findOne({ orderNumber, userId });
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Check if order can be returned
    if (order.orderStatus !== 'delivered') {
      return next(new AppError('Only delivered orders can be returned', 400));
    }

    // Check if return window is still open (30 days)
    const deliveredDate = order.deliveredAt;
    if (!deliveredDate) {
      return next(new AppError('Order delivery date not found', 400));
    }

    const daysSinceDelivery = Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDelivery > 30) {
      return next(new AppError('Return window has expired (30 days)', 400));
    }

    // Check if return already requested
    if (order.returnRequestedAt) {
      return next(new AppError('Return already requested for this order', 400));
    }

    // Update order with return request
    order.returnRequestedAt = new Date();
    order.returnReason = reason;
    order.orderStatus = 'return_requested' as any;
    
    await order.save();

    // Create notification for admin panel
    try {
      const user = await User.findById(userId).select('firstName lastName');
      const customerName = user ? `${(user as any).firstName} ${(user as any).lastName}` : 'Customer';
      
      // Get product names from order items
      const productNames = order.items.map(item => {
        if (typeof item.product === 'object' && (item.product as any).name) {
          return (item.product as any).name;
        }
        return 'Product';
      }).join(', ');
      
      await notificationService.createReturnRequestNotification({
        orderId: order.orderNumber,
        customerName,
        customerId: userId,
        productName: productNames,
        reason: reason || 'No reason provided'
      });
    } catch (notificationError) {
      console.error('Failed to create return request notification:', notificationError);
      // Continue with return request even if notification fails
    }

    res.json({
        success: true,
        message: 'Return request submitted successfully',
        data: {
          order,
          returnRequestedAt: order.returnRequestedAt,
          returnReason: order.returnReason
        }
      });
    } catch (error: any) {
      next(new AppError(error.message || 'Failed to request return', 500));
  }
};

// Get order analytics (for admin)
// Calculate shipping rates for checkout
export const calculateCheckoutShipping = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shippingAddress, serviceType, providerId } = req.body;
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    if (!shippingAddress || !shippingAddress.pincode) {
      return next(new AppError('Shipping address with pincode is required', 400));
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }

    // Calculate package details from cart items
    let totalWeight = 0;
    let totalValue = cart.totalAmount;
    const maxDimensions = { length: 30, width: 20, height: 15 }; // Default package dimensions

    // Estimate weight based on items (this could be enhanced with actual product weights)
    for (const item of cart.items) {
      totalWeight += item.quantity * 0.5; // Assume 0.5kg per item as default
    }

    // Ensure minimum weight
    totalWeight = Math.max(totalWeight, 0.1);

    const shippingRequest = {
      weight: totalWeight,
      dimensions: maxDimensions,
      value: totalValue,
      fromPincode: '110001', // Default warehouse pincode
      toPincode: shippingAddress.pincode,
      serviceType,
      providerId
    };

    const shippingOptions = await shippingService.calculateShippingRates(shippingRequest);

    res.json({
      success: true,
      message: 'Shipping rates calculated successfully',
      data: {
        options: shippingOptions,
        packageDetails: {
          weight: totalWeight,
          dimensions: maxDimensions,
          value: totalValue
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, status } = req.query;

    const matchStage: any = {};
    
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate as string);
    }
    
    if (status) {
      matchStage.orderStatus = status;
    }

    const analytics = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' },
          totalItems: { $sum: { $size: '$items' } }
        }
      }
    ]);

    const statusBreakdown = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      }
    ]);

    const monthlyTrend = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$finalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: analytics[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          totalItems: 0
        },
        statusBreakdown,
        monthlyTrend
      }
    });
  } catch (error: any) {
    next(new AppError(error.message || 'Failed to get order analytics', 500));
  }
};