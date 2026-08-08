import { env } from '../config/env.js';
import { db } from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const healthController = {
  async getHealth(req, res) {
    let dbStatus = 'disconnected';
    let redisStatus = 'not_configured';
    
    // ── Database Check ──────────────────────────────────────────────────────
    if (db) {
      try {
        await db.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch (err) {
        dbStatus = 'error';
      }
    }

    // ── Redis / Queue Check ─────────────────────────────────────────────────
    try {
      const { redisConnection } = await import('../services/queue.service.js');
      if (redisConnection) {
        const pingResult = await Promise.race([
          redisConnection.ping(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
        ]);
        redisStatus = pingResult === 'PONG' ? 'connected' : 'error';
      }
    } catch (err) {
      redisStatus = err.message === 'timeout' ? 'timeout' : 'unavailable';
    }

    const allHealthy = dbStatus === 'connected' && ['connected', 'not_configured'].includes(redisStatus);

    const data = {
      status: allHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      environment: env.NODE_ENV,
      services: {
        database: dbStatus,
        redis: redisStatus,
        github: env.githubConfigured ? 'configured' : 'mocked',
        ai: env.aiConfigured ? 'configured' : 'mocked',
      }
    };

    const statusCode = dbStatus === 'error' ? 503 : 200;
    return new ApiResponse(statusCode, data, 'Health check completed').send(res);
  }
};

export default healthController;
