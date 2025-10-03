import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin';
import { AuthRequest } from '../types';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔐 Auth middleware - Request URL:', req.originalUrl);
    const authHeader = req.header('Authorization');
    console.log('🔐 Auth middleware - Authorization header:', authHeader);
    const token = authHeader?.replace('Bearer ', '');
    console.log('🔐 Auth middleware - Token present:', !!token);
    console.log('🔐 Auth middleware - Extracted token length:', token?.length || 0);

    if (!token) {
      console.log('🔐 Auth middleware - No token provided');
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    console.log('🔐 Auth middleware - JWT_SECRET:', process.env.JWT_SECRET);
    console.log('🔐 Auth middleware - Token to verify:', token.substring(0, 50) + '...');
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
      console.log('🔐 Auth middleware - Token decoded successfully, user ID:', decoded.id);
      console.log('🔐 Auth middleware - Decoded token payload:', JSON.stringify(decoded, null, 2));
    } catch (jwtError: any) {
      console.log('🔐 Auth middleware - JWT verification failed:', jwtError.message);
      console.log('🔐 Auth middleware - JWT error name:', jwtError.name);
      throw jwtError;
    }
    
    // Use id from token and Admin model
    const admin = await Admin.findById(decoded.id).select('-password');
    console.log('🔐 Auth middleware - Admin found:', admin ? `${admin.email} (${admin.role})` : 'null');

    if (!admin) {
      console.log('🔐 Auth middleware - Admin not found');
      res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found.'
      });
      return;
    }

    if (!admin.isActive) {
      console.log('🔐 Auth middleware - Admin account deactivated');
      res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
      return;
    }

    // Check if admin has valid admin role
    if (!['super_admin', 'admin', 'sub_admin'].includes(admin.role)) {
      console.log('🔐 Auth middleware - Invalid role:', admin.role);
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }
    console.log('🔐 Auth middleware - Authentication successful, proceeding to controller');
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
    return;
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.admin) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Admin authentication required.'
    });
    return;
  }

  next();
};

export const superAdminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.admin || req.admin.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.'
    });
    return;
  }

  next();
};

export const managerOrAbove = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.admin || !['admin', 'super_admin'].includes(req.admin.role)) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Manager privileges or above required.'
    });
    return;
  }

  next();
};