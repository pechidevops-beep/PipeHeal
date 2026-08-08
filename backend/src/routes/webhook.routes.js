import { Router } from 'express';
import webhookController from '../controllers/webhook.controller.js';
import authController from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { webhookLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

/**
 * POST /api/v1/github/webhook
 * GitHub sends events here. Rate-limited + signature-verified + idempotent.
 */
router.post(
  '/webhook',
  webhookLimiter,
  asyncHandler(webhookController.githubWebhook)
);

/**
 * GET /api/v1/github/callback
 * GitHub redirects here after OAuth authorization.
 */
router.get('/callback', asyncHandler(authController.githubCallback));

export default router;
