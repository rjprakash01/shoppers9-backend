import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User';
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
    
    // Use id from token and User model
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated.'
      });
      return;
    }

    // Check if user has valid admin role
    if (!['super_admin', 'admin', 'sub_admin'].includes(user.primaryRole)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }
    req.admin = user;
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
  if (!req.admin || req.admin.primaryRole !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Super admin privileges required.'
    });
    return;
  }

  next();
};

export const managerOrAbove = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.admin || !['admin', 'super_admin'].includes(req.admin.primaryRole)) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Manager privileges or above required.'
    });
    return;
  }

  next();
};