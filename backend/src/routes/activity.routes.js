import { Router } from 'express';
import activityController from '../controllers/activity.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', authenticate, asyncHandler(activityController.getActivities));

export default router;
