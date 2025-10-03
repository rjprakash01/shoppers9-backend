import { ShippingProvider, ShippingRate, Shipment } from '../models/Shipping';
import { Order } from '../models/Order';
import {
  IShippingProvider,
  IShippingRate,
  IShipment,
  ShippingCalculationRequest,
  ShippingOption,
  TrackingInfo,
  ServiceType,
  ShippingStatus
} from '../types';
import mongoose from 'mongoose';

export interface CreateShipmentRequest {
  orderNumber: string;
  providerId: string;
  serviceType: ServiceType;
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    value: number;
    description: string;
  };
  notes?: string;
}

export interface UpdateTrackingRequest {
  shipmentId: string;
  status: ShippingStatus;
  location: string;
  description: string;
  estimatedDelivery?: Date;
}

class ShippingService {
  /**
   * Calculate shipping rates for given parameters
   */
  async calculateShippingRates(request: ShippingCalculationRequest): Promise<ShippingOption[]> {
    const { weight, dimensions, value, fromPincode, toPincode, serviceType, providerId } = request;
    
    // Build query for active providers and rates
    const providerQuery: any = { isActive: true };
    if (providerId) {
      providerQuery._id = providerId;
    }
    
    const rateQuery: any = { isActive: true };
    if (serviceType) {
      rateQuery.serviceType = serviceType;
    }
    
    // Get active providers
    const providers = await ShippingProvider.find(providerQuery).sort({ priority: -1 });
    const shippingOptions: ShippingOption[] = [];
    
    for (const provider of providers) {
      // Check if provider serves the destination pincode
      const servesDestination = provider.serviceAreas.some((area: any) => 
        area.isActive && area.pincodes.includes(toPincode)
      );
      
      if (!servesDestination) {
        continue;
      }
      
      // Get rates for this provider
      const rates = await ShippingRate.find({
        ...rateQuery,
        providerId: provider._id,
        maxWeight: { $gte: weight },
        maxValue: { $gte: value }
      });
      
      for (const rate of rates) {
        try {
          const defaultDimensions = { length: 10, width: 10, height: 10 };
          const cost = await this.calculateRateCost(rate, weight, dimensions || defaultDimensions, value, fromPincode, toPincode);
          
          if (cost !== null) {
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + rate.deliveryTime.max);
            
            const isFreeShipping = rate.freeShippingThreshold ? value >= rate.freeShippingThreshold : false;
            
            shippingOptions.push({
              providerId: provider._id.toString(),
              providerName: provider.name,
              serviceType: rate.serviceType,
              serviceName: rate.name,
              cost: isFreeShipping ? 0 : cost,
              estimatedDays: rate.deliveryTime.max,
              deliveryTime: rate.deliveryTime,
              estimatedDelivery,
              isFreeShipping
            });
          }
        } catch (error) {
          console.error(`Error calculating rate for provider ${provider.name}:`, error);
        }
      }
    }
    
