import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { Support } from '../models/Support';
import { AuthenticatedRequest, SupportCategory, SupportPriority, SupportStatus } from '../types';
import { authenticateToken, requireVerification, authenticateUserOrAdmin } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import Joi from 'joi';
import { User } from '../models/User';
import { Order } from '../models/Order';

const router = express.Router();

// Validation schemas
const createTicketSchema = Joi.object({
  subject: Joi.string().required().trim().min(5).max(200),
  description: Joi.string().required().trim().min(10).max(2000),
  category: Joi.string().valid(...Object.values(SupportCategory)).required(),
  priority: Joi.string().valid(...Object.values(SupportPriority)).optional(),
  orderNumber: Joi.string().optional().trim()
});

const addMessageSchema = Joi.object({
  message: Joi.string().required().trim().min(1).max(2000),
  attachments: Joi.array().items(Joi.string()).optional()
});

const updateTicketSchema = Joi.object({
  status: Joi.string().valid(...Object.values(SupportStatus)).optional(),
  priority: Joi.string().valid(...Object.values(SupportPriority)).optional(),
  assignedTo: Joi.string().optional()
});

// Create a new support ticket
router.post('/', 
  authenticateToken, 
  requireVerification, 
  validateRequest(createTicketSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { subject, description, category, priority, orderNumber } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      // Verify order belongs to user if orderNumber is provided
      if (orderNumber) {
        const order = await Order.findOne({ orderNumber, userId });
        if (!order) {
          return next(new AppError('Order not found or does not belong to you', 404));
        }
      }

      const ticket = new Support({
        userId,
        subject,
        description,
        category,
        priority: priority || SupportPriority.MEDIUM,
        orderNumber
      });

      await ticket.save();

      // Populate user details
      await ticket.populate('userId', 'name email phone');

      res.status(201).json({
        success: true,
        message: 'Support ticket created successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get user's support tickets
router.get('/', 
  authenticateToken, 
  requireVerification,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const category = req.query.category as string;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const query: any = { userId };
      
      if (status) {
        query.status = status;
      }
      
      if (category) {
        query.category = category;
      }

      const skip = (page - 1) * limit;

      const tickets = await Support.find(query)
        .populate('userId', 'name email phone')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Support.countDocuments(query);

      res.json({
        success: true,
        message: 'Support tickets retrieved successfully',
        data: {
          tickets,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific ticket details
router.get('/:ticketId', 
  authenticateToken, 
  requireVerification,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const ticket = await Support.findOne({ ticketId, userId })
        .populate('userId', 'name email phone')
        .populate('assignedTo', 'name email');

      if (!ticket) {
        return next(new AppError('Support ticket not found', 404));
      }

      res.json({
        success: true,
        message: 'Support ticket retrieved successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add message to ticket
router.post('/:ticketId/messages', 
  authenticateToken, 
  requireVerification, 
  validateRequest(addMessageSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ticketId } = req.params;
      const { message, attachments } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const ticket = await Support.findOne({ ticketId, userId });

      if (!ticket) {
        return next(new AppError('Support ticket not found', 404));
      }

      if (ticket.status === SupportStatus.CLOSED) {
        return next(new AppError('Cannot add message to closed ticket', 400));
      }

      await ticket.addMessage(userId, 'user', message, attachments);

      // Populate the ticket with updated messages
      await ticket.populate('userId', 'name email phone');
      await ticket.populate('assignedTo', 'name email');

      res.json({
        success: true,
        message: 'Message added successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Close ticket (user can close their own ticket)
router.patch('/:ticketId/close', 
  authenticateToken, 
  requireVerification,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const ticket = await Support.findOne({ ticketId, userId });

      if (!ticket) {
        return next(new AppError('Support ticket not found', 404));
      }

      if (ticket.status === SupportStatus.CLOSED) {
        return next(new AppError('Ticket is already closed', 400));
      }

      await ticket.closeTicket();

      res.json({
        success: true,
        message: 'Support ticket closed successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Reopen ticket
router.patch('/:ticketId/reopen', 
  authenticateToken, 
  requireVerification,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ticketId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const ticket = await Support.findOne({ ticketId, userId });

      if (!ticket) {
        return next(new AppError('Support ticket not found', 404));
      }

      if (ticket.status !== SupportStatus.CLOSED) {
        return next(new AppError('Only closed tickets can be reopened', 400));
      }

      await ticket.reopenTicket();

      res.json({
        success: true,
        message: 'Support ticket reopened successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get support categories (public endpoint)
router.get('/categories/list', 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = Object.values(SupportCategory).map(category => ({
        value: category,
        label: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }));

      res.json({
        success: true,
        message: 'Support categories retrieved successfully',
        data: {
          categories
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin routes (for admin panel)
// Get all tickets (admin only)
router.get('/admin/tickets', 
  authenticateUserOrAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // TODO: Add admin role check middleware
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const category = req.query.category as string;
      const priority = req.query.priority as string;
      const assignedTo = req.query.assignedTo as string;
      const search = req.query.search as string;

      const query: any = {};
      
      if (status) query.status = status;
      if (category) query.category = category;
      if (priority) query.priority = priority;
      if (assignedTo) query.assignedTo = assignedTo;
      
      if (search) {
        query.$or = [
          { ticketId: { $regex: search, $options: 'i' } },
          { subject: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;

      const tickets = await Support.find(query)
        .populate('userId', 'name email phone')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Support.countDocuments(query);

      // Get statistics
      const stats = await Support.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        message: 'Support tickets retrieved successfully',
        data: {
          tickets,
          stats,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update ticket (admin only)
router.patch('/admin/tickets/:ticketId', 
  authenticateUserOrAdmin,
  validateRequest(updateTicketSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // TODO: Add admin role check middleware
      const { ticketId } = req.params;
      const { status, priority, assignedTo } = req.body;

      const ticket = await Support.findOne({ ticketId });

      if (!ticket) {
        return next(new AppError('Support ticket not found', 404));
      }

      if (status) {
        await ticket.updateStatus(status);
      }

      if (priority) {
        await ticket.updatePriority(priority);
      }

      if (assignedTo) {
        await ticket.assignTo(assignedTo);
      }

      // Populate the updated ticket
      await ticket.populate('userId', 'name email phone');
      await ticket.populate('assignedTo', 'name email');

      res.json({
        success: true,
        message: 'Support ticket updated successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get specific ticket details (admin)
router.get('/admin/tickets/:ticketId', 
  authenticateUserOrAdmin,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ticketId } = req.params;

      const ticket = await Support.findOne({ ticketId })
        .populate('userId', 'name email phone')
        .populate('assignedTo', 'name email');

      if (!ticket) {
        return next(new AppError('Support ticket not found', 404));
      }

      res.json({
        success: true,
        message: 'Support ticket retrieved successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Add agent message to ticket (admin only)
router.post('/admin/tickets/:ticketId/messages', 
  authenticateUserOrAdmin,
  validateRequest(addMessageSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // TODO: Add admin role check middleware
      const { ticketId } = req.params;
      const { message, attachments } = req.body;
      const agentId = req.user?.id;

      if (!agentId) {
        return next(new AppError('Agent not authenticated', 401));
      }

      const ticket = await Support.findOne({ ticketId });

      if (!ticket) {
        return next(new AppError('Support ticket not found', 404));
      }

      await ticket.addMessage(agentId, 'agent', message, attachments);

      // Populate the ticket with updated messages
      await ticket.populate('userId', 'name email phone');
      await ticket.populate('assignedTo', 'name email');

      res.json({
        success: true,
        message: 'Agent message added successfully',
        data: {
          ticket
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;