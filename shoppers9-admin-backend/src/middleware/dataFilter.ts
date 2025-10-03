import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import mongoose from 'mongoose';

// Data filtering middleware for role-based data isolation
export const applyDataFilter = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRole = req.admin.role;
  const userId = req.admin._id;

  // Add data filter to request for use in controllers
  req.dataFilter = {
    role: userRole,
    userId: userId,
    getFilter: (modelType: string) => {
      return getDataFilterForRole(userRole, userId, modelType);
    },
    applyFilter: (query: any, modelType: string) => {
      const filter = getDataFilterForRole(userRole, userId, modelType);
      return { ...query, ...filter };
    }
  };

  next();
};

// Get data filter based on role and model type
function getDataFilterForRole(role: string, userId: string, modelType: string): any {
  // Super Admin sees everything
  if (role === 'super_admin') {
    return {};
  }

  // Admin sees only their own data
  if (role === 'admin') {
    switch (modelType) {
      case 'Product':
        return { createdBy: userId }; // Can see only their own products
      case 'Order':
        return { 'items.sellerId': userId }; // Can see only orders with their products
      case 'Coupon':
        return { createdBy: userId }; // Can see only their own coupons
      case 'Category':
        return {}; // Can see all categories (global resource)
      case 'Banner':
        return { createdBy: userId }; // Can see only their own banners
      case 'Support':
        return {}; // Can see all support tickets for customer service
      case 'User':
        // Admin can see customers but not other admins/sellers
        return { primaryRole: 'customer' };
      default:
        return { createdBy: userId }; // Default to own data only
    }
  }

  // Sub-Admin has limited access to operational data
  if (role === 'sub_admin') {
    switch (modelType) {
      case 'Product':
        return {}; // Can see all products for support purposes
      case 'Order':
        return {}; // Can see all orders for support
      case 'User':
        return { primaryRole: 'customer' }; // Only customers
      case 'Support':
        return {}; // Can see all support tickets
      case 'Coupon':
        return {}; // Can see all coupons for support
      default:
        return { _id: { $exists: false } }; // No access to other data
    }
  }

  // Seller sees only their own data
  if (role === 'seller') {
    switch (modelType) {
      case 'Product':
        return { createdBy: userId };
      case 'Order':
        return { 'items.sellerId': userId };
      case 'Coupon':
        return { createdBy: userId };
      case 'Support':
        return { userId: userId };
      case 'User':
        // Sellers can only see their own profile
        return { _id: userId };
      default:
        return { createdBy: userId };
    }
  }

  // Customer sees only their own data
  if (role === 'customer') {
    switch (modelType) {
      case 'Order':
        return { userId: userId };
      case 'Support':
        return { userId: userId };
      case 'User':
        return { _id: userId };
      default:
        return { _id: { $exists: false } }; // No access to other data
    }
  }

  // Default: no access
  return { _id: { $exists: false } };
}

// Middleware to check if user can access specific resource
export const checkResourceAccess = (modelType: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.admin.role;
    const userId = req.admin._id;
    const resourceId = req.params.id;

    // Super Admin has access to everything
    if (userRole === 'super_admin') {
      return next();
    }

    // For other roles, check if they can access this specific resource
    const filter = getDataFilterForRole(userRole, userId, modelType);
    
    // Add resource ID to filter
    const resourceFilter = { ...filter, _id: resourceId };
    
    // Store the resource filter for use in controller
    req.resourceFilter = resourceFilter;
    
    next();
  };
};

// Helper function to apply pagination with role-based filtering
export const applyPaginationWithFilter = (req: AuthRequest, baseQuery: any, modelType: string) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Apply role-based filter
  const filter = req.dataFilter?.getFilter(modelType) || {};
  const filteredQuery = { ...baseQuery, ...filter };

  // Data filtering applied successfully

  return {
    query: filteredQuery,
    pagination: {
      page,
      limit,
      skip
    }
  };
};

// Middleware to ensure user can only create resources they own
export const enforceOwnership = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const userRole = req.admin.role;
  const userId = req.admin._id;

  // Super Admin can create anything
  if (userRole === 'super_admin') {
    return next();
  }

  // For other roles, ensure they can only create resources they own
  if (userRole === 'admin' || userRole === 'seller') {
    // Set createdBy to current user
    req.body.createdBy = userId;
  }

  // Sub-Admin and Customer have limited creation rights
  if (userRole === 'sub_admin') {
    // Sub-Admin can only create support tickets and responses
    const allowedPaths = ['/support', '/support-response'];
    const currentPath = req.path;
    
    if (!allowedPaths.some(path => currentPath.includes(path))) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create this resource'
      });
    }
  }

  if (userRole === 'customer') {
    // Customer can only create orders and support tickets
    const allowedPaths = ['/orders', '/support'];
    const currentPath = req.path;
    
    if (!allowedPaths.some(path => currentPath.includes(path))) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to create this resource'
      });
    }
    
    req.body.userId = userId;
  }

  next();
};

export default {
  applyDataFilter,
  checkResourceAccess,
  applyPaginationWithFilter,
  enforceOwnership
};