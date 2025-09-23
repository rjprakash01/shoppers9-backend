import { Request, Response } from 'express';
import Order from '../models/Order';
import { AuthRequest } from '../types';
import { NotificationService } from '../utils/notificationService';
import { applyPaginationWithFilter } from '../middleware/dataFilter';

export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== ADMIN ORDER API CALLED ===');
    console.log('Query params:', req.query);
    console.log('Admin user:', req.admin ? {
      id: req.admin._id,
      email: req.admin.email,
      primaryRole: req.admin.primaryRole
    } : 'NO ADMIN USER');
    console.log('Data filter:', req.dataFilter ? {
      role: req.dataFilter.role,
      userId: req.dataFilter.userId
    } : 'NO DATA FILTER');
    
    const {
      search,
      status,
      paymentStatus,
      userId,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build base query
    const baseQuery: any = {};

    if (search) {
      baseQuery.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    if (status) {
      baseQuery.orderStatus = status;
    }

    if (paymentStatus) {
      baseQuery.paymentStatus = paymentStatus;
    }

    if (userId) {
      baseQuery.userId = userId;
    }

    if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) baseQuery.createdAt.$gte = new Date(startDate as string);
      if (endDate) baseQuery.createdAt.$lte = new Date(endDate as string);
    }

    // Apply role-based filtering and pagination
    console.log('Base query before filtering:', baseQuery);
    const { query: filteredQuery, pagination } = applyPaginationWithFilter(req, baseQuery, 'Order');
    console.log('Filtered query after role-based filtering:', filteredQuery);
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    console.log('Sort options:', sortOptions);

    const orders = await Order.find(filteredQuery)
      .populate('userId', 'firstName lastName email phone')
      .populate('items.product', 'name images brand variants')
      .sort(sortOptions)
      .skip(pagination.skip)
      .limit(pagination.limit);

    const total = await Order.countDocuments(filteredQuery);

    // Debug: Log order data
    console.log('Orders found:', orders.length);
    if (orders.length > 0) {
      const firstOrder = orders[0] as any;
      console.log('First order totalAmount:', firstOrder.totalAmount);
      console.log('First order finalAmount:', firstOrder.finalAmount);
      console.log('First order items:', firstOrder.items?.map((item: any) => ({
        price: item.price,
        originalPrice: item.originalPrice,
        quantity: item.quantity
      })));
    }
    console.log('=== END ADMIN ORDER API ===');
 
    return res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          pages: Math.ceil(total / pagination.limit)
        }
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message || 'Unknown error'
    });
  }
};

export const getOrder = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')
      .populate('items.product', 'name images brand variants');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    return res.json({
      success: true,
      data: order
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching order',
      error: error.message || 'Unknown error'
    });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== UPDATE ORDER STATUS API CALLED ===');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { status, trackingId } = req.body;
    const orderId = req.params.id;

    // Validate required fields
    if (!status) {
      console.log('ERROR: Status is required');
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status values
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    console.log('Valid statuses:', validStatuses);
    console.log('Received status:', status);
    
    if (!validStatuses.includes(status)) {
      console.log('ERROR: Invalid status value:', status);
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    console.log('Status validation passed');

    const order = await Order.findById(orderId);
    console.log('Order found:', !!order);
    
    if (!order) {
      console.log('ERROR: Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    console.log('Current order status:', (order as any).orderStatus);
    console.log('Updating to status:', status);

    // Update order status
    (order as any).orderStatus = status;
    
    if (status === 'delivered') {
      (order as any).deliveredAt = new Date();
      console.log('Set deliveredAt timestamp');
    }
    
    if (status === 'cancelled') {
      (order as any).cancelledAt = new Date();
      console.log('Set cancelledAt timestamp');
    }
    
    if (status === 'returned') {
      (order as any).returnedAt = new Date();
      console.log('Set returnedAt timestamp');
    }

    if (trackingId) {
      (order as any).trackingId = trackingId;
      console.log('Set trackingId:', trackingId);
    }

    console.log('Saving order...');
    await order.save();
    console.log('Order saved successfully');

    // Create notifications for specific status changes
    try {
      const orderData = order as any;
      const user = orderData.userId;
      
      if (status === 'delivered') {
        await NotificationService.createOrderDeliveredNotification({
          orderId: orderData.orderNumber || orderData._id.toString(),
          customerName: user ? `${user.firstName} ${user.lastName}` : 'Customer',
          customerId: user ? user._id.toString() : '',
          deliveryAddress: orderData.shippingAddress ? 
            `${orderData.shippingAddress.street}, ${orderData.shippingAddress.city}` : 'Address'
        });
      } else if (status === 'cancelled') {
        await NotificationService.createOrderCancelledNotification({
          orderId: orderData.orderNumber || orderData._id.toString(),
          customerName: user ? `${user.firstName} ${user.lastName}` : 'Customer',
          customerId: user ? user._id.toString() : '',
          reason: 'Order cancelled by admin'
        });
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the order update if notification fails
    }

    // Return simplified response
    return res.json({
      success: true,
      message: 'Order status updated successfully',
      data: {
        id: order._id,
        orderStatus: (order as any).orderStatus,
        trackingId: (order as any).trackingId
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error updating order status',
      error: error.message || 'Unknown error'
    });
  }
};

export const getOrderAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate as string);
    }

    const totalOrders = await Order.countDocuments(dateFilter);
    const revenueResult = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalRevenue: { $sum: '$finalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const ordersByStatus = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    const ordersByPaymentStatus = await Order.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } }
    ]);

    const recentOrders = await Order.find(dateFilter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('orderNumber userId finalAmount orderStatus createdAt');

    return res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        ordersByStatus,
        ordersByPaymentStatus,
        recentOrders
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching order analytics',
      error: error.message || 'Unknown error'
    });
  }
};

