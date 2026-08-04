import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(dashboardController.getDashboard));

export default router;
