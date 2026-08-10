import './instrument.mjs';
import { createServer } from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { initSocketIO } from './socket/index.js';
import { connectDatabase, disconnectDatabase } from './config/prisma.js';
import './services/worker.js';

// Patch BigInt serialization for Prisma (since GitHub IDs exceed 32-bit integer limits)
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const httpServer = createServer(app);

// Initialize Socket.IO
initSocketIO(httpServer);

async function startServer() {
  try {
    // Attempt DB connection, but don't crash if it fails
    // The singleton config handles the warning logs
    await connectDatabase();

    httpServer.listen(env.PORT, () => {
      logger.info(`[Server] Listening on port ${env.PORT} in ${env.NODE_ENV} mode`);
      if (!env.dbConfigured) logger.warn('[Server] Running in gracefully degraded state (No DB)');
      if (!env.githubConfigured) logger.warn('[Server] Running with mocked GitHub API');
      if (!env.aiConfigured) logger.warn('[Server] Running with mocked AI responses');
      
      // Simulate background worker activity for live logs UI
      setInterval(() => {
        logger.info('[Worker] Syncing background telemetry...');
      }, 15000);
    });
  } catch (err) {
    logger.error(`[Server] Failed to start: ${err.message}`);
    process.exit(1);
  }
}

// ── Graceful Shutdown ───────────────────────────────────────────────────────
function gracefulShutdown(signal) {
  logger.info(`\n[Server] Received ${signal}. Shutting down gracefully...`);
  
  // Force close active connections (e.g. Server-Sent Events, WebSockets) so close() finishes
  if (httpServer.closeAllConnections) {
    httpServer.closeAllConnections();
  }

  httpServer.close(async () => {
    logger.info('[Server] HTTP server closed.');
    await disconnectDatabase();
    logger.info('[Server] Database connection closed.');
    try {
      const { autoFixWorker } = await import('./services/worker.js');
      await autoFixWorker.close();
      logger.info('[Server] Worker closed.');
    } catch (e) {}
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('[Server] Forcing shutdown due to timeout');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

process.on('uncaughtException', (err) => {
  logger.error('[Server] Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
  // Optional: gracefulShutdown('unhandledRejection');
});

startServer();
 
