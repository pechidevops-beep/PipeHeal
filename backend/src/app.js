import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { env } from './config/env.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { apiLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { metricsMiddleware } from './middlewares/metrics.middleware.js';
import routes from './routes/index.js';

const app = express();

// ── Security & Utility Middleware ────────────────────────────────────────────
app.use(helmet()); // Set security HTTP headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    const allowed = env.ALLOWED_ORIGINS;
    if (allowed.includes(origin) || env.isDevelopment) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`), false);
  },
  credentials: true,
}));
app.use(compression()); // Compress response bodies

// ── Webhooks (Need raw body) ────────────────────────────────────────────────
// The raw body is captured via the verify option in express.json() below.

// ── Standard Body Parsers ───────────────────────────────────────────────────
import cookieParser from 'cookie-parser';
app.use(cookieParser());

app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/api/v1/github/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// ── Logging & Rate Limiting ─────────────────────────────────────────────────
app.use(requestLogger);
app.use(metricsMiddleware);
app.use('/api', apiLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    code: 'NOT_FOUND',
    message: `Cannot find ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// ── Global Error Handler ────────────────────────────────────────────────────
import * as Sentry from '@sentry/node';
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

export default app;
