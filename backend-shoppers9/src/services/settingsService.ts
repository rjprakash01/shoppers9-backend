import axios from 'axios';

interface PlatformSettings {
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

class SettingsService {
  private cachedSettings: PlatformSettings | null = null;
  private cacheExpiry: number | null = null;
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private readonly adminApiUrl: string;

  constructor() {
    this.adminApiUrl = process.env.ADMIN_API_URL || 'http://localhost:5001/api';
  }

  // Get platform settings with caching
  async getSettings(): Promise<PlatformSettings> {
    // Return cached settings if available and not expired
    if (this.cachedSettings && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      return this.cachedSettings as PlatformSettings;
    }

    try {
      const response = await axios.get(`${this.adminApiUrl}/settings/public`, {
        timeout: 5000 // 5 second timeout
      });
      
      if (response.data && response.data.success && response.data.data) {
        this.cachedSettings = response.data.data;
        this.cacheExpiry = Date.now() + this.cacheTimeout;
        return this.cachedSettings as PlatformSettings;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn('Failed to fetch settings from admin backend, using defaults:', errorMessage);
    }

    // Return default settings if fetch fails
    const defaultSettings = this.getDefaultSettings();
    this.cachedSettings = defaultSettings;
    this.cacheExpiry = Date.now() + this.cacheTimeout;
    return defaultSettings;
  }

  // Calculate platform fee based on settings
  async calculatePlatformFee(subtotal: number): Promise<number> {
    const settings = await this.getSettings();
    
    if (settings.platformFeeType === 'percentage') {
      return (subtotal * settings.platformFee) / 100;
    } else {
      return settings.platformFee;
    }
  }

  // Calculate delivery fee based on settings
  async calculateDeliveryFee(subtotal: number): Promise<number> {
    const settings = await this.getSettings();
    
    if (subtotal >= settings.freeDeliveryMinAmount) {
      return 0; // Free delivery
    }
    return settings.deliveryFee;
  }

  // Check if order meets minimum amount requirement
  async isValidOrderAmount(amount: number): Promise<boolean> {
    const settings = await this.getSettings();
    return amount >= settings.minOrderAmount && amount <= settings.maxOrderAmount;
  }

  // Clear cache (useful for testing or forced refresh)
  clearCache(): void {
    this.cachedSettings = null;
    this.cacheExpiry = null;
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
export type { PlatformSettings };