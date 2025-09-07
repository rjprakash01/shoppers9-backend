import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Cart } from '../models/Cart';
import { Product } from '../models/Product';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus, PaymentStatus, RefundStatus } from '../types';

// Create a new order from cart
export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shippingAddress, paymentMethod, couponCode } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart || cart.items.length === 0) {
      return next(new AppError('Cart is empty', 400));
    }

    // Validate stock availability
    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return next(new AppError(`Product ${item.product} not found`, 404));
      }

      const variant = product.variants.find(v => v._id?.toString() === item.variantId);
      if (!variant) {
        return next(new AppError(`Product variant not found`, 404));
      }

      const size = variant.sizes.find(s => s.size === item.size);
      if (!size || size.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for ${product.name} - ${item.size}`, 400));
      }
    }

    // Generate order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD${Date.now()}${(orderCount + 1).toString().padStart(4, '0')}`;

    // Calculate totals
    const totalAmount = cart.totalAmount;
    const discount = cart.totalDiscount + (cart.couponDiscount || 0);
    const platformFee = totalAmount > 500 ? 0 : 20; // Match cart summary calculation
    const deliveryCharge = totalAmount > 500 ? 0 : 50; // Match cart summary calculation
    
    // Ensure finalAmount is never negative
    let finalAmount = totalAmount - discount + platformFee + deliveryCharge;
    if (finalAmount < 0) {
      finalAmount = platformFee + deliveryCharge; // Minimum amount should be fees only
    }

    // Create order
    const order = new Order({
      orderNumber,
      userId,
      items: cart.items,
      shippingAddress,
      billingAddress: shippingAddress, // Use same as shipping for now
      paymentMethod,
      totalAmount,
      discount,
      platformFee,
      deliveryCharge,
      finalAmount,
      couponCode,
      couponDiscount: cart.couponDiscount,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await order.save();

    // Update product stock
    for (const item of cart.items) {
      await Product.updateOne(
        {
          _id: item.product,
          'variants._id': item.variantId,
          'variants.sizes.size': item.size
        },
        {
          $inc: { 'variants.$.sizes.$[size].stock': -item.quantity }
        },
        {
          arrayFilters: [{ 'size.size': item.size }]
        }
      );
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
    const userId = req.user?.id;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const query: any = { userId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('items.product', 'name images');

    const total = await Order.countDocuments(query);

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
      .populate('items.product', 'name images brand');

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

    // Restore product stock
    for (const item of order.items) {
      await Product.updateOne(
        {
          _id: item.product,
          'variants._id': item.variantId,
          'variants.sizes.size': item.size
        },
        {
          $inc: { 'variants.$.sizes.$[size].stock': item.quantity }
        },
        {
          arrayFilters: [{ 'size.size': item.size }]
        }
      );
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

// Get order analytics (for admin)
export const getOrderAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage: any = {};
    if (startDate && endDate) {
      matchStage.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const analytics = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          averageOrderValue: { $avg: '$finalAmount' },
          completedOrders: {
            $sum: {
              $cond: [{ $eq: ['$orderStatus', OrderStatus.DELIVERED] }, 1, 0]
            }
          },
          cancelledOrders: {
            $sum: {
              $cond: [{ $eq: ['$orderStatus', OrderStatus.CANCELLED] }, 1, 0]
            }
          }
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

    res.json({
      success: true,
      data: {
        analytics: analytics[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          averageOrderValue: 0,
          completedOrders: 0,
          cancelledOrders: 0
        },
        statusBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};