import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: any,
  next: any
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret as string) as any;
    
    req.user = {
      userId: decoded.id,
      id: decoded.id,
      phone: decoded.phone,
      isVerified: decoded.isVerified
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: any,
  next: any
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        try {
          const decoded = jwt.verify(token, jwtSecret as string) as any;
          req.user = {
            userId: decoded.id,
            id: decoded.id,
            phone: decoded.phone,
            isVerified: decoded.isVerified
          };
        } catch (error) {
          // Ignore token errors for optional auth
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
};

export const requireVerification = (
  req: AuthenticatedRequest,
  res: any,
  next: any
): void => {
  // Temporarily allow all authenticated users to access cart/wishlist
  // TODO: Implement proper phone verification flow
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }
  next();
};