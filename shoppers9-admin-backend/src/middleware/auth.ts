import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '../models/Admin';
import { AuthRequest } from '../types';

export const auth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    
    const admin = await Admin.findById(decoded.id).select('-password');

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found.'
      });
      return;
    }

    if (!admin.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
      return;
    }

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
  if (!req.admin || !['manager', 'super_admin'].includes(req.admin.role)) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Manager privileges or above required.'
    });
    return;
  }

  next();
};