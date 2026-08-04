import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import ERROR_CODES from '../constants/errorCodes.js';
import { env } from '../config/env.js';

/**
 * Global error handling middleware.
 * Must be registered LAST — after all routes.
 * Never crashes the server — always returns a JSON response.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  // Default to 500
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || ERROR_CODES.INTERNAL_ERROR;
  let details = err.details || null;

  // ── Prisma errors ──────────────────────────────────────────────────────────
  if (err.constructor?.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') {
      // Unique constraint violation
      statusCode = 409;
      message = 'A record with that value already exists';
      code = ERROR_CODES.ALREADY_EXISTS;
    } else if (err.code === 'P2025') {
      // Record not found
      statusCode = 404;
      message = 'Record not found';
      code = ERROR_CODES.NOT_FOUND;
    } else {
      statusCode = 400;
      message = 'Database operation failed';
      code = ERROR_CODES.DB_ERROR;
    }
  }

  // ── Zod validation errors ──────────────────────────────────────────────────
  if (err.name === 'ZodError') {
    statusCode = 422;
    message = 'Validation failed';
    code = ERROR_CODES.VALIDATION_ERROR;
    details = err.errors?.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
  }

  // ── JWT errors ─────────────────────────────────────────────────────────────
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = ERROR_CODES.INVALID_TOKEN;
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = ERROR_CODES.TOKEN_EXPIRED;
  }

  // ── Log ────────────────────────────────────────────────────────────────────
  const logPayload = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
    message,
    userId: req.user?.id,
    stack: err.stack,
  };

  if (statusCode >= 500) {
    logger.error('[Error]', logPayload);
  } else {
    logger.warn('[Error]', logPayload);
  }

  // ── Response ───────────────────────────────────────────────────────────────
  const body = {
    success: false,
    statusCode,
    code,
    message,
    timestamp: new Date().toISOString(),
  };

  if (details) body.details = details;

  // Only include stack trace in development
  if (!env.isProduction && err.stack) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
};

export default errorHandler;
