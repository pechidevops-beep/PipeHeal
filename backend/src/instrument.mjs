// ── Sentry Instrumentation ────────────────────────────────────────────────────
// This file MUST be imported before anything else in server.js / worker entry.
// It initializes Sentry so all errors, performance traces, and logs are captured.

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import 'dotenv/config';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Capture 100% of transactions in dev, 10% in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 1.0,
    // Send structured logs to Sentry
    enableLogs: true,
    environment: process.env.NODE_ENV || 'development',
    // Don't leak sensitive data
    beforeSend(event) {
      // Strip any cookie / authorization header values from breadcrumbs
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-hub-signature-256'];
      }
      return event;
    },
  });
  console.log('[Sentry] Initialized — error tracking active');
} else {
  console.log('[Sentry] DSN not set — error tracking disabled');
}

export default Sentry;
