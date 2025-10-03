import express from 'express';
import { auth } from '../middleware/auth';
import { requirePermission } from '../middleware/permission';

const router = express.Router();

// Shipping Analytics Interfaces
interface ShippingProvider {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  totalShipments: number;
  successRate: number;
  avgDeliveryTime: number;
}

interface ShippingAnalytics {
  totalShipments: number;
  deliveredShipments: number;
  pendingShipments: number;
  cancelledShipments: number;
  returnedShipments: number;
  avgDeliveryTime: number;
  onTimeDeliveryRate: number;
  totalShippingCost: number;
  avgShippingCost: number;
  topProviders: ShippingProvider[];
  monthlyTrends: {
    month: string;
    shipments: number;
    delivered: number;
    avgDeliveryTime: number;
    cost: number;
  }[];
  regionWiseData: {
    region: string;
    shipments: number;
    avgDeliveryTime: number;
    successRate: number;
  }[];
}

// Mock shipping providers data
const shippingProviders: ShippingProvider[] = [
  {
    id: '1',
    name: 'BlueDart',
    code: 'BLUEDART',
    isActive: true,
    totalShipments: 1250,
    successRate: 94.5,
    avgDeliveryTime: 2.8
  },
  {
    id: '2',
    name: 'DTDC',
    code: 'DTDC',
    isActive: true,
    totalShipments: 980,
    successRate: 91.2,
    avgDeliveryTime: 3.2
  },
  {
    id: '3',
    name: 'Delhivery',
    code: 'DELHIVERY',
    isActive: true,
    totalShipments: 1580,
    successRate: 96.1,
    avgDeliveryTime: 2.5
  },
  {
    id: '4',
    name: 'India Post',
    code: 'INDIAPOST',
    isActive: true,
    totalShipments: 750,
    successRate: 88.7,
    avgDeliveryTime: 4.1
  },
  {
    id: '5',
    name: 'Ecom Express',
    code: 'ECOM',
    isActive: true,
    totalShipments: 1120,
    successRate: 93.8,
    avgDeliveryTime: 3.0
  }
];

// Mock analytics data
const generateShippingAnalytics = (): ShippingAnalytics => {
  const totalShipments = shippingProviders.reduce((sum, provider) => sum + provider.totalShipments, 0);
  const deliveredShipments = Math.floor(totalShipments * 0.92);
  const pendingShipments = Math.floor(totalShipments * 0.05);
  const cancelledShipments = Math.floor(totalShipments * 0.02);
  const returnedShipments = Math.floor(totalShipments * 0.01);
  
  return {
    totalShipments,
    deliveredShipments,
    pendingShipments,
    cancelledShipments,
    returnedShipments,
    avgDeliveryTime: 2.9,
    onTimeDeliveryRate: 89.5,
    totalShippingCost: 285000,
    avgShippingCost: 45.2,
    topProviders: shippingProviders.sort((a, b) => b.totalShipments - a.totalShipments).slice(0, 5),
    monthlyTrends: [
      {
        month: 'Jan 2024',
        shipments: 520,
        delivered: 485,
        avgDeliveryTime: 3.1,
        cost: 23400
      },
      {
        month: 'Feb 2024',
        shipments: 580,
        delivered: 538,
        avgDeliveryTime: 2.9,
        cost: 26200
      },
      {
        month: 'Mar 2024',
        shipments: 650,
        delivered: 602,
        avgDeliveryTime: 2.8,
        cost: 29250
      },
      {
        month: 'Apr 2024',
        shipments: 720,
        delivered: 668,
        avgDeliveryTime: 2.7,
        cost: 32400
      },
      {
        month: 'May 2024',
        shipments: 680,
        delivered: 631,
        avgDeliveryTime: 2.9,
        cost: 30600
      },
      {
        month: 'Jun 2024',
        shipments: 750,
        delivered: 698,
        avgDeliveryTime: 2.6,
        cost: 33750
      }
    ],
    regionWiseData: [
      {
        region: 'North India',
        shipments: 1850,
        avgDeliveryTime: 2.5,
        successRate: 94.2
      },
      {
        region: 'South India',
        shipments: 1620,
        avgDeliveryTime: 2.8,
        successRate: 92.8
      },
      {
        region: 'West India',
        shipments: 1450,
        avgDeliveryTime: 2.6,
        successRate: 93.5
      },
      {
        region: 'East India',
        shipments: 980,
        avgDeliveryTime: 3.2,
        successRate: 89.7
      },
      {
        region: 'Northeast India',
        shipments: 420,
        avgDeliveryTime: 4.1,
        successRate: 86.3
      }
    ]
  };
};

