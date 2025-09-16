import { createNotificationForEvent } from '../controllers/notificationController';
import { NotificationType } from '../models/Notification';

// Service to create notifications for various events
export class NotificationService {
  // Create notification for new order
  static async createNewOrderNotification(orderData: {
    orderId: string;
    customerName: string;
    customerId: string;
    totalAmount: number;
    itemCount: number;
  }) {
    await createNotificationForEvent(
      NotificationType.NEW_ORDER,
      'New Order Received',
      `New order #${orderData.orderId} from ${orderData.customerName} for ₹${orderData.totalAmount} (${orderData.itemCount} items)`,
      {
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        totalAmount: orderData.totalAmount,
        itemCount: orderData.itemCount
      }
    );
  }

  // Create notification for order cancellation
  static async createOrderCancelledNotification(orderData: {
    orderId: string;
    customerName: string;
    customerId: string;
    reason?: string;
  }) {
    await createNotificationForEvent(
      NotificationType.ORDER_CANCELLED,
      'Order Cancelled',
      `Order #${orderData.orderId} has been cancelled by ${orderData.customerName}${orderData.reason ? ` (Reason: ${orderData.reason})` : ''}`,
      {
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        reason: orderData.reason
      }
    );
  }

  // Create notification for return request
  static async createReturnRequestNotification(returnData: {
    orderId: string;
    customerName: string;
    customerId: string;
    productName: string;
    reason?: string;
  }) {
    await createNotificationForEvent(
      NotificationType.RETURN_REQUESTED,
      'Return Request Received',
      `Return request for ${returnData.productName} from order #${returnData.orderId} by ${returnData.customerName}${returnData.reason ? ` (Reason: ${returnData.reason})` : ''}`,
      {
        orderId: returnData.orderId,
        customerId: returnData.customerId,
        customerName: returnData.customerName,
        productName: returnData.productName,
        reason: returnData.reason
      }
    );
  }

  // Create notification for order delivery
  static async createOrderDeliveredNotification(orderData: {
    orderId: string;
    customerName: string;
    customerId: string;
    deliveryAddress: string;
  }) {
    await createNotificationForEvent(
      NotificationType.ORDER_DELIVERED,
      'Order Delivered',
      `Order #${orderData.orderId} has been successfully delivered to ${orderData.customerName} at ${orderData.deliveryAddress}`,
      {
        orderId: orderData.orderId,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        deliveryAddress: orderData.deliveryAddress
      }
    );
  }

  // Create notification for return pickup
  static async createReturnPickedNotification(returnData: {
    orderId: string;
    customerName: string;
    customerId: string;
    productName: string;
    pickupAddress: string;
  }) {
    await createNotificationForEvent(
      NotificationType.RETURN_PICKED,
      'Return Item Picked Up',
      `Return item ${returnData.productName} from order #${returnData.orderId} has been picked up from ${returnData.customerName} at ${returnData.pickupAddress}`,
      {
        orderId: returnData.orderId,
        customerId: returnData.customerId,
        customerName: returnData.customerName,
        productName: returnData.productName,
        pickupAddress: returnData.pickupAddress
      }
    );
  }

  // Create notification for low stock
  static async createLowStockNotification(productData: {
    productId: string;
    productName: string;
    variantId?: string;
    color?: string;
    size?: string;
    stock: number;
  }) {
    const variantInfo = productData.color && productData.size 
      ? ` (${productData.color} - ${productData.size})` 
      : '';
    
    await createNotificationForEvent(
      NotificationType.LOW_STOCK,
      'Low Stock Alert',
      `${productData.productName}${variantInfo} has only ${productData.stock} items left in stock`,
      {
        productId: productData.productId,
        productName: productData.productName,
        variantId: productData.variantId,
        color: productData.color,
        size: productData.size,
        stock: productData.stock
      }
    );
  }

  // Create notification for out of stock
  static async createOutOfStockNotification(productData: {
    productId: string;
    productName: string;
    variantId?: string;
    color?: string;
    size?: string;
  }) {
    const variantInfo = productData.color && productData.size 
      ? ` (${productData.color} - ${productData.size})` 
      : '';
    
    await createNotificationForEvent(
      NotificationType.OUT_OF_STOCK,
      'Out of Stock Alert',
      `${productData.productName}${variantInfo} is now out of stock`,
      {
        productId: productData.productId,
        productName: productData.productName,
        variantId: productData.variantId,
        color: productData.color,
        size: productData.size,
        stock: 0
      }
    );
  }
}

export default NotificationService;