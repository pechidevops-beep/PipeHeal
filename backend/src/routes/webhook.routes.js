import { Router } from 'express';
import express from 'express';
import webhookController from '../controllers/webhook.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

/**
 * POST /api/v1/github/webhook
 * GitHub sends events here. Needs raw body for signature verification.
 */
router.post(
  '/webhook',
  asyncHandler(webhookController.githubWebhook)
);

import authController from '../controllers/auth.controller.js';

/**
 * GET /api/v1/github/callback
 * GitHub redirects here after OAuth authorization.
 * Passes the code to the frontend which exchanges it via POST /auth/login.
 */
router.get('/callback', asyncHandler(authController.githubCallback));

export default router;
