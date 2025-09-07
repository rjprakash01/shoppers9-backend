import { Twilio } from 'twilio';
import { AppError } from '../middleware/errorHandler';

class SMSService {
  private client: Twilio | null = null;
  private fromNumber: string;

  constructor() {
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      console.warn('Twilio credentials not configured. SMS service will be disabled.');
      return;
    }

    try {
      this.client = new Twilio(accountSid, authToken);
    } catch (error) {
      console.error('Failed to initialize Twilio client:', error);
    }
  }

  async sendOTP(phone: string, otp: string): Promise<boolean> {
    try {
      // For test phone number, always use hardcoded OTP
      if (phone === '1234567890') {
        console.log(`📱 Test OTP for ${phone}: 1234 (hardcoded for testing)`);
        return true;
      }

      // In development, just log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 OTP for ${phone}: ${otp}`);
        return true;
      }

      if (!this.client) {
        throw new AppError('SMS service not configured', 500);
      }

      const message = `Your Shoppers9 verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `+91${phone}`
      });

      console.log(`SMS sent successfully. SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send SMS:', error);
      
      // In development, don't fail if SMS service is not configured
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV] OTP for ${phone}: ${otp}`);
        return true;
      }
      
      throw new AppError('Failed to send OTP', 500);
    }
  }

  async sendOrderConfirmation(phone: string, orderNumber: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Order confirmation for ${phone}: Order ${orderNumber} confirmed`);
        return true;
      }

      if (!this.client) {
        console.warn('SMS service not configured for order confirmation');
        return false;
      }

      const message = `Your Shoppers9 order ${orderNumber} has been confirmed! Track your order in the app. Thank you for shopping with us.`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `+91${phone}`
      });

      console.log(`Order confirmation SMS sent. SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send order confirmation SMS:', error);
      return false;
    }
  }

  async sendOrderUpdate(phone: string, orderNumber: string, status: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Order update for ${phone}: Order ${orderNumber} is ${status}`);
        return true;
      }

      if (!this.client) {
        console.warn('SMS service not configured for order updates');
        return false;
      }

      let message = '';
      switch (status.toLowerCase()) {
        case 'shipped':
          message = `Great news! Your Shoppers9 order ${orderNumber} has been shipped and is on its way to you.`;
          break;
        case 'delivered':
          message = `Your Shoppers9 order ${orderNumber} has been delivered! We hope you love your purchase.`;
          break;
        case 'cancelled':
          message = `Your Shoppers9 order ${orderNumber} has been cancelled. Refund will be processed within 3-5 business days.`;
          break;
        default:
          message = `Your Shoppers9 order ${orderNumber} status has been updated to: ${status}.`;
      }
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `+91${phone}`
      });

      console.log(`Order update SMS sent. SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send order update SMS:', error);
      return false;
    }
  }

  async sendWelcomeMessage(phone: string, name: string): Promise<boolean> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 Welcome message for ${phone}: Welcome ${name}!`);
        return true;
      }

      if (!this.client) {
        console.warn('SMS service not configured for welcome message');
        return false;
      }

      const message = `Welcome to Shoppers9, ${name}! 🎉 Discover amazing fashion and lifestyle products at unbeatable prices. Happy shopping!`;
      
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: `+91${phone}`
      });

      console.log(`Welcome SMS sent. SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error('Failed to send welcome SMS:', error);
      return false;
    }
  }
}

export const smsService = new SMSService();