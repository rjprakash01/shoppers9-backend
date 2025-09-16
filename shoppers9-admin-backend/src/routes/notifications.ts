import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  checkLowStockAndNotify
} from '../controllers/notificationController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Create notification (public endpoint for service-to-service communication)
// This must be before any auth middleware
router.post('/', createNotification);

// Apply auth middleware to all subsequent routes
router.use(auth);

// Get all notifications
router.get('/', getNotifications);

// Get unread notifications count
router.get('/unread-count', getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllAsRead);

// Delete notification
router.delete('/:notificationId', deleteNotification);

// Trigger low stock check (for testing)
router.post('/check-low-stock', async (req, res) => {
  try {
    await checkLowStockAndNotify();
    res.json({
      success: true,
      message: 'Low stock check completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check low stock'
    });
  }
});

export default router;