export const exportOrders = async (req: Request, res: Response) => {
  try {
    const { format = 'json', startDate, endDate } = req.query;
    
    const query: any = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const orders = await Order.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csvData = orders.map((order: any) => {
        const user = order.userId;
        return {
          orderNumber: order.orderNumber,
          customerName: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Unknown User',
          customerEmail: user?.email || '',
          customerPhone: user?.phone || '',
          totalAmount: order.totalAmount,
          finalAmount: order.finalAmount,
          orderStatus: order.orderStatus,
          paymentStatus: order.paymentStatus,
          createdAt: order.createdAt
        };
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
      
      if (csvData.length > 0 && csvData[0]) {
        const csvHeaders = Object.keys(csvData[0]).join(',');
        const csvRows = csvData.map(row => Object.values(row).join(','));
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        return res.send(csvContent);
      } else {
        return res.send('No data available');
      }
    }

    return res.json({
      success: true,
      data: orders
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error exporting orders',
      error: error.message || 'Unknown error'
    });
  }
};

export const bulkUpdateOrders = async (req: Request, res: Response) => {
  try {
    const { orderIds, status, trackingId } = req.body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order IDs are required'
      });
    }

    const updateData: any = {};
    if (status) {
      updateData.orderStatus = status;
      
      if (status === 'delivered') {
        updateData.deliveredAt = new Date();
      }
      
      if (status === 'cancelled') {
        updateData.cancelledAt = new Date();
      }
    }
    
    if (trackingId) {
      updateData.trackingId = trackingId;
    }

    const result = await Order.updateMany(
      { _id: { $in: orderIds } },
      { $set: updateData }
    );

    return res.json({
      success: true,
      message: `${result.modifiedCount} orders updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Error updating orders',
      error: error.message || 'Unknown error'
    });
  }
};

export const testDiscountCalculation = async (req: Request, res: Response) => {
  try {
    console.log('Testing discount calculation...');
    
    // Find orders with coupon discounts
    const ordersWithCoupons = await Order.find({
      couponDiscount: { $gt: 0 }
    }).limit(3);
    
    console.log(`Found ${ordersWithCoupons.length} orders with coupon discounts`);
    
    const analysis = ordersWithCoupons.map((order: any) => {
      const itemsDiscountedTotal = order.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const expectedFinalAmount = itemsDiscountedTotal - order.couponDiscount + order.platformFee + order.deliveryCharge;
      
      return {
        orderNumber: order.orderNumber,
        itemsTotal: itemsDiscountedTotal,
        couponDiscount: order.couponDiscount,
        platformFee: order.platformFee,
        deliveryCharge: order.deliveryCharge,
        currentFinalAmount: order.finalAmount,
        expectedFinalAmount: expectedFinalAmount,
        isCorrect: order.finalAmount === expectedFinalAmount
      };
    });
    
    return res.json({
      success: true,
      message: 'Discount calculation analysis completed',
      data: {
        ordersAnalyzed: ordersWithCoupons.length,
        analysis: analysis,
        testScenario: {
          productPrice: 1000,
          discountedPrice: 800,
          couponDiscount: 400, // 50% of 800
          platformFee: 0, // >500 so no fee
          deliveryCharge: 0, // >500 so no charge
          expectedFinalAmount: 400 // 800 - 400 + 0 + 0
        }
      }
    });
  } catch (error: any) {
    console.error('Error testing discount calculation:', error);
    return res.status(500).json({
      success: false,
      message: 'Error testing discount calculation',
      error: error.message || 'Unknown error'
    });
  }
};

export const fixOrderAmounts = async (req: Request, res: Response) => {
  try {
    console.log('Starting order amounts fix...');
    
    // Find all orders
    const orders = await Order.find({});
    console.log(`Found ${orders.length} orders to check`);

    let fixedCount = 0;

    for (const order of orders) {
      try {
        // Calculate the correct original amount from items
        const originalAmount = order.items.reduce((sum, item: any) => {
          return sum + (item.originalPrice * item.quantity);
        }, 0);

        // Calculate the correct discounted amount from items
        const discountedAmount = order.items.reduce((sum, item: any) => {
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

    return res.json({
      success: true,
      message: `Fixed ${fixedCount} orders successfully`,
      data: {
        totalOrders: orders.length,
        fixedOrders: fixedCount
      }
    });
  } catch (error: any) {
    console.error('Error fixing order amounts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fixing order amounts',
      error: error.message || 'Unknown error'
    });
  }
};