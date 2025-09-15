import axios from 'axios';

// Create separate API instance for support operations (main backend)
const supportApi = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.VITE_API_URL || 'https://api.shoppers9.com'
    : 'http://localhost:5002/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor for support API
supportApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

supportApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface SupportTicket {
  id: string;
  ticketId: string;
  userId: string;
  orderNumber?: string;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  messages: SupportMessage[];
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id?: string;
  senderId: string;
  senderType: 'user' | 'agent';
  message: string;
  attachments?: string[];
  timestamp: string;
}

export enum SupportCategory {
  ORDER_ISSUE = 'order_issue',
  PAYMENT_ISSUE = 'payment_issue',
  PRODUCT_ISSUE = 'product_issue',
  DELIVERY_ISSUE = 'delivery_issue',
  RETURN_REFUND = 'return_refund',
  ACCOUNT_ISSUE = 'account_issue',
  GENERAL_INQUIRY = 'general_inquiry'
}

export enum SupportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum SupportStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  WAITING_FOR_CUSTOMER = 'waiting_for_customer',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export interface UpdateTicketRequest {
  status?: SupportStatus;
  priority?: SupportPriority;
  assignedTo?: string;
}

export interface AddAgentMessageRequest {
  message: string;
  attachments?: string[];
}

export interface SupportResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

export interface TicketsResponse {
  tickets: SupportTicket[];
  stats: { _id: string; count: number }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminSupportService {
  /**
   * Get all support tickets (admin)
   */
  async getTickets(params?: {
    page?: number;
    limit?: number;
    status?: SupportStatus;
    category?: SupportCategory;
    priority?: SupportPriority;
    assignedTo?: string;
    search?: string;
  }): Promise<TicketsResponse> {
    try {
      const response = await supportApi.get<SupportResponse<TicketsResponse>>('/support/admin/tickets', { params });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Failed to fetch support tickets');
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch support tickets');
    }
  }

  /**
   * Get specific ticket details (admin)
   */
  async getTicket(ticketId: string): Promise<SupportTicket> {
    try {
      const response = await supportApi.get<SupportResponse<{ ticket: SupportTicket }>>(`/support/admin/tickets/${ticketId}`);
      
      if (response.data.success) {
        return response.data.data.ticket;
      }
      
      throw new Error(response.data.message || 'Failed to fetch support ticket');
    } catch (error: any) {
      console.error('Error fetching support ticket:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch support ticket');
    }
  }

  /**
   * Update ticket (admin)
   */
  async updateTicket(ticketId: string, updateData: UpdateTicketRequest): Promise<SupportTicket> {
    try {
      const response = await supportApi.patch<SupportResponse<{ ticket: SupportTicket }>>(
        `/support/admin/tickets/${ticketId}`, 
        updateData
      );
      
      if (response.data.success) {
        return response.data.data.ticket;
      }
      
      throw new Error(response.data.message || 'Failed to update support ticket');
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update support ticket');
    }
  }

  /**
   * Add agent message to ticket (admin)
   */
  async addAgentMessage(ticketId: string, messageData: AddAgentMessageRequest): Promise<SupportTicket> {
    try {
      const response = await supportApi.post<SupportResponse<{ ticket: SupportTicket }>>(
        `/support/admin/tickets/${ticketId}/messages`, 
        messageData
      );
      
      if (response.data.success) {
        return response.data.data.ticket;
      }
      
      throw new Error(response.data.message || 'Failed to add agent message');
    } catch (error: any) {
      console.error('Error adding agent message:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add agent message');
    }
  }

  /**
   * Get support categories
   */
  async getCategories(): Promise<{ value: SupportCategory; label: string }[]> {
    try {
      const response = await supportApi.get<SupportResponse<{ categories: { value: SupportCategory; label: string }[] }>>('/support/categories/list');
      
      if (response.data.success) {
        return response.data.data.categories;
      }
      
      throw new Error(response.data.message || 'Failed to fetch categories');
    } catch (error: any) {
      console.error('Error fetching support categories:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to fetch categories');
    }
  }

  /**
   * Get priority options
   */
  getPriorityOptions(): { value: SupportPriority; label: string; color: string }[] {
    return [
      { value: SupportPriority.LOW, label: 'Low', color: 'text-green-600 bg-green-100' },
      { value: SupportPriority.MEDIUM, label: 'Medium', color: 'text-yellow-600 bg-yellow-100' },
      { value: SupportPriority.HIGH, label: 'High', color: 'text-orange-600 bg-orange-100' },
      { value: SupportPriority.URGENT, label: 'Urgent', color: 'text-red-600 bg-red-100' }
    ];
  }

  /**
   * Get status options
   */
  getStatusOptions(): { value: SupportStatus; label: string; color: string }[] {
    return [
      { value: SupportStatus.OPEN, label: 'Open', color: 'text-blue-600 bg-blue-100' },
      { value: SupportStatus.IN_PROGRESS, label: 'In Progress', color: 'text-yellow-600 bg-yellow-100' },
      { value: SupportStatus.WAITING_FOR_CUSTOMER, label: 'Waiting for Customer', color: 'text-orange-600 bg-orange-100' },
      { value: SupportStatus.RESOLVED, label: 'Resolved', color: 'text-green-600 bg-green-100' },
      { value: SupportStatus.CLOSED, label: 'Closed', color: 'text-gray-600 bg-gray-100' }
    ];
  }

  /**
   * Format category label
   */
  formatCategoryLabel(category: SupportCategory): string {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format priority label
   */
  formatPriorityLabel(priority: SupportPriority): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  }

  /**
   * Format status label
   */
  formatStatusLabel(status: SupportStatus): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get priority color class
   */
  getPriorityColor(priority: SupportPriority): string {
    const option = this.getPriorityOptions().find(opt => opt.value === priority);
    return option?.color || 'text-gray-600 bg-gray-100';
  }

  /**
   * Get status color class
   */
  getStatusColor(status: SupportStatus): string {
    const option = this.getStatusOptions().find(opt => opt.value === status);
    return option?.color || 'text-gray-600 bg-gray-100';
  }

  /**
   * Get ticket statistics summary
   */
  getTicketStats(stats: { _id: string; count: number }[]): {
    total: number;
    open: number;
    inProgress: number;
    waitingForCustomer: number;
    resolved: number;
    closed: number;
  } {
    const statsMap = stats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: stats.reduce((sum, stat) => sum + stat.count, 0),
      open: statsMap[SupportStatus.OPEN] || 0,
      inProgress: statsMap[SupportStatus.IN_PROGRESS] || 0,
      waitingForCustomer: statsMap[SupportStatus.WAITING_FOR_CUSTOMER] || 0,
      resolved: statsMap[SupportStatus.RESOLVED] || 0,
      closed: statsMap[SupportStatus.CLOSED] || 0
    };
  }
}

export const adminSupportService = new AdminSupportService();
export default adminSupportService;