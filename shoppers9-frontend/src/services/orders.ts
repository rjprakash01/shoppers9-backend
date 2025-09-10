import api from './api';
import type { Product } from './products';
import type { Address } from './auth';

export interface OrderItem {
  _id: string;
  product: Product;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderId: string;
  orderNumber?: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
}

export interface CreateOrderData {
  shippingAddress: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    landmark: string;
  };
  paymentMethod: string;
  couponCode?: string;
}

export interface OrderFilters {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'totalAmount';
  sortOrder?: 'asc' | 'desc';
}

class OrderService {
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    const response = await api.post('/orders/create', orderData);
    return response.data.data.order;
  }

  async getOrders(filters: OrderFilters = {}): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get(`/orders/my-orders?${params.toString()}`);
    
    // Handle the nested response structure from backend
    if (response.data.success && response.data.data) {
      return {
        orders: response.data.data.orders,
        total: response.data.data.pagination.total,
        page: response.data.data.pagination.page,
        pages: response.data.data.pagination.pages
      };
    }
    
    // Fallback for direct response structure
    return response.data;
  }

  async getOrder(orderId: string): Promise<Order> {
    const response = await api.get(`/orders/${orderId}`);
    
    // Handle the nested response structure from backend
    if (response.data.success && response.data.data) {
      return response.data.data.order;
    }
    
    // Fallback for direct response structure
    return response.data.order;
  }

  async cancelOrder(orderId: string, reason: string): Promise<Order> {
    const response = await api.patch(`/orders/${orderId}/cancel`, { reason });
    
    // Handle the nested response structure from backend
    if (response.data.success && response.data.data) {
      return response.data.data.order;
    }
    
    // Fallback for direct response structure
    return response.data.order;
  }

  async trackOrder(orderId: string): Promise<{
    order: Order;
    trackingInfo: {
      status: string;
      location: string;
      timestamp: string;
      description: string;
    }[];
  }> {
    const response = await api.get(`/orders/${orderId}/track`);
    return response.data;
  }

  async getOrderHistory(page: number = 1, limit: number = 10): Promise<OrdersResponse> {
    return this.getOrders({ page, limit, sortBy: 'createdAt', sortOrder: 'desc' });
  }

  async reorderItems(orderId: string): Promise<{ message: string }> {
    const response = await api.post(`/orders/${orderId}/reorder`);
    return response.data;
  }

  // Payment related methods
  async processPayment(orderId: string, paymentData: {
    paymentMethod: string;
    cardToken?: string;
    billingAddress?: Address;
  }): Promise<{
    success: boolean;
    paymentId: string;
    order: Order;
  }> {
    const response = await api.post(`/orders/${orderId}/payment`, paymentData);
    return response.data;
  }

  async getPaymentMethods(): Promise<{
    methods: {
      id: string;
      name: string;
      type: 'card' | 'wallet' | 'bank';
      isEnabled: boolean;
    }[];
  }> {
    const response = await api.get('/orders/payment-methods');
    return response.data;
  }
}

export const orderService = new OrderService();
export default orderService;