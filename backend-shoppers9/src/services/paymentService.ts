import { Order } from '../models/Order';
import { PaymentStatus, RefundStatus } from '../types';

interface PaymentProvider {
  createPayment(amount: number, currency: string, orderNumber: string): Promise<any>;
  verifyPayment(paymentId: string, signature?: string): Promise<boolean>;
  refundPayment(paymentId: string, amount: number): Promise<any>;
}

// Mock Payment Provider for development
class MockPaymentProvider implements PaymentProvider {
  async createPayment(amount: number, currency: string, orderNumber: string): Promise<any> {
    // Simulate payment creation
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: paymentId,
      amount: amount * 100, // Convert to paise
      currency,
      status: 'created',
      order_id: orderNumber,
      method: 'card',
      description: `Payment for order ${orderNumber}`,
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  async verifyPayment(paymentId: string, signature?: string): Promise<boolean> {
    // Mock verification - always return true for development
    // In production, this would verify the payment signature
    
    return true;
  }

  async refundPayment(paymentId: string, amount: number): Promise<any> {
    // Mock refund
    const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: refundId,
      payment_id: paymentId,
      amount: amount * 100,
      status: 'processed',
      created_at: Math.floor(Date.now() / 1000)
    };
  }
}

// Razorpay Provider (placeholder for future implementation)
class RazorpayProvider implements PaymentProvider {
  private keyId: string;
  private keySecret: string;

  constructor(keyId: string, keySecret: string) {
    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  async createPayment(amount: number, currency: string, orderNumber: string): Promise<any> {
    // TODO: Implement Razorpay payment creation
    throw new Error('Razorpay integration not implemented yet');
  }

  async verifyPayment(paymentId: string, signature?: string): Promise<boolean> {
    // TODO: Implement Razorpay payment verification
    throw new Error('Razorpay integration not implemented yet');
  }

  async refundPayment(paymentId: string, amount: number): Promise<any> {
    // TODO: Implement Razorpay refund
    throw new Error('Razorpay integration not implemented yet');
  }
}

// Stripe Provider (placeholder for future implementation)
class StripeProvider implements PaymentProvider {
  private secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async createPayment(amount: number, currency: string, orderNumber: string): Promise<any> {
    // TODO: Implement Stripe payment creation
    throw new Error('Stripe integration not implemented yet');
  }

  async verifyPayment(paymentId: string, signature?: string): Promise<boolean> {
    // TODO: Implement Stripe payment verification
    throw new Error('Stripe integration not implemented yet');
  }

  async refundPayment(paymentId: string, amount: number): Promise<any> {
    // TODO: Implement Stripe refund
    throw new Error('Stripe integration not implemented yet');
  }
}

export class PaymentService {
  private provider: PaymentProvider;

  constructor() {
    // Initialize payment provider based on environment
    const paymentProvider = process.env.PAYMENT_PROVIDER || 'mock';
    
    switch (paymentProvider.toLowerCase()) {
      case 'razorpay':
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
          
          this.provider = new MockPaymentProvider();
        } else {
          this.provider = new RazorpayProvider(
            process.env.RAZORPAY_KEY_ID,
            process.env.RAZORPAY_KEY_SECRET
          );
        }
        break;
      case 'stripe':
        if (!process.env.STRIPE_SECRET_KEY) {
          
          this.provider = new MockPaymentProvider();
        } else {
          this.provider = new StripeProvider(process.env.STRIPE_SECRET_KEY);
        }
        break;
      default:
        
        this.provider = new MockPaymentProvider();
    }
  }

  async createPaymentIntent(orderNumber: string): Promise<any> {
    try {
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        throw new Error('Order not found');
      }

      const paymentIntent = await this.provider.createPayment(
        order.finalAmount,
        'INR',
        orderNumber
      );

      // Update order with payment intent ID
      order.paymentIntentId = paymentIntent.id;
      await order.save();

      return paymentIntent;
    } catch (error) {
      
      throw error;
    }
  }

  async verifyPayment(paymentId: string, signature?: string): Promise<boolean> {
    try {
      return await this.provider.verifyPayment(paymentId, signature);
    } catch (error) {
      
      return false;
    }
  }

  async processPayment(orderNumber: string, paymentId: string, signature?: string): Promise<boolean> {
    try {
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        throw new Error('Order not found');
      }

      // Verify payment
      const isValid = await this.verifyPayment(paymentId, signature);
      if (!isValid) {
        order.paymentStatus = PaymentStatus.FAILED;
        await order.save();
        return false;
      }

      // Update order with successful payment
      order.paymentStatus = PaymentStatus.COMPLETED;
      order.paymentId = paymentId;
      order.paidAt = new Date();
      await order.save();

      return true;
    } catch (error) {
      
      return false;
    }
  }

  async refundPayment(orderNumber: string, amount?: number): Promise<any> {
    try {
      const order = await Order.findOne({ orderNumber });
      if (!order) {
        throw new Error('Order not found');
      }

      if (!order.paymentId) {
        throw new Error('No payment found for this order');
      }

      const refundAmount = amount || order.finalAmount;
      const refund = await this.provider.refundPayment(order.paymentId, refundAmount);

      // Update order with refund information
      order.refundStatus = RefundStatus.PROCESSED;
      order.refundAmount = refundAmount;
      order.refundId = refund.id;
      order.refundedAt = new Date();
      await order.save();

      return refund;
    } catch (error) {
      
      throw error;
    }
  }

  async getPaymentMethods(): Promise<string[]> {
    // Return available payment methods
    return ['COD', 'ONLINE', 'UPI', 'CARD'];
  }

  async calculatePlatformFee(amount: number): Promise<number> {
    // Use settings service for dynamic platform fee calculation
    const { settingsService } = await import('./settingsService');
    return await settingsService.calculatePlatformFee(amount);
  }

  async calculateDeliveryCharge(amount: number, pincode?: string): Promise<number> {
    // Use settings service for dynamic delivery charge calculation
    const { settingsService } = await import('./settingsService');
    return await settingsService.calculateDeliveryFee(amount);
  }
}

// Export singleton instance
export const paymentService = new PaymentService();