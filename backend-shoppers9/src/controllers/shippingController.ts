import { Request, Response, NextFunction } from 'express';
import { ShippingProvider, ShippingRate, Shipment } from '../models/Shipping';
import { AuthenticatedRequest } from '../types';
import { AppError } from '../middleware/errorHandler';
import { shippingService, CreateShipmentRequest, UpdateTrackingRequest } from '../services/shippingService';
import { ShippingCalculationRequest, ServiceType, ShippingStatus } from '../types';

/**
 * Calculate shipping rates
 */
export const calculateShippingRates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      weight,
      dimensions,
      value,
      fromPincode,
      toPincode,
      serviceType,
      providerId
    } = req.body;

    // Validate required fields
    if (!weight || !dimensions || !value || !fromPincode || !toPincode) {
      return next(new AppError('Missing required fields: weight, dimensions, value, fromPincode, toPincode', 400));
    }

    const request: ShippingCalculationRequest = {
      weight,
      dimensions,
      value,
      fromPincode,
      toPincode,
      serviceType,
      providerId
    };

    const shippingOptions = await shippingService.calculateShippingRates(request);

    res.json({
      success: true,
      message: 'Shipping rates calculated successfully',
      data: {
        options: shippingOptions,
        count: shippingOptions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new shipment
 */
export const createShipment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      orderNumber,
      providerId,
      serviceType,
      packageDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!orderNumber || !providerId || !serviceType || !packageDetails) {
      return next(new AppError('Missing required fields: orderNumber, providerId, serviceType, packageDetails', 400));
    }

    const request: CreateShipmentRequest = {
      orderNumber,
      providerId,
      serviceType,
      packageDetails,
      notes
    };

    const shipment = await shippingService.createShipment(request);

    res.status(201).json({
      success: true,
      message: 'Shipment created successfully',
      data: { shipment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipment tracking
 */
export const updateShipmentTracking = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { shipmentId } = req.params;
    const { status, location, description, estimatedDelivery } = req.body;

    if (!status || !location || !description) {
      return next(new AppError('Missing required fields: status, location, description', 400));
    }

    const request: UpdateTrackingRequest = {
      shipmentId,
      status,
      location,
      description,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined
    };

    const shipment = await shippingService.updateTracking(request);

    res.json({
      success: true,
      message: 'Shipment tracking updated successfully',
      data: { shipment }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get tracking information
 */
export const getTrackingInfo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { trackingNumber } = req.params;

    const trackingInfo = await shippingService.getTrackingInfo(trackingNumber);

    if (!trackingInfo) {
      return next(new AppError('Tracking information not found', 404));
    }

    res.json({
      success: true,
      message: 'Tracking information retrieved successfully',
      data: trackingInfo
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipments for an order
 */
export const getOrderShipments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderNumber } = req.params;

    const shipments = await shippingService.getOrderShipments(orderNumber);

    res.json({
      success: true,
      message: 'Order shipments retrieved successfully',
      data: {
        shipments,
        count: shipments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all shipments with filters (Admin)
 */
export const getShipments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const {
      status,
      providerId,
      fromDate,
      toDate,
      page = 1,
      limit = 20
    } = req.query;

    const filters: any = {
      page: Number(page),
      limit: Number(limit)
    };

    if (status) {
      filters.status = status as ShippingStatus;
    }

    if (providerId) {
      filters.providerId = providerId as string;
    }

    if (fromDate) {
      filters.fromDate = new Date(fromDate as string);
    }

    if (toDate) {
      filters.toDate = new Date(toDate as string);
    }

    const result = await shippingService.getShipments(filters);

    res.json({
      success: true,
      message: 'Shipments retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping providers
 */
export const getShippingProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { includeInactive } = req.query;
    const activeOnly = includeInactive !== 'true';

    const providers = await shippingService.getProviders(activeOnly);

    res.json({
      success: true,
      message: 'Shipping providers retrieved successfully',
      data: {
        providers,
        count: providers.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create shipping provider (Admin)
 */
export const createShippingProvider = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const providerData = req.body;

    const provider = new ShippingProvider(providerData);
    await provider.save();

    res.status(201).json({
      success: true,
      message: 'Shipping provider created successfully',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipping provider (Admin)
 */
export const updateShippingProvider = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const updateData = req.body;

    const provider = await ShippingProvider.findByIdAndUpdate(
      providerId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!provider) {
      return next(new AppError('Shipping provider not found', 404));
    }

    res.json({
      success: true,
      message: 'Shipping provider updated successfully',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete shipping provider (Admin)
 */
export const deleteShippingProvider = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;

    const provider = await ShippingProvider.findByIdAndUpdate(
      providerId,
      { isActive: false },
      { new: true }
    );

    if (!provider) {
      return next(new AppError('Shipping provider not found', 404));
    }

    res.json({
      success: true,
      message: 'Shipping provider deactivated successfully',
      data: { provider }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping rates for a provider
 */
export const getProviderRates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerId } = req.params;
    const { includeInactive } = req.query;
    const activeOnly = includeInactive !== 'true';

    const rates = await shippingService.getProviderRates(providerId, activeOnly);

    res.json({
      success: true,
      message: 'Provider rates retrieved successfully',
      data: {
        rates,
        count: rates.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create shipping rate (Admin)
 */
export const createShippingRate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const rateData = req.body;

    const rate = new ShippingRate(rateData);
    await rate.save();

    res.status(201).json({
      success: true,
      message: 'Shipping rate created successfully',
      data: { rate }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update shipping rate (Admin)
 */
export const updateShippingRate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { rateId } = req.params;
    const updateData = req.body;

    const rate = await ShippingRate.findByIdAndUpdate(
      rateId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!rate) {
      return next(new AppError('Shipping rate not found', 404));
    }

    res.json({
      success: true,
      message: 'Shipping rate updated successfully',
      data: { rate }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete shipping rate (Admin)
 */
export const deleteShippingRate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { rateId } = req.params;

    const rate = await ShippingRate.findByIdAndUpdate(
      rateId,
      { isActive: false },
      { new: true }
    );

    if (!rate) {
      return next(new AppError('Shipping rate not found', 404));
    }

    res.json({
      success: true,
      message: 'Shipping rate deactivated successfully',
      data: { rate }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipping analytics (Admin)
 */
export const getShippingAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { fromDate, toDate } = req.query;

    const analytics = await shippingService.getShippingAnalytics(
      fromDate ? new Date(fromDate as string) : undefined,
      toDate ? new Date(toDate as string) : undefined
    );

    res.json({
      success: true,
      message: 'Shipping analytics retrieved successfully',
      data: analytics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update shipment status (Admin)
 */
export const bulkUpdateShipmentStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return next(new AppError('Updates array is required', 400));
    }

    const results = {
      successful: 0,
      failed: [] as Array<{ shipmentId: string; error: string }>
    };

    for (const update of updates) {
      try {
        const { shipmentId, status, location, description, estimatedDelivery } = update;

        if (!shipmentId || !status || !location || !description) {
          results.failed.push({
            shipmentId: shipmentId || 'unknown',
            error: 'Missing required fields'
          });
          continue;
        }

        await shippingService.updateTracking({
          shipmentId,
          status,
          location,
          description,
          estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined
        });

        results.successful++;
      } catch (error) {
        results.failed.push({
          shipmentId: update.shipmentId || 'unknown',
          error: (error as Error).message
        });
      }
    }

    res.json({
      success: true,
      message: 'Bulk update completed',
      data: {
        ...results,
        total: updates.length,
        successRate: `${((results.successful / updates.length) * 100).toFixed(1)}%`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get shipment by ID
 */
export const getShipmentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shipmentId } = req.params;

    const shipment = await Shipment.findOne({ shipmentId })
      .populate('providerId', 'name logo contactInfo')
      .populate({
        path: 'orderNumber',
        select: 'orderNumber userId items shippingAddress',
        populate: {
          path: 'userId',
          select: 'name phone email'
        }
      });

    if (!shipment) {
      return next(new AppError('Shipment not found', 404));
    }

    res.json({
      success: true,
      message: 'Shipment retrieved successfully',
      data: { shipment }
    });
  } catch (error) {
    next(error);
  }
};