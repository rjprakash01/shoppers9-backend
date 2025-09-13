import api from './api';

export interface ShippingAddress {
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface OrderItem {
  product: string;
  variantId: string;
  size: string;
  quantity: number;
  price: number;
  originalPrice: number;
  discount: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  orderStatus: string;
  paymentStatus: string;
  totalAmount: number;
  discount: number;
  platformFee: number;
  deliveryFee: number;
  finalAmount: number;
  couponCode?: string;
  couponDiscount?: number;
  trackingId?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  couponCode?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  message: string;
  data: {
    order: Order;
    paymentRequired: boolean;
    paymentUrl?: string;
  };
}

export interface OrdersResponse {
  success: boolean;
  data: {
    orders: Order[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

class OrderService {
  /**
   * Create a new order from cart
   */
  async createOrder(orderData: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      console.log('Creating order with data:', orderData);
      const response = await api.post<CreateOrderResponse>('/orders', orderData);
      console.log('Order creation response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error creating order:', error);
      throw new Error(error.response?.data?.message || 'Failed to create order');
    }
  }

  /**
   * Get user's orders with pagination
   */
  async getOrders(page: number = 1, limit: number = 10): Promise<OrdersResponse> {
    try {
      const response = await api.get<OrdersResponse>(`/orders?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch orders');
    }
  }

  /**
   * Get order by order number
   */
  async getOrder(orderNumber: string): Promise<Order> {
    try {
      const response = await api.get<{ success: boolean; data: { order: Order } }>(`/orders/${orderNumber}`);
      if (response.data.success) {
        return response.data.data.order;
      }
      throw new Error('Order not found');
    } catch (error: any) {
      console.error('Error fetching order:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch order');
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderNumber: string, reason?: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/orders/${orderNumber}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel order');
    }
  }

  /**
   * Request return for an order
   */
  async requestReturn(orderNumber: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.patch(`/orders/${orderNumber}/return`, { reason });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting return:', error);
      throw new Error(error.response?.data?.message || 'Failed to request return');
    }
  }

  /**
   * Track order status
   */
  async trackOrder(orderNumber: string): Promise<Order> {
    try {
      const response = await api.get<{ success: boolean; data: { order: Order } }>(`/orders/${orderNumber}/track`);
      if (response.data.success) {
        return response.data.data.order;
      }
      throw new Error('Order not found');
    } catch (error: any) {
      console.error('Error tracking order:', error);
      throw new Error(error.response?.data?.message || 'Failed to track order');
    }
  }
}

export const orderService = new OrderService();
export default orderService;