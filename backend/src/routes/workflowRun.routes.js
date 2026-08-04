import { Router } from 'express';
import workflowRunController from '../controllers/workflowRun.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(workflowRunController.listRuns));
router.get('/:id', asyncHandler(workflowRunController.getRun));

export default router;
