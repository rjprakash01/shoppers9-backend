import express from 'express';
import axios from 'axios';

const router = express.Router();

// Admin backend URL
const ADMIN_API_URL = process.env.ADMIN_API_URL || 'http://localhost:5003/api';

// Get platform settings (public endpoint)
router.get('/', async (req, res, next) => {
  try {
    const response = await axios.get(`${ADMIN_API_URL}/settings/public`);
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings if admin backend is down
    res.json({
      success: true,
      data: {
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
      }
    });
  }
});

export default router;