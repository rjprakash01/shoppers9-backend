import express from 'express';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

// Support Categories
interface SupportCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

// Mock support categories data
const supportCategories: SupportCategory[] = [
  {
    id: '1',
    name: 'Order Issues',
    description: 'Problems related to orders, delivery, and fulfillment',
    isActive: true
  },
  {
    id: '2',
    name: 'Product Issues',
    description: 'Quality issues, defects, or product-related concerns',
    isActive: true
  },
  {
    id: '3',
    name: 'Payment Issues',
    description: 'Payment failures, refunds, and billing concerns',
    isActive: true
  },
  {
    id: '4',
    name: 'Account Issues',
    description: 'Login problems, account settings, and profile issues',
    isActive: true
  },
  {
    id: '5',
    name: 'Technical Issues',
    description: 'Website bugs, app crashes, and technical difficulties',
    isActive: true
  },
  {
    id: '6',
    name: 'General Inquiry',
    description: 'General questions and information requests',
    isActive: true
  }
];

// Support Tickets
interface SupportTicket {
  id: string;
  ticketId: string;
  userId: string;
  userEmail: string;
  userName: string;
  categoryId: string;
  categoryName: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  orderNumber?: string;
}

// Mock support tickets data
const supportTickets: SupportTicket[] = [
  {
    id: '1',
    ticketId: 'TKT-001',
    userId: 'user1',
    userEmail: 'customer1@example.com',
    userName: 'John Doe',
    categoryId: '1',
    categoryName: 'Order Issues',
    subject: 'Order not delivered',
    description: 'My order was supposed to be delivered yesterday but I haven\'t received it yet.',
    status: 'open',
    priority: 'high',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    orderNumber: 'ORD-12345'
  },
  {
    id: '2',
    ticketId: 'TKT-002',
    userId: 'user2',
    userEmail: 'customer2@example.com',
    userName: 'Jane Smith',
    categoryId: '2',
    categoryName: 'Product Issues',
    subject: 'Defective product received',
    description: 'The product I received has a manufacturing defect. I would like a replacement.',
    status: 'in_progress',
    priority: 'medium',
    assignedTo: 'admin1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    orderNumber: 'ORD-12346'
  },
  {
    id: '3',
    ticketId: 'TKT-003',
    userId: 'user3',
    userEmail: 'customer3@example.com',
    userName: 'Bob Johnson',
    categoryId: '3',
    categoryName: 'Payment Issues',
    subject: 'Payment failed but amount deducted',
    description: 'My payment failed during checkout but the amount was deducted from my account.',
    status: 'resolved',
    priority: 'urgent',
    assignedTo: 'admin2',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '4',
    ticketId: 'TKT-004',
    userId: 'user4',
    userEmail: 'customer4@example.com',
    userName: 'Alice Brown',
    categoryId: '4',
    categoryName: 'Account Issues',
    subject: 'Cannot login to account',
    description: 'I forgot my password and the reset email is not working.',
    status: 'open',
    priority: 'medium',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '5',
    ticketId: 'TKT-005',
    userId: 'user5',
    userEmail: 'customer5@example.com',
    userName: 'Charlie Wilson',
    categoryId: '5',
    categoryName: 'Technical Issues',
    subject: 'Website not loading properly',
    description: 'The website keeps crashing when I try to add items to cart.',
    status: 'in_progress',
    priority: 'high',
    assignedTo: 'admin1',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

// GET /api/support/categories/list - Get all support categories
router.get('/categories/list', auth, requirePermission('support'), (req, res) => {
  try {
    const activeCategories = supportCategories.filter(cat => cat.isActive);
    
    res.json({
      success: true,
      data: activeCategories,
      message: 'Support categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/support/categories - Get all support categories (alternative endpoint)
router.get('/categories', auth, requirePermission('support'), (req, res) => {
  try {
    res.json({
      success: true,
      data: supportCategories,
      message: 'Support categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/support/categories - Create new support category
router.post('/categories', auth, requirePermission('support'), (req, res) => {
  try {
    const { name, description, isActive = true } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'Name and description are required'
      });
    }
    
    const newCategory: SupportCategory = {
      id: (supportCategories.length + 1).toString(),
      name,
      description,
      isActive
    };
    
    supportCategories.push(newCategory);
    
    res.status(201).json({
      success: true,
      data: newCategory,
      message: 'Support category created successfully'
    });
  } catch (error) {
    console.error('Error creating support category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create support category',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/support/tickets - Get all support tickets
router.get('/tickets', auth, requirePermission('support'), (req, res) => {
  try {
    const { status, priority, category, page = 1, limit = 10 } = req.query;
    
    let filteredTickets = [...supportTickets];
    
    // Apply filters
    if (status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
    }
    
    if (priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === priority);
    }
    
    if (category) {
      filteredTickets = filteredTickets.filter(ticket => ticket.categoryId === category);
    }
    
    // Sort by creation date (newest first)
    filteredTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        tickets: paginatedTickets,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(filteredTickets.length / limitNum),
          totalItems: filteredTickets.length,
          limit: limitNum,
          hasPrev: pageNum > 1,
          hasNext: endIndex < filteredTickets.length
        }
      },
      message: 'Support tickets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/support/tickets/:id - Get specific support ticket
router.get('/tickets/:id', auth, requirePermission('support'), (req, res) => {
  try {
    const { id } = req.params;
    const ticket = supportTickets.find(t => t.id === id || t.ticketId === id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    
    res.json({
      success: true,
      data: ticket,
      message: 'Support ticket retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/support/tickets/:id - Update support ticket
router.put('/tickets/:id', auth, requirePermission('support'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo } = req.body;
    
    const ticketIndex = supportTickets.findIndex(t => t.id === id || t.ticketId === id);
    
    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    
    // Update ticket
    if (status) supportTickets[ticketIndex].status = status;
    if (priority) supportTickets[ticketIndex].priority = priority;
    if (assignedTo !== undefined) supportTickets[ticketIndex].assignedTo = assignedTo;
    
    supportTickets[ticketIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: supportTickets[ticketIndex],
      message: 'Support ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/support/stats - Get support statistics
router.get('/stats', auth, requirePermission('support'), (req, res) => {
  try {
    const totalTickets = supportTickets.length;
    const openTickets = supportTickets.filter(t => t.status === 'open').length;
    const inProgressTickets = supportTickets.filter(t => t.status === 'in_progress').length;
    const resolvedTickets = supportTickets.filter(t => t.status === 'resolved').length;
    const closedTickets = supportTickets.filter(t => t.status === 'closed').length;
    
    const urgentTickets = supportTickets.filter(t => t.priority === 'urgent').length;
    const highPriorityTickets = supportTickets.filter(t => t.priority === 'high').length;
    
    // Calculate average response time (mock data)
    const avgResponseTime = '2.5 hours';
    const avgResolutionTime = '1.2 days';
    
    res.json({
      success: true,
      data: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        closedTickets,
        urgentTickets,
        highPriorityTickets,
        avgResponseTime,
        avgResolutionTime,
        categories: supportCategories.length
      },
      message: 'Support statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Admin routes for support management
// GET /api/admin/support/tickets - Get all support tickets (admin)
router.get('/admin/support/tickets', auth, requirePermission('support'), (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, category, assignedTo, search } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    
    let filteredTickets = [...supportTickets];
    
    // Apply filters
    if (status) {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === status);
    }
    if (priority) {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === priority);
    }
    if (category) {
      filteredTickets = filteredTickets.filter(ticket => ticket.categoryId === category);
    }
    if (assignedTo) {
      filteredTickets = filteredTickets.filter(ticket => ticket.assignedTo === assignedTo);
    }
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchTerm) ||
        ticket.description.toLowerCase().includes(searchTerm) ||
        ticket.userEmail.toLowerCase().includes(searchTerm) ||
        ticket.userName.toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by creation date (newest first)
    filteredTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Pagination
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedTickets = filteredTickets.slice(startIndex, endIndex);
    
    // Generate stats
    const stats = [
      { _id: 'open', count: supportTickets.filter(t => t.status === 'open').length },
      { _id: 'in_progress', count: supportTickets.filter(t => t.status === 'in_progress').length },
      { _id: 'resolved', count: supportTickets.filter(t => t.status === 'resolved').length },
      { _id: 'closed', count: supportTickets.filter(t => t.status === 'closed').length }
    ];
    
    res.json({
      success: true,
      data: {
        tickets: paginatedTickets,
        stats,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredTickets.length,
          pages: Math.ceil(filteredTickets.length / limitNum)
        }
      },
      message: 'Support tickets retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support tickets',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/support/tickets/:id - Get specific support ticket (admin)
router.get('/admin/support/tickets/:id', auth, requirePermission('support'), (req, res) => {
  try {
    const { id } = req.params;
    const ticket = supportTickets.find(t => t.id === id || t.ticketId === id);
    
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    
    res.json({
      success: true,
      data: { ticket },
      message: 'Support ticket retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PATCH /api/admin/support/tickets/:id - Update support ticket (admin)
router.patch('/admin/support/tickets/:id', auth, requirePermission('support'), (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo } = req.body;
    
    const ticketIndex = supportTickets.findIndex(t => t.id === id || t.ticketId === id);
    
    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    
    // Update ticket
    if (status) supportTickets[ticketIndex].status = status;
    if (priority) supportTickets[ticketIndex].priority = priority;
    if (assignedTo !== undefined) supportTickets[ticketIndex].assignedTo = assignedTo;
    
    supportTickets[ticketIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: { ticket: supportTickets[ticketIndex] },
      message: 'Support ticket updated successfully'
    });
  } catch (error) {
    console.error('Error updating support ticket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/admin/support/tickets/:id/messages - Add agent message (admin)
router.post('/admin/support/tickets/:id/messages', auth, requirePermission('support'), (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    const ticketIndex = supportTickets.findIndex(t => t.id === id || t.ticketId === id);
    
    if (ticketIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }
    
    // For mock data, we'll just update the ticket status to show agent responded
    if (supportTickets[ticketIndex].status === 'open') {
      supportTickets[ticketIndex].status = 'in_progress';
    }
    supportTickets[ticketIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: { ticket: supportTickets[ticketIndex] },
      message: 'Agent message added successfully'
    });
  } catch (error) {
    console.error('Error adding agent message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add agent message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/admin/support/categories - Get support categories (admin)
router.get('/admin/support/categories', auth, requirePermission('support'), (req, res) => {
  try {
    res.json({
      success: true,
      data: { categories: supportCategories },
      message: 'Support categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching support categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch support categories',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;