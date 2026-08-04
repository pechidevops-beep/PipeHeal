import express from 'express';
import knowledgeBaseController from '../controllers/knowledgeBase.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

router.use(authenticate);

// List knowledge base entries for a repository
router.get('/', asyncHandler(knowledgeBaseController.listEntries));

export default router;
