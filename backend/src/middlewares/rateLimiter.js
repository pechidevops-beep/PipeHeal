import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * General API rate limiter.
 * Applied to all /api/* routes.
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // default: 15 minutes
  max: env.RATE_LIMIT_MAX,            // default: 100 requests per window
  standardHeaders: true,              // Return RateLimit-* headers
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
    timestamp: new Date().toISOString(),
  },
  skip: () => env.isDevelopment,      // Disable in development
});

/**
 * Strict limiter for auth endpoints.
 * 10 attempts per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    code: 'RATE_LIMITED',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    timestamp: new Date().toISOString(),
  },
  skip: () => env.isDevelopment,
});

/**
 * Strict limiter for AI/sandbox endpoints.
 * 20 requests per hour.
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    code: 'RATE_LIMITED',
    message: 'AI analysis rate limit reached. Please try again in an hour.',
    timestamp: new Date().toISOString(),
  },
  skip: () => env.isDevelopment,
});
