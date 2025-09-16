import express from 'express';
import {
  getSettings,
  updateSettings,
  resetSettings,
  getSettingsHistory,
  getSettingsByCategory,
  updateSettingsByCategory,
  exportSettings,
  importSettings
} from '../controllers/settingsController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(auth);
router.use(adminOnly);

// Get current settings (admin only)
router.get('/', getSettings);

// Update settings
router.put('/', updateSettings);

// Reset settings to default
router.post('/reset', resetSettings);

// Get settings history
router.get('/history', getSettingsHistory);

// Export settings
router.get('/export', exportSettings);

// Import settings
router.post('/import', importSettings);

// Category-specific routes
router.get('/category/:category', getSettingsByCategory);
router.put('/category/:category', updateSettingsByCategory);

export default router;