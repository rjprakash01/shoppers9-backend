import { api } from './api';

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

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: SupportCategory;
  priority?: SupportPriority;
  orderNumber?: string;
}

export interface AddMessageRequest {
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
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CategoryOption {
  value: SupportCategory;
  label: string;
}

class SupportService {
  /**
   * Create a new support ticket
   */
  async createTicket(ticketData: CreateTicketRequest): Promise<SupportTicket> {
    try {
      const response = await api.post<SupportResponse<{ ticket: SupportTicket }>>('/support', ticketData);
      
      if (response.data.success) {
        return response.data.data.ticket;
      }
      
      throw new Error(response.data.message || 'Failed to create support ticket');
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create support ticket');
    }
  }

  /**
   * Get user's support tickets
   */
  async getTickets(params?: {
    page?: number;
    limit?: number;
    status?: SupportStatus;
    category?: SupportCategory;
  }): Promise<TicketsResponse> {
    try {
      const response = await api.get<SupportResponse<TicketsResponse>>('/support', { params });
      
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
   * Get specific ticket details
   */
  async getTicket(ticketId: string): Promise<SupportTicket> {
    try {
      const response = await api.get<SupportResponse<{ ticket: SupportTicket }>>(`/support/${ticketId}`);
      
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
   * Add message to ticket
   */
  async addMessage(ticketId: string, messageData: AddMessageRequest): Promise<SupportTicket> {
    try {
      const response = await api.post<SupportResponse<{ ticket: SupportTicket }>>(
        `/support/${ticketId}/messages`, 
        messageData
      );
      
      if (response.data.success) {
        return response.data.data.ticket;
      }
      
      throw new Error(response.data.message || 'Failed to add message');
    } catch (error: any) {
      console.error('Error adding message:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add message');
    }
  }

  /**
   * Close ticket
   */
  async closeTicket(ticketId: string): Promise<SupportTicket> {
    try {
      const response = await api.patch<SupportResponse<{ ticket: SupportTicket }>>(`/support/${ticketId}/close`);
      
      if (response.data.success) {
        return response.data.data.ticket;
      }
      
      throw new Error(response.data.message || 'Failed to close ticket');
    } catch (error: any) {
      console.error('Error closing ticket:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to close ticket');
    }
  }

  /**
   * Reopen ticket
   */
  async reopenTicket(ticketId: string): Promise<SupportTicket> {
    try {
      const response = await api.patch<SupportResponse<{ ticket: SupportTicket }>>(`/support/${ticketId}/reopen`);
      
      if (response.data.success) {
        return response.data.data.ticket;
      }
      
      throw new Error(response.data.message || 'Failed to reopen ticket');
    } catch (error: any) {
      console.error('Error reopening ticket:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to reopen ticket');
    }
  }

  /**
   * Get support categories
   */
  async getCategories(): Promise<CategoryOption[]> {
    try {
      const response = await api.get<SupportResponse<{ categories: CategoryOption[] }>>('/support/categories/list');
      
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
      { value: SupportPriority.LOW, label: 'Low', color: 'text-green-600' },
      { value: SupportPriority.MEDIUM, label: 'Medium', color: 'text-yellow-600' },
      { value: SupportPriority.HIGH, label: 'High', color: 'text-orange-600' },
      { value: SupportPriority.URGENT, label: 'Urgent', color: 'text-red-600' }
    ];
  }

  /**
   * Get status options
   */
  getStatusOptions(): { value: SupportStatus; label: string; color: string }[] {
    return [
      { value: SupportStatus.OPEN, label: 'Open', color: 'text-blue-600' },
      { value: SupportStatus.IN_PROGRESS, label: 'In Progress', color: 'text-yellow-600' },
      { value: SupportStatus.WAITING_FOR_CUSTOMER, label: 'Waiting for Customer', color: 'text-orange-600' },
      { value: SupportStatus.RESOLVED, label: 'Resolved', color: 'text-green-600' },
      { value: SupportStatus.CLOSED, label: 'Closed', color: 'text-gray-600' }
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
    return option?.color || 'text-gray-600';
  }

  /**
   * Get status color class
   */
  getStatusColor(status: SupportStatus): string {
    const option = this.getStatusOptions().find(opt => opt.value === status);
    return option?.color || 'text-gray-600';
  }
}

export const supportService = new SupportService();
export default supportService;