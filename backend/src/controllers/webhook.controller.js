import webhookService from '../services/webhook.service.js';
import githubService from '../services/github.service.js';
import authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const webhookController = {
  /**
   * POST /api/v1/github/webhook
   * Receives GitHub webhook events, verifies signature, dispatches processing.
   */
  async githubWebhook(req, res) {
    const signature = req.headers['x-hub-signature-256'];
    const event = req.headers['x-github-event'];
    const rawBody = req.rawBody; // Captured by express.json({ verify })
    const payload = req.body; // Already parsed by express.json()

    if (!signature) {
      throw new ApiError(401, 'Missing webhook signature', ERROR_CODES.WEBHOOK_INVALID);
    }

    if (!rawBody) {
      throw new ApiError(400, 'Missing raw request body', ERROR_CODES.VALIDATION_ERROR);
    }

    const isValid = githubService.verifyWebhook(rawBody, signature);
    if (!isValid) {
      throw new ApiError(401, 'Invalid webhook signature', ERROR_CODES.WEBHOOK_INVALID);
    }

    // Fire and forget — don't block GitHub's response
    if (event === 'workflow_run' || event === 'workflow_job' || event === 'push' || event === 'pull_request') {
      webhookService.processWebhook(event, payload).catch((err) => {
        logger.error(`[Webhook] Async processing failed: ${err.message}`);
      });
    } else {
      logger.info(`[Webhook] Ignoring unhandled event type: ${event}`);
    }

    return ApiResponse.ok(res, null, 'Webhook received');
  },

  /**
   * GET /api/v1/github/callback
   * GitHub redirects here after the user authorizes the OAuth app.
   * We redirect to the frontend with the code so the frontend can exchange it.
   */
  async githubOAuthCallback(req, res) {
    const { code, error, error_description } = req.query;

    const frontendUrl = env.FRONTEND_URL || env.ALLOWED_ORIGINS?.[0] || 'http://localhost:5173';

    if (error) {
      logger.warn(`[OAuth] GitHub callback error: ${error} — ${error_description}`);
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
      return res.redirect(`${frontendUrl}/auth/callback?error=no_code`);
    }

    try {
      // Exchange code for token + user profile on the backend, return JWT
      const { user, tokens } = await authService.loginWithGitHub(code);
      const redirectUrl = `${frontendUrl}/auth/callback?token=${encodeURIComponent(tokens.accessToken)}&refresh=${encodeURIComponent(tokens.refreshToken)}&login=${encodeURIComponent(user.login)}`;
      return res.redirect(redirectUrl);
    } catch (err) {
      logger.error(`[OAuth] Token exchange failed: ${err.message}`);
      return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent('Authentication failed')}`);
    }
  },
};

export default webhookController;
