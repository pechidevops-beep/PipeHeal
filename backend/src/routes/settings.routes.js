import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// Profile
router.get('/profile', asyncHandler(settingsController.getProfile));
router.patch('/profile', asyncHandler(settingsController.updateProfile));

// Account & Security
router.patch('/password', asyncHandler(settingsController.updatePassword));
router.delete('/github', asyncHandler(settingsController.disconnectGithub));
router.post('/logout-all', asyncHandler(settingsController.logoutAll));
router.delete('/account', asyncHandler(settingsController.deleteAccount));

// AI Providers
router.post('/ai-providers/test', asyncHandler(settingsController.testAiProvider));

// Notifications
router.get('/notifications', asyncHandler(settingsController.getNotifications));
router.patch('/notifications', asyncHandler(settingsController.updateNotifications));

// Usage
router.get('/usage', asyncHandler(settingsController.getUsage));

export default router;
