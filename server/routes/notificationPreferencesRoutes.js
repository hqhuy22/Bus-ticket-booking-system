import express from 'express';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  resetNotificationPreferences,
  testEmailNotification,
} from '../controllers/notificationPreferencesController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/notification-preferences - Get current preferences
router.get('/', getNotificationPreferences);

// PUT /api/notification-preferences - Update preferences
router.put('/', updateNotificationPreferences);

// POST /api/notification-preferences/reset - Reset to defaults
router.post('/reset', resetNotificationPreferences);

// POST /api/notification-preferences/test-email - Send test email to own account
router.post('/test-email', testEmailNotification);

export default router;
