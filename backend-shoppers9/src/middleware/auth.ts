import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';
import { AppError } from './errorHandler';
import mongoose from 'mongoose';

// Import Admin model for admin authentication - matching admin backend schema
const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  role: { type: String, enum: ['super_admin', 'admin', 'moderator'], default: 'moderator' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  refreshToken: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
}, {
  timestamps: true
})

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

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
      userId: decoded.userId || decoded.id,
      id: decoded.userId || decoded.id,
      phone: decoded.phone,
      email: decoded.email,
      role: decoded.role || 'user',
      authMethod: decoded.authMethod,
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
            email: decoded.email || `user${decoded.id}@example.com`,
            role: 'user',
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

// New middleware for support operations that accepts both user and admin tokens
export const authenticateUserOrAdmin = async (
  req: AuthenticatedRequest,
  res: any,
  next: any
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Access token required', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, jwtSecret as string) as any;
    
    // Try to find admin first
    try {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (admin && admin.isActive) {
        req.user = {
          userId: decoded.id,
          id: decoded.id,
          email: admin.email || `admin${decoded.id}@example.com`,
          role: admin.role || 'admin',
          phone: admin.phone,
          isVerified: true,
          isAdmin: true,
          adminRole: admin.role
        };
        return next();
      }
    } catch (adminError) {
      // Admin not found, try user authentication
    }
    
    // If not admin, treat as regular user
    req.user = {
      userId: decoded.id,
      id: decoded.id,
      email: decoded.email || `user${decoded.id}@example.com`,
      role: 'user',
      phone: decoded.phone,
      isVerified: decoded.isVerified,
      isAdmin: false
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