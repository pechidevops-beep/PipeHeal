import { Router } from 'express';
import pipelineController from '../controllers/pipeline.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(pipelineController.listPipelines));
router.get('/:id', asyncHandler(pipelineController.getPipeline));

export default router;
