import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface PlatformSettings {
  freeDeliveryMinAmount: number;
  deliveryFee: number;
  deliveryFeeThreshold: number;
  platformFee: number;
  platformFeeType: 'fixed' | 'percentage';
  taxRate: number;
  taxIncluded: boolean;
  minOrderAmount: number;
  maxOrderAmount: number;
  codEnabled: boolean;
  onlinePaymentEnabled: boolean;
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  orderProcessingTime: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  returnPolicyDays: number;
  refundProcessingDays: number;
}

export interface SettingsResponse {
  success: boolean;
  message: string;
  data: PlatformSettings;
}

class SettingsService {
  private baseURL = `${API_BASE_URL}/settings`;

  // Get platform settings
  async getSettings(): Promise<PlatformSettings> {
    try {
      const response = await axios.get(`${this.baseURL}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Return default settings if API fails
      return this.getDefaultSettings();
    }
  }

  // Calculate platform fee based on settings
  calculatePlatformFee(subtotal: number, settings: PlatformSettings): number {
    if (settings.platformFeeType === 'percentage') {
      return (subtotal * settings.platformFee) / 100;
    } else {
      return settings.platformFee;
    }
  }

  // Calculate delivery fee based on settings
  calculateDeliveryFee(subtotal: number, settings: PlatformSettings): number {
    if (subtotal >= settings.freeDeliveryMinAmount) {
      return 0; // Free delivery
    }
    return settings.deliveryFee;
  }

  // Calculate total with all fees
  calculateTotal(subtotal: number, settings: PlatformSettings, couponDiscount = 0): {
    subtotal: number;
    platformFee: number;
    deliveryFee: number;
    couponDiscount: number;
    total: number;
  } {
    const platformFee = this.calculatePlatformFee(subtotal, settings);
    const deliveryFee = this.calculateDeliveryFee(subtotal, settings);
    const total = subtotal + platformFee + deliveryFee - couponDiscount;

    return {
      subtotal,
      platformFee,
      deliveryFee,
      couponDiscount,
      total
    };
  }

  // Check if order meets minimum amount requirement
  isValidOrderAmount(amount: number, settings: PlatformSettings): boolean {
    return amount >= settings.minOrderAmount && amount <= settings.maxOrderAmount;
  }

  // Get default settings as fallback
  private getDefaultSettings(): PlatformSettings {
    return {
      freeDeliveryMinAmount: 500,
      deliveryFee: 50,
      deliveryFeeThreshold: 500,
      platformFee: 20,
      platformFeeType: 'fixed',
      taxRate: 0,
      taxIncluded: true,
      minOrderAmount: 100,
      maxOrderAmount: 50000,
      codEnabled: true,
      onlinePaymentEnabled: true,
      businessName: 'Shoppers9',
      businessEmail: 'support@shoppers9.com',
      businessPhone: '+91-9999999999',
      businessAddress: 'India',
      orderProcessingTime: 24,
      deliveryTimeMin: 3,
      deliveryTimeMax: 7,
      returnPolicyDays: 7,
      refundProcessingDays: 5
    };
  }
}

export const settingsService = new SettingsService();
export default settingsService;