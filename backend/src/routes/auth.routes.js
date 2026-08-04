import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, refreshTokenSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/github', asyncHandler(authController.getGithubAuthUrl));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.githubLogin));
router.post('/refresh', validate(refreshTokenSchema), asyncHandler(authController.refreshToken));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));

export default router;
