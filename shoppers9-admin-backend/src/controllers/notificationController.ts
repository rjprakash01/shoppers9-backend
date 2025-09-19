import { Request, Response } from 'express';
import { Notification, NotificationType, INotification } from '../models/Notification';
import Product from '../models/Product';

// Get all notifications with pagination
export const getNotifications = async (req: any, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    // Build query based on user role
    let query: any = {};
    
    if (req.admin) {
      const userRole = req.admin.primaryRole;
      const userId = req.admin._id.toString();
      
      if (userRole === 'super_admin') {
        // Super admin sees all notifications
        query = {};
      } else if (userRole === 'admin') {
        // Admin sees global notifications + their own seller-specific notifications
        query = {
          $or: [
            { isSellerSpecific: { $ne: true } }, // Global notifications
            { targetUserId: userId } // Their own notifications
          ]
        };
      } else {
        // Other roles see only global notifications
        query = { isSellerSpecific: { $ne: true } };
      }
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ ...query, isRead: false });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Get unread notifications count
export const getUnreadCount = async (req: any, res: Response) => {
  try {
    // Build query based on user role (same logic as getNotifications)
    let query: any = { isRead: false };
    
    if (req.admin) {
      const userRole = req.admin.primaryRole;
      const userId = req.admin._id.toString();
      
      if (userRole === 'super_admin') {
        // Super admin sees all unread notifications
        query = { isRead: false };
      } else if (userRole === 'admin') {
        // Admin sees global + their own unread notifications
        query = {
          isRead: false,
          $or: [
            { isSellerSpecific: { $ne: true } }, // Global notifications
            { targetUserId: userId } // Their own notifications
          ]
        };
      } else {
        // Other roles see only global unread notifications
        query = { isRead: false, isSellerSpecific: { $ne: true } };
      }
    }
    
    const count = await Notification.countDocuments(query);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    await Notification.updateMany(
      { isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Create notification (for testing or manual creation)
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { type, title, message, data } = req.body;

    const notification = new Notification({
      type,
      title,
      message,
      data: data || {}
    });

    await notification.save();

    res.status(201).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// Utility function to create notifications for various events
export const createNotificationForEvent = async (
  type: NotificationType,
  title: string,
  message: string,
  data?: any
): Promise<INotification | null> => {
  try {
    const notification = new Notification({
      type,
      title,
      message,
      data: data || {}
    });

    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Check for low stock products and create notifications
export const checkLowStockAndNotify = async () => {
  try {
    const lowStockProducts = await Product.find({
      isActive: true,
      'variants.stock': { $lte: 5, $gt: 0 }
    }).populate('category subCategory');

    for (const product of lowStockProducts) {
      const lowStockVariants = product.variants.filter((v: any) => v.stock <= 5 && v.stock > 0);
      
      for (const variant of lowStockVariants) {
        // Check if we already have a recent notification for this variant
        const existingNotification = await Notification.findOne({
          type: NotificationType.LOW_STOCK,
          'data.productId': product._id.toString(),
          'data.variantId': variant._id?.toString(),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (!existingNotification) {
          await createNotificationForEvent(
            NotificationType.LOW_STOCK,
            'Low Stock Alert',
            `${product.name} (${variant.color} - ${variant.size}) has only ${variant.stock} items left`,
            {
              productId: product._id.toString(),
              productName: product.name,
              variantId: variant._id?.toString(),
              color: variant.color,
              size: variant.size,
              stock: variant.stock
            }
          );
        }
      }
    }

    // Check for out of stock products
    const outOfStockProducts = await Product.find({
      isActive: true,
      'variants.stock': 0
    }).populate('category subCategory');

    for (const product of outOfStockProducts) {
      const outOfStockVariants = product.variants.filter((v: any) => v.stock === 0);
      
      for (const variant of outOfStockVariants) {
        // Check if we already have a recent notification for this variant
        const existingNotification = await Notification.findOne({
          type: NotificationType.OUT_OF_STOCK,
          'data.productId': product._id.toString(),
          'data.variantId': variant._id?.toString(),
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        });

        if (!existingNotification) {
          await createNotificationForEvent(
            NotificationType.OUT_OF_STOCK,
            'Out of Stock Alert',
            `${product.name} (${variant.color} - ${variant.size}) is now out of stock`,
            {
              productId: product._id.toString(),
              productName: product.name,
              variantId: variant._id?.toString(),
              color: variant.color,
              size: variant.size,
              stock: 0
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking low stock:', error);
  }
};

// Clean up old notifications (older than 30 days)
export const cleanupOldNotifications = async () => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await Notification.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    });

    console.log(`Cleaned up ${result.deletedCount} old notifications`);
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
  }
};