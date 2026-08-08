import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema, registerSchema, githubCallbackSchema } from '../validators/auth.validator.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Rate limiting for auth routes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts
  message: "Too many attempts, try again later"
});

router.post('/register', authLimiter, validate(registerSchema), asyncHandler(authController.register));
router.post('/login', authLimiter, validate(loginSchema), asyncHandler(authController.login));
router.post('/refresh', asyncHandler(authController.refreshToken));
router.post('/logout', authenticate, asyncHandler(authController.logout));
router.get('/me', authenticate, asyncHandler(authController.getMe));

router.get('/github', asyncHandler(authController.getGithubAuthUrl));
router.get('/github/callback', asyncHandler(authController.githubCallback));

export default router;
