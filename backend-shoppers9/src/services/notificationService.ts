import axios from 'axios';

const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5001';

export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_CANCELLED = 'order_cancelled',
  RETURN_REQUESTED = 'return_requested',
  ORDER_DELIVERED = 'order_delivered',
  RETURN_PICKED = 'return_picked',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  PRODUCT_APPROVED = 'product_approved',
  PRODUCT_REJECTED = 'product_rejected',
  PRODUCT_CHANGES_REQUESTED = 'product_changes_requested',
  PRODUCT_SUBMITTED = 'product_submitted'
}

interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    orderId?: string;
    productId?: string;
    productName?: string;
    stock?: number;
    customerId?: string;
    customerName?: string;
    [key: string]: any;
  };
}

class NotificationService {
  private adminApiUrl = `${ADMIN_API_URL}/public/notifications`;

  // Create notification in admin backend
  private async createNotification(notification: CreateNotificationRequest): Promise<void> {
    try {
      // Try to create notification via API
      await axios.post(this.adminApiUrl, notification, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log('✅ Notification created successfully via API:', notification.title);
    } catch (error) {
      console.error('❌ Failed to create notification via API:', error instanceof Error ? error.message : error);
      
      // Fallback: Log notification details for debugging
      console.log('📝 NOTIFICATION DETAILS (for debugging):');
      console.log('   Type:', notification.type);
      console.log('   Title:', notification.title);
      console.log('   Message:', notification.message);
      console.log('   Data:', JSON.stringify(notification.data, null, 2));
      console.log('   Timestamp:', new Date().toISOString());
      console.log('---');
      
      // Don't throw error to avoid breaking the main flow
    }
  }
  
  // Create seller-specific notification
  private async createSellerSpecificNotification(notification: CreateNotificationRequest, sellerId: string): Promise<void> {
    try {
      // Send to seller-specific endpoint
      const sellerNotificationUrl = `${ADMIN_API_URL}/public/notifications/seller/${sellerId}`;
      await axios.post(sellerNotificationUrl, notification, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      console.log(`✅ Seller-specific notification created for ${sellerId}:`, notification.title);
    } catch (error) {
      console.error(`❌ Failed to create seller-specific notification for ${sellerId}:`, error instanceof Error ? error.message : error);
      
      // Fallback: Log notification details for debugging
      console.log('📝 SELLER NOTIFICATION DETAILS (for debugging):');
      console.log('   Seller ID:', sellerId);
      console.log('   Type:', notification.type);
      console.log('   Title:', notification.title);
      console.log('   Message:', notification.message);
      console.log('   Data:', JSON.stringify(notification.data, null, 2));
      console.log('   Timestamp:', new Date().toISOString());
      console.log('---');
      
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Create notification for new order
  async createNewOrderNotification(orderData: {
    orderId: string;
    customerName: string;
    customerId: string;
    totalAmount: number;
    itemCount: number;
    sellerId?: string;
  }): Promise<void> {
    const notificationData = {
      type: NotificationType.NEW_ORDER,
      title: 'New Order Received',
      message: `New order #${orderData.orderId} from ${orderData.customerName} for ₹${orderData.totalAmount} (${orderData.itemCount} items)`,
      data: {
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        totalAmount: orderData.totalAmount,
        itemCount: orderData.itemCount,
        sellerId: orderData.sellerId
      }
    };
    
    // If sellerId is provided, send to specific admin endpoint
    if (orderData.sellerId) {
      await this.createSellerSpecificNotification(notificationData, orderData.sellerId);
    } else {
      // Send to general admin endpoint (super admin)
      await this.createNotification(notificationData);
    }
  }

  // Create notification for order cancellation
  async createOrderCancelledNotification(orderData: {
    orderId: string;
    customerName: string;
    customerId: string;
    reason?: string;
  }): Promise<void> {
    await this.createNotification({
      type: NotificationType.ORDER_CANCELLED,
      title: 'Order Cancelled',
      message: `Order #${orderData.orderId} has been cancelled by ${orderData.customerName}${orderData.reason ? ` (Reason: ${orderData.reason})` : ''}`,
      data: {
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        reason: orderData.reason
      }
    });
  }

  // Create notification for return request
  async createReturnRequestNotification(returnData: {
    orderId: string;
    customerName: string;
    customerId: string;
    productName?: string;
    reason?: string;
  }): Promise<void> {
    await this.createNotification({
      type: NotificationType.RETURN_REQUESTED,
      title: 'Return Request Received',
      message: `Return request for ${returnData.productName || 'order'} from order #${returnData.orderId} by ${returnData.customerName}${returnData.reason ? ` (Reason: ${returnData.reason})` : ''}`,
      data: {
        orderId: returnData.orderId,
        customerId: returnData.customerId,
        customerName: returnData.customerName,
        productName: returnData.productName,
        reason: returnData.reason
      }
    });
  }

  // Create notification for order delivery
  async createOrderDeliveredNotification(orderData: {
    orderId: string;
    customerName: string;
    customerId: string;
    deliveryAddress: string;
  }): Promise<void> {
    await this.createNotification({
      type: NotificationType.ORDER_DELIVERED,
      title: 'Order Delivered',
      message: `Order #${orderData.orderId} has been successfully delivered to ${orderData.customerName} at ${orderData.deliveryAddress}`,
      data: {
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        deliveryAddress: orderData.deliveryAddress
      }
    });
  }

  // Create notification for return pickup
  async createReturnPickedNotification(returnData: {
    orderId: string;
    customerName: string;
    customerId: string;
    productName?: string;
    pickupAddress: string;
  }): Promise<void> {
    await this.createNotification({
      type: NotificationType.RETURN_PICKED,
      title: 'Return Item Picked Up',
      message: `Return item ${returnData.productName || 'from order'} #${returnData.orderId} has been picked up from ${returnData.customerName} at ${returnData.pickupAddress}`,
      data: {
        orderId: returnData.orderId,
        customerId: returnData.customerId,
        customerName: returnData.customerName,
        productName: returnData.productName,
        pickupAddress: returnData.pickupAddress
      }
    });
  }

  // Create notification for product submission
  async createProductSubmittedNotification(productData: {
    productId: string;
    productName: string;
    sellerName: string;
    sellerId: string;
  }): Promise<void> {
    await this.createNotification({
      type: NotificationType.PRODUCT_SUBMITTED,
      title: 'New Product Submitted for Review',
      message: `${productData.sellerName} has submitted "${productData.productName}" for review`,
      data: {
        productId: productData.productId,
        productName: productData.productName,
        sellerId: productData.sellerId,
        sellerName: productData.sellerName
      }
    });
  }

  // Create notification for product approval
  async createProductApprovedNotification(productData: {
    productId: string;
    productName: string;
    sellerName: string;
    sellerId: string;
    comments?: string;
  }): Promise<void> {
    const notificationData = {
      type: NotificationType.PRODUCT_APPROVED,
      title: 'Product Approved',
      message: `Your product "${productData.productName}" has been approved and is now live${productData.comments ? `. Admin notes: ${productData.comments}` : ''}`,
      data: {
        productId: productData.productId,
        productName: productData.productName,
        sellerId: productData.sellerId,
        sellerName: productData.sellerName,
        comments: productData.comments
      }
    };

    // Send to seller-specific endpoint
    await this.createSellerSpecificNotification(notificationData, productData.sellerId);
  }

  // Create notification for product rejection
  async createProductRejectedNotification(productData: {
    productId: string;
    productName: string;
    sellerName: string;
    sellerId: string;
    reason: string;
    comments?: string;
  }): Promise<void> {
    const notificationData = {
      type: NotificationType.PRODUCT_REJECTED,
      title: 'Product Rejected',
      message: `Your product "${productData.productName}" has been rejected. Reason: ${productData.reason}${productData.comments ? `. Additional notes: ${productData.comments}` : ''}`,
      data: {
        productId: productData.productId,
        productName: productData.productName,
        sellerId: productData.sellerId,
        sellerName: productData.sellerName,
        reason: productData.reason,
        comments: productData.comments
      }
    };

    // Send to seller-specific endpoint
    await this.createSellerSpecificNotification(notificationData, productData.sellerId);
  }

  // Create notification for product changes requested
  async createProductChangesRequestedNotification(productData: {
    productId: string;
    productName: string;
    sellerName: string;
    sellerId: string;
    reason: string;
    comments?: string;
  }): Promise<void> {
    const notificationData = {
      type: NotificationType.PRODUCT_CHANGES_REQUESTED,
      title: 'Product Changes Requested',
      message: `Changes have been requested for your product "${productData.productName}". Reason: ${productData.reason}${productData.comments ? `. Additional notes: ${productData.comments}` : ''}`,
      data: {
        productId: productData.productId,
        productName: productData.productName,
        sellerId: productData.sellerId,
        sellerName: productData.sellerName,
        reason: productData.reason,
        comments: productData.comments
      }
    };

    // Send to seller-specific endpoint
    await this.createSellerSpecificNotification(notificationData, productData.sellerId);
  }
}

export const notificationService = new NotificationService();
export default notificationService;