import cron from 'node-cron';
import { checkLowStockAndNotify, cleanupOldNotifications } from '../controllers/notificationController';

// Schedule low stock check every hour
export const startLowStockChecker = () => {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('Running low stock check...');
    try {
      await checkLowStockAndNotify();
      console.log('Low stock check completed successfully');
    } catch (error) {
      console.error('Error during low stock check:', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('Low stock checker scheduled to run every hour');
};

// Schedule cleanup of old notifications daily at 2 AM
export const startNotificationCleanup = () => {
  // Run daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('Running notification cleanup...');
    try {
      await cleanupOldNotifications();
      console.log('Notification cleanup completed successfully');
    } catch (error) {
      console.error('Error during notification cleanup:', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('Notification cleanup scheduled to run daily at 2:00 AM');
};

// Start all scheduled jobs
export const startScheduler = () => {
  startLowStockChecker();
  startNotificationCleanup();
  console.log('All notification schedulers started');
};