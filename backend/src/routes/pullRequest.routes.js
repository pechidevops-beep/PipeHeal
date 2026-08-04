import { Router } from 'express';
import pullRequestController from '../controllers/pullRequest.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.post('/', asyncHandler(pullRequestController.createPullRequest));

export default router;
