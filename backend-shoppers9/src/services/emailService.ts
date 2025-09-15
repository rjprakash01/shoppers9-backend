import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter (using Gmail for development)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'noreply@shoppers9.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
      }
    });
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Shoppers9 <noreply@shoppers9.com>',
        to: email,
        subject: 'Welcome to Shoppers9!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Shoppers9, ${name}!</h2>
            <p>Thank you for creating an account with us. We're excited to have you as part of our community.</p>
            <p>You can now:</p>
            <ul>
              <li>Browse our extensive product catalog</li>
              <li>Add items to your wishlist</li>
              <li>Enjoy exclusive deals and offers</li>
              <li>Track your orders in real-time</li>
            </ul>
            <p>Happy shopping!</p>
            <p>Best regards,<br>The Shoppers9 Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for email failures in development
    }
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Shoppers9 <noreply@shoppers9.com>',
        to: email,
        subject: 'Password Reset Request - Shoppers9',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hi ${name},</p>
            <p>You requested a password reset for your Shoppers9 account. Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>Best regards,<br>The Shoppers9 Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new AppError('Failed to send password reset email', 500);
    }
  }

  async sendEmailVerification(email: string, name: string, verificationToken: string): Promise<void> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-email?token=${verificationToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'Shoppers9 <noreply@shoppers9.com>',
        to: email,
        subject: 'Verify Your Email - Shoppers9',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email Address</h2>
            <p>Hi ${name},</p>
            <p>Thank you for signing up with Shoppers9! Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
            </div>
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create this account, please ignore this email.</p>
            <p>Best regards,<br>The Shoppers9 Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email verification:', error);
      // Don't throw error for email failures in development
    }
  }
}

export const emailService = new EmailService();