    // Sort by cost (free shipping first, then by price)
    return shippingOptions.sort((a, b) => {
      if (a.isFreeShipping && !b.isFreeShipping) return -1;
      if (!a.isFreeShipping && b.isFreeShipping) return 1;
      return a.cost - b.cost;
    });
  }
  
  /**
   * Calculate cost for a specific rate
   */
  private async calculateRateCost(
    rate: IShippingRate,
    weight: number,
    dimensions: { length: number; width: number; height: number },
    value: number,
    fromPincode: string,
    toPincode: string
  ): Promise<number | null> {
    let cost = rate.rateStructure.baseRate;
    
    switch (rate.rateStructure.type) {
      case 'flat':
        // Flat rate - just use base rate
        break;
        
      case 'weight_based':
        if (rate.rateStructure.weightRanges) {
          const weightRange = rate.rateStructure.weightRanges.find(
            (range: any) => weight >= range.minWeight && weight <= range.maxWeight
          );
          if (weightRange) {
            cost = weightRange.rate;
          } else {
            return null; // Weight not supported
          }
        }
        break;
        
      case 'distance_based':
        // For distance-based, we would need a distance calculation service
        // For now, use base rate with zone multiplier
        const zone = rate.zones.find((z: any) => z.pincodes.includes(toPincode));
        if (zone) {
          cost = rate.rateStructure.baseRate * zone.multiplier;
        }
        break;
        
      case 'value_based':
        if (rate.rateStructure.valuePercentage) {
          cost = (value * rate.rateStructure.valuePercentage) / 100;
        }
        break;
        
      default:
        return null;
    }
    
    // Apply zone multiplier if applicable
    const zone = rate.zones.find((z: any) => z.pincodes.includes(toPincode));
    if (zone && rate.rateStructure.type !== 'distance_based') {
      cost *= zone.multiplier;
    }
    
    return Math.round(cost * 100) / 100; // Round to 2 decimal places
  }
  
  /**
   * Create a new shipment
   */
  async createShipment(request: CreateShipmentRequest): Promise<IShipment> {
    const { orderNumber, providerId, serviceType, packageDetails, notes } = request;
    
    // Validate order exists
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Validate provider exists
    const provider = await ShippingProvider.findById(providerId);
    if (!provider || !provider.isActive) {
      throw new Error('Shipping provider not found or inactive');
    }
    
    // Get shipping rate for cost calculation
    const rate = await ShippingRate.findOne({
      providerId,
      serviceType,
      isActive: true,
      maxWeight: { $gte: packageDetails.weight },
      maxValue: { $gte: packageDetails.value }
    });
    
    if (!rate) {
      throw new Error('No suitable shipping rate found');
    }
    
    // Calculate shipping cost
    const shippingCost = await this.calculateRateCost(
      rate,
      packageDetails.weight,
      packageDetails.dimensions,
      packageDetails.value,
      '000000', // Default from pincode
      order.shippingAddress.pincode
    );
    
    if (shippingCost === null) {
      throw new Error('Unable to calculate shipping cost');
    }
    
    // Generate tracking number
    const trackingNumber = this.generateTrackingNumber(provider.code);
    
    // Calculate estimated delivery
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + rate.deliveryTime.max);
    
    // Create shipment
    const shipment = new Shipment({
      orderNumber,
      providerId,
      trackingNumber,
      shippingAddress: order.shippingAddress,
      packageDetails,
      shippingCost,
      estimatedDelivery,
      notes
    });
    
    await shipment.save();
    
    // Add initial tracking event
    await shipment.addTrackingEvent(
      'pending',
      'Warehouse',
      'Shipment created and ready for pickup'
    );
    
    return shipment;
  }
  
  /**
   * Update shipment tracking
   */
  async updateTracking(request: UpdateTrackingRequest): Promise<IShipment> {
    const { shipmentId, status, location, description, estimatedDelivery } = request;
    
    const shipment = await Shipment.findOne({ shipmentId });
    if (!shipment) {
      throw new Error('Shipment not found');
    }
    
    await shipment.addTrackingEvent(status, location, description, estimatedDelivery);
    
    // Update order status if delivered
    if (status === 'delivered') {
      await Order.findOneAndUpdate(
        { orderNumber: shipment.orderNumber },
        { 
          orderStatus: 'delivered',
          deliveredAt: new Date()
        }
      );
    }
    
    return shipment;
  }
  
  /**
   * Get tracking information
   */
  async getTrackingInfo(trackingNumber: string): Promise<TrackingInfo | null> {
    const shipment = await Shipment.findOne({ trackingNumber })
      .populate('providerId', 'name contactInfo.website apiConfig.trackingUrl');
    
    if (!shipment) {
      return null;
    }
    
    const provider = shipment.providerId as any;
    
    return {
      shipmentId: shipment.shipmentId,
      trackingNumber: shipment.trackingNumber,
      status: shipment.status as ShippingStatus,
      currentLocation: shipment.currentLocation,
      estimatedDelivery: shipment.estimatedDelivery,
      actualDelivery: shipment.actualDelivery,
      trackingEvents: shipment.trackingEvents,
      providerInfo: {
        name: provider.name,
        trackingUrl: provider.apiConfig?.trackingUrl
      }
    };
  }
  
  /**
   * Get shipments for an order
   */
  async getOrderShipments(orderNumber: string): Promise<IShipment[]> {
    return await Shipment.find({ orderNumber, isActive: true })
      .populate('providerId', 'name logo')
      .sort({ createdAt: -1 });
  }
  
  /**
   * Get all shipments with filters
   */
  async getShipments(filters: {
    status?: ShippingStatus;
    providerId?: string;
    fromDate?: Date;
    toDate?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    shipments: IShipment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    const { status, providerId, fromDate, toDate, page = 1, limit = 20 } = filters;
    
    const query: any = { isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (providerId) {
      query.providerId = providerId;
    }
    
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) {
        query.createdAt.$gte = fromDate;
      }
      if (toDate) {
        query.createdAt.$lte = toDate;
      }
    }
    
    const skip = (page - 1) * limit;
    
    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .populate('providerId', 'name logo')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Shipment.countDocuments(query)
    ]);
    
    return {
      shipments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get shipping providers
   */
  async getProviders(activeOnly: boolean = true): Promise<IShippingProvider[]> {
    const query = activeOnly ? { isActive: true } : {};
    return await ShippingProvider.find(query).sort({ priority: -1, name: 1 });
  }
  
  /**
   * Get shipping rates for a provider
   */
  async getProviderRates(providerId: string, activeOnly: boolean = true): Promise<IShippingRate[]> {
    const query: any = { providerId };
    if (activeOnly) {
      query.isActive = true;
    }
    return await ShippingRate.find(query).sort({ serviceType: 1, name: 1 });
  }
  
  /**
   * Generate tracking number
   */
  private generateTrackingNumber(providerCode: string): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${providerCode}${timestamp.slice(-6)}${random}`;
  }
  
  /**
   * Get shipping analytics
   */
  async getShippingAnalytics(fromDate?: Date, toDate?: Date): Promise<{
    totalShipments: number;
    deliveredShipments: number;
    inTransitShipments: number;
    averageDeliveryTime: number;
    topProviders: Array<{
      providerId: string;
      providerName: string;
      shipmentCount: number;
      deliveryRate: number;
    }>;
    statusBreakdown: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  }> {
    const dateFilter: any = {};
    if (fromDate || toDate) {
      dateFilter.createdAt = {};
      if (fromDate) dateFilter.createdAt.$gte = fromDate;
      if (toDate) dateFilter.createdAt.$lte = toDate;
    }
    
    const [totalShipments, statusStats, providerStats] = await Promise.all([
      Shipment.countDocuments({ isActive: true, ...dateFilter }),
      Shipment.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Shipment.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        {
          $lookup: {
            from: 'shippingproviders',
            localField: 'providerId',
            foreignField: '_id',
            as: 'provider'
          }
        },
        { $unwind: '$provider' },
        {
          $group: {
            _id: '$providerId',
            providerName: { $first: '$provider.name' },
            totalShipments: { $sum: 1 },
            deliveredShipments: {
              $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
            }
          }
        },
        {
          $project: {
            providerId: '$_id',
            providerName: 1,
            shipmentCount: '$totalShipments',
            deliveryRate: {
              $multiply: [
                { $divide: ['$deliveredShipments', '$totalShipments'] },
                100
              ]
            }
          }
        },
        { $sort: { shipmentCount: -1 } },
        { $limit: 5 }
      ])
    ]);
    
    const deliveredShipments = statusStats.find(s => s._id === 'delivered')?.count || 0;
    const inTransitShipments = statusStats.filter(s => 
      ['picked_up', 'in_transit', 'out_for_delivery'].includes(s._id)
    ).reduce((sum, s) => sum + s.count, 0);
    
    // Calculate average delivery time
    const deliveredWithTimes = await Shipment.find({
      status: 'delivered',
      actualDelivery: { $exists: true },
      isActive: true,
      ...dateFilter
    }).select('createdAt actualDelivery');
    
    const averageDeliveryTime = deliveredWithTimes.length > 0
      ? deliveredWithTimes.reduce((sum, shipment) => {
          const deliveryTime = (shipment.actualDelivery!.getTime() - shipment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
          return sum + deliveryTime;
        }, 0) / deliveredWithTimes.length
      : 0;
    
    const statusBreakdown = statusStats.map(stat => ({
      status: stat._id,
      count: stat.count,
      percentage: Math.round((stat.count / totalShipments) * 100)
    }));
    
    return {
      totalShipments,
      deliveredShipments,
      inTransitShipments,
      averageDeliveryTime: Math.round(averageDeliveryTime * 10) / 10,
      topProviders: providerStats,
      statusBreakdown
    };
  }
}

export const shippingService = new ShippingService();
export default shippingService;