// GET /api/shipping/analytics - Get shipping analytics
router.get('/analytics', auth, requirePermission('shipping'), (req, res) => {
  try {
    const analytics = generateShippingAnalytics();
    
    res.json({
      success: true,
      data: analytics,
      message: 'Shipping analytics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching shipping analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping analytics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/shipping/providers - Get all shipping providers
router.get('/providers', auth, requirePermission('shipping'), (req, res) => {
  try {
    res.json({
      success: true,
      data: shippingProviders,
      message: 'Shipping providers retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching shipping providers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping providers',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/shipping/providers/:id - Get specific shipping provider
router.get('/providers/:id', auth, requirePermission('shipping'), (req, res) => {
  try {
    const { id } = req.params;
    const provider = shippingProviders.find(p => p.id === id || p.code === id);
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Shipping provider not found'
      });
    }
    
    res.json({
      success: true,
      data: provider,
      message: 'Shipping provider retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching shipping provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/shipping/providers - Create new shipping provider
router.post('/providers', auth, requirePermission('shipping'), (req, res) => {
  try {
    const { name, code, isActive = true } = req.body;
    
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }
    
    // Check if provider with same code already exists
    const existingProvider = shippingProviders.find(p => p.code === code.toUpperCase());
    if (existingProvider) {
      return res.status(400).json({
        success: false,
        message: 'Provider with this code already exists'
      });
    }
    
    const newProvider: ShippingProvider = {
      id: (shippingProviders.length + 1).toString(),
      name,
      code: code.toUpperCase(),
      isActive,
      totalShipments: 0,
      successRate: 0,
      avgDeliveryTime: 0
    };
    
    shippingProviders.push(newProvider);
    
    res.status(201).json({
      success: true,
      data: newProvider,
      message: 'Shipping provider created successfully'
    });
  } catch (error) {
    console.error('Error creating shipping provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create shipping provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/shipping/providers/:id - Update shipping provider
router.put('/providers/:id', auth, requirePermission('shipping'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, isActive } = req.body;
    
    const providerIndex = shippingProviders.findIndex(p => p.id === id);
    
    if (providerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipping provider not found'
      });
    }
    
    // Update provider
    if (name) shippingProviders[providerIndex].name = name;
    if (code) shippingProviders[providerIndex].code = code.toUpperCase();
    if (isActive !== undefined) shippingProviders[providerIndex].isActive = isActive;
    
    res.json({
      success: true,
      data: shippingProviders[providerIndex],
      message: 'Shipping provider updated successfully'
    });
  } catch (error) {
    console.error('Error updating shipping provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shipping provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/shipping/providers/:id - Delete shipping provider
router.delete('/providers/:id', auth, requirePermission('shipping'), (req, res) => {
  try {
    const { id } = req.params;
    const providerIndex = shippingProviders.findIndex(p => p.id === id);
    
    if (providerIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Shipping provider not found'
      });
    }
    
    const deletedProvider = shippingProviders.splice(providerIndex, 1)[0];
    
    res.json({
      success: true,
      data: deletedProvider,
      message: 'Shipping provider deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting shipping provider:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shipping provider',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mock shipments data
const mockShipments = [
  {
    _id: '1',
    shipmentId: 'SHP-001',
    orderNumber: 'ORD-12345',
    providerId: '1',
    provider: { name: 'BlueDart', logo: '' },
    trackingNumber: 'BD123456789',
    status: 'in_transit',
    shippingAddress: {
      name: 'John Doe',
      phone: '+91-9876543210',
      addressLine1: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    packageDetails: {
      weight: 2.5,
      dimensions: { length: 30, width: 20, height: 15 },
      value: 2500,
      description: 'Electronics'
    },
    shippingCost: 150,
    estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    trackingEvents: [
      {
        status: 'picked_up',
        location: 'Mumbai Hub',
        description: 'Package picked up from seller',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '2',
    shipmentId: 'SHP-002',
    orderNumber: 'ORD-12346',
    providerId: '3',
    provider: { name: 'Delhivery', logo: '' },
    trackingNumber: 'DL987654321',
    status: 'delivered',
    shippingAddress: {
      name: 'Jane Smith',
      phone: '+91-9876543211',
      addressLine1: '456 Park Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    packageDetails: {
      weight: 1.2,
      dimensions: { length: 25, width: 15, height: 10 },
      value: 1200,
      description: 'Clothing'
    },
    shippingCost: 100,
    estimatedDelivery: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    actualDelivery: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    trackingEvents: [
      {
        status: 'picked_up',
        location: 'Delhi Hub',
        description: 'Package picked up from seller',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      },
      {
        status: 'delivered',
        location: 'Delhi',
        description: 'Package delivered successfully',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      }
    ],
    isActive: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  }
];

// GET /api/shipping/shipments - Get all shipments
router.get('/shipments', auth, requirePermission('shipping'), (req, res) => {
  try {
    const { status, providerId, page = 1, limit = 10, search } = req.query;
    
    let filteredShipments = [...mockShipments];
    
    // Apply filters
    if (status) {
      filteredShipments = filteredShipments.filter(shipment => shipment.status === status);
    }
    
    if (providerId) {
      filteredShipments = filteredShipments.filter(shipment => shipment.providerId === providerId);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredShipments = filteredShipments.filter(shipment => 
        shipment.shipmentId.toLowerCase().includes(searchLower) ||
        shipment.orderNumber.toLowerCase().includes(searchLower) ||
        shipment.trackingNumber.toLowerCase().includes(searchLower) ||
        shipment.shippingAddress.name.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort by creation date (newest first)
    filteredShipments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedShipments = filteredShipments.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        shipments: paginatedShipments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredShipments.length,
          pages: Math.ceil(filteredShipments.length / limitNum)
        }
      },
      message: 'Shipments retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching shipments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipments',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/shipping/stats - Get shipping statistics
router.get('/stats', auth, requirePermission('shipping'), (req, res) => {
  try {
    const analytics = generateShippingAnalytics();
    
    const stats = {
      totalShipments: analytics.totalShipments,
      deliveredShipments: analytics.deliveredShipments,
      pendingShipments: analytics.pendingShipments,
      avgDeliveryTime: analytics.avgDeliveryTime,
      onTimeDeliveryRate: analytics.onTimeDeliveryRate,
      totalProviders: shippingProviders.length,
      activeProviders: shippingProviders.filter(p => p.isActive).length,
      totalShippingCost: analytics.totalShippingCost,
      avgShippingCost: analytics.avgShippingCost
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'Shipping statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching shipping statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shipping statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;