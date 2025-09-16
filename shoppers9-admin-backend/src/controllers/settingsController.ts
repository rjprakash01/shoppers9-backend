import { Request, Response, NextFunction } from 'express';
import { Settings } from '../models/Settings';
import { AuthenticatedRequest } from '../types';

// Simple error class
class AppError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AppError';
  }
}

// Get current settings
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await Settings.getCurrentSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// Update settings
export const updateSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'admin';
    const updates = req.body;
    
    // Validate required fields
    const requiredFields = [
      'freeDeliveryMinAmount',
      'deliveryFee',
      'deliveryFeeThreshold',
      'platformFee',
      'platformFeeType',
      'taxRate',
      'minOrderAmount',
      'maxOrderAmount',
      'businessName',
      'businessEmail',
      'businessPhone',
      'businessAddress'
    ];
    
    for (const field of requiredFields) {
      if (updates[field] === undefined || updates[field] === null) {
        return next(new AppError(`${field} is required`, 400));
      }
    }
    
    // Additional validations
    if (updates.freeDeliveryMinAmount < 0) {
      return next(new AppError('Free delivery minimum amount cannot be negative', 400));
    }
    
    if (updates.deliveryFee < 0) {
      return next(new AppError('Delivery fee cannot be negative', 400));
    }
    
    if (updates.platformFee < 0) {
      return next(new AppError('Platform fee cannot be negative', 400));
    }
    
    if (updates.taxRate < 0 || updates.taxRate > 100) {
      return next(new AppError('Tax rate must be between 0 and 100', 400));
    }
    
    if (updates.minOrderAmount < 0) {
      return next(new AppError('Minimum order amount cannot be negative', 400));
    }
    
    if (updates.maxOrderAmount < updates.minOrderAmount) {
      return next(new AppError('Maximum order amount cannot be less than minimum order amount', 400));
    }
    
    if (updates.deliveryTimeMin < 1) {
      return next(new AppError('Minimum delivery time must be at least 1 day', 400));
    }
    
    if (updates.deliveryTimeMax < updates.deliveryTimeMin) {
      return next(new AppError('Maximum delivery time cannot be less than minimum delivery time', 400));
    }
    
    if (updates.returnPolicyDays < 0) {
      return next(new AppError('Return policy days cannot be negative', 400));
    }
    
    if (updates.refundProcessingDays < 1) {
      return next(new AppError('Refund processing days must be at least 1', 400));
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (updates.businessEmail && !emailRegex.test(updates.businessEmail)) {
      return next(new AppError('Please enter a valid business email', 400));
    }
    
    // Get current settings
    const currentSettings = await Settings.getCurrentSettings();
    
    // Update settings
    const updatedSettings = await currentSettings.updateSettings(updates, userId);
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

// Reset settings to default
export const resetSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'admin';
    
    // Get current settings
    const currentSettings = await Settings.getCurrentSettings();
    
    // Reset to default values
    const defaultSettings = {
      freeDeliveryMinAmount: 500,
      deliveryFee: 50,
      deliveryFeeThreshold: 500,
      platformFee: 20,
      platformFeeType: 'fixed' as const,
      taxRate: 18,
      taxIncluded: true,
      minOrderAmount: 100,
      maxOrderAmount: 50000,
      codEnabled: true,
      onlinePaymentEnabled: true,
      businessName: 'Shoppers9',
      businessEmail: 'admin@shoppers9.com',
      businessPhone: '+91-9876543210',
      businessAddress: 'Business Address, City, State, PIN',
      orderProcessingTime: 24,
      deliveryTimeMin: 3,
      deliveryTimeMax: 7,
      returnPolicyDays: 7,
      refundProcessingDays: 5
    };
    
    const resetSettings = await currentSettings.updateSettings(defaultSettings, userId);
    
    res.json({
      success: true,
      message: 'Settings reset to default values successfully',
      data: resetSettings
    });
  } catch (error) {
    next(error);
  }
};

