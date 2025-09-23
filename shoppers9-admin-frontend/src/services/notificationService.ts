import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export enum NotificationType {
  NEW_ORDER = 'new_order',
  ORDER_CANCELLED = 'order_cancelled',
  RETURN_REQUESTED = 'return_requested',
  ORDER_DELIVERED = 'order_delivered',
  RETURN_PICKED = 'return_picked',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock'
}

export interface Notification {
  _id: string;
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
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

class NotificationService {
  private baseURL = `${API_BASE_URL}/admin/notifications`;

  private getAuthHeaders() {
    const token = localStorage.getItem('adminToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  // Get all notifications
  async getNotifications(page = 1, limit = 50): Promise<Notification[]> {
    try {
      const response = await axios.get(`${this.baseURL}?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data.notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get(`${this.baseURL}/unread-count`, {
        headers: this.getAuthHeaders()
      });
      return response.data.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await axios.patch(`${this.baseURL}/${notificationId}/read`, {}, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await axios.patch(`${this.baseURL}/mark-all-read`, {}, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/${notificationId}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Create notification (for testing purposes)
  async createNotification(notification: {
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  }): Promise<Notification> {
    try {
      const response = await axios.post(this.baseURL, notification, {
        headers: this.getAuthHeaders()
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;