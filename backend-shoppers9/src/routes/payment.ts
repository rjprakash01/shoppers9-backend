import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService';
import { Order } from '../models/Order';
import { AuthenticatedRequest } from '../types';
import { authenticateToken, requireVerification } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { AppError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const createPaymentIntentSchema = Joi.object({
  orderNumber: Joi.string().required().trim()
});

const verifyPaymentSchema = Joi.object({
  orderNumber: Joi.string().required().trim(),
  paymentId: Joi.string().required().trim(),
  signature: Joi.string().optional().trim()
});

const refundPaymentSchema = Joi.object({
  orderNumber: Joi.string().required().trim(),
  amount: Joi.number().optional().positive(),
  reason: Joi.string().required().trim().min(10).max(500)
});

// Create payment intent
router.post('/create-intent', 
  authenticateToken, 
  requireVerification, 
  validateRequest(createPaymentIntentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { orderNumber } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      // Verify order belongs to user
      const order = await Order.findOne({ orderNumber, userId });
      if (!order) {
        return next(new AppError('Order not found', 404));
      }

      if (order.paymentStatus === 'success') {
        return next(new AppError('Payment already completed for this order', 400));
      }

      const paymentIntent = await paymentService.createPaymentIntent(orderNumber);

      res.json({
        success: true,
        message: 'Payment intent created successfully',
        data: {
          paymentIntent,
          orderNumber,
          amount: order.finalAmount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Verify payment
router.post('/verify', 
  authenticateToken, 
  requireVerification, 
  validateRequest(verifyPaymentSchema),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { orderNumber, paymentId, signature } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      // Verify order belongs to user
      const order = await Order.findOne({ orderNumber, userId });
      if (!order) {
        return next(new AppError('Order not found', 404));
      }

      const success = await paymentService.processPayment(orderNumber, paymentId, signature);

      if (success) {
        res.json({
          success: true,
          message: 'Payment verified and processed successfully',
          data: {
            orderNumber,
            paymentId,
            status: 'COMPLETED'
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment verification failed',
          data: {
            orderNumber,
            paymentId,
            status: 'FAILED'
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

// Get payment methods
router.get('/methods', 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const methods = await paymentService.getPaymentMethods();
      
      res.json({
        success: true,
        data: {
          paymentMethods: methods
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Calculate delivery charges
router.post('/calculate-charges', 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, pincode } = req.body;
      
      if (!amount || amount <= 0) {
        return next(new AppError('Valid amount is required', 400));
      }

      const platformFee = await paymentService.calculatePlatformFee(amount);
      const deliveryCharge = await paymentService.calculateDeliveryCharge(amount, pincode);
      
      res.json({
        success: true,
        data: {
          subtotal: amount,
          platformFee,
          deliveryCharge,
          total: amount + platformFee + deliveryCharge
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Refund payment (admin only)
router.post('/refund', 
  authenticateToken, 
  validateRequest(refundPaymentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orderNumber, amount, reason } = req.body;
      
      // TODO: Add admin authentication middleware
      // For now, any authenticated user can initiate refund (not recommended for production)
      
      const refund = await paymentService.refundPayment(orderNumber, amount);
      
      // Update order with refund reason
      await Order.findOneAndUpdate(
        { orderNumber },
        { 
          refundReason: reason,
          refundInitiatedAt: new Date()
        }
      );

      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refund,
          orderNumber,
          amount: amount || 'full'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Payment webhook (for payment gateway callbacks)
router.post('/webhook', 
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // TODO: Implement webhook handling for different payment providers
      // This would handle callbacks from Razorpay, Stripe, etc.

      // For now, just acknowledge the webhook
      res.status(200).json({ received: true });
    } catch (error) {
      
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }
);

// Get payment status
router.get('/status/:orderNumber', 
  authenticateToken, 
  requireVerification,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { orderNumber } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return next(new AppError('User not authenticated', 401));
      }

      const order = await Order.findOne({ orderNumber, userId });
      if (!order) {
        return next(new AppError('Order not found', 404));
      }

      res.json({
        success: true,
        data: {
          orderNumber,
          paymentStatus: order.paymentStatus,
          paymentId: order.paymentId,
          amount: order.finalAmount,
          refundStatus: order.refundStatus,
          refundAmount: order.refundAmount
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;