// Get settings history (for audit trail)
export const getSettingsHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const history = await Settings.find()
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('lastModifiedBy updatedAt freeDeliveryMinAmount deliveryFee platformFee businessName');
    
    const total = await Settings.countDocuments();
    
    res.json({
      success: true,
      data: {
        history,
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
};

// Get specific setting category
export const getSettingsByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return next(new AppError('Category parameter is required', 400));
    }
    
    const settings = await Settings.getCurrentSettings();
    
    let categoryData: any = {};
    
    switch (category) {
      case 'delivery':
        categoryData = {
          freeDeliveryMinAmount: settings.freeDeliveryMinAmount,
          deliveryFee: settings.deliveryFee,
          deliveryFeeThreshold: settings.deliveryFeeThreshold,
          deliveryTimeMin: settings.deliveryTimeMin,
          deliveryTimeMax: settings.deliveryTimeMax
        };
        break;
      
      case 'platform':
        categoryData = {
          platformFee: settings.platformFee,
          platformFeeType: settings.platformFeeType,
          taxRate: settings.taxRate,
          taxIncluded: settings.taxIncluded
        };
        break;
      
      case 'order':
        categoryData = {
          minOrderAmount: settings.minOrderAmount,
          maxOrderAmount: settings.maxOrderAmount,
          orderProcessingTime: settings.orderProcessingTime
        };
        break;
      
      case 'payment':
        categoryData = {
          codEnabled: settings.codEnabled,
          onlinePaymentEnabled: settings.onlinePaymentEnabled
        };
        break;
      
      case 'business':
        categoryData = {
          businessName: settings.businessName,
          businessEmail: settings.businessEmail,
          businessPhone: settings.businessPhone,
          businessAddress: settings.businessAddress
        };
        break;
      
      case 'return':
        categoryData = {
          returnPolicyDays: settings.returnPolicyDays,
          refundProcessingDays: settings.refundProcessingDays
        };
        break;
      
      default:
        return next(new AppError('Invalid category', 400));
    }
    
    res.json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    next(error);
  }
};

// Update specific setting category
export const updateSettingsByCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const userId = req.user?.id || 'admin';
    const updates = req.body;
    
    if (!category) {
      return next(new AppError('Category parameter is required', 400));
    }
    
    // Validate category
    const validCategories = ['delivery', 'platform', 'order', 'payment', 'business', 'return'];
    if (!validCategories.includes(category)) {
      return next(new AppError('Invalid category', 400));
    }
    
    // Get current settings
    const currentSettings = await Settings.getCurrentSettings();
    
    // Update only the relevant fields based on category
    const updatedSettings = await currentSettings.updateSettings(updates, userId);
    
    res.json({
      success: true,
      message: `${category} settings updated successfully`,
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

// Export settings for backup
export const exportSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await Settings.getCurrentSettings();
    
    // Remove sensitive fields
    const exportData = settings.toObject();
    delete exportData._id;
    delete exportData.__v;
    delete exportData.createdAt;
    delete exportData.updatedAt;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=shoppers9-settings-${new Date().toISOString().split('T')[0]}.json`);
    
    res.json({
      success: true,
      exportDate: new Date().toISOString(),
      data: exportData
    });
  } catch (error) {
    next(error);
  }
};

// Import settings from backup
export const importSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || 'admin';
    const importData = req.body;
    
    if (!importData || typeof importData !== 'object') {
      return next(new AppError('Invalid import data', 400));
    }
    
    // Remove metadata fields
    delete importData._id;
    delete importData.__v;
    delete importData.createdAt;
    delete importData.updatedAt;
    delete importData.lastModifiedBy;
    
    // Get current settings
    const currentSettings = await Settings.getCurrentSettings();
    
    // Update with imported data
    const updatedSettings = await currentSettings.updateSettings(importData, userId);
    
    res.json({
      success: true,
      message: 'Settings imported successfully',
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};