import { env } from '../config/env.js';
import { db } from '../config/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const healthController = {
  async getHealth(req, res) {
    let dbStatus = 'disconnected';
    
    if (db) {
      try {
        await db.$queryRaw`SELECT 1`;
        dbStatus = 'connected';
      } catch (err) {
        dbStatus = 'error';
      }
    }

    const data = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      services: {
        database: dbStatus,
        github: env.githubConfigured ? 'configured' : 'mocked',
        ai: env.aiConfigured ? 'configured' : 'mocked',
      }
    };

    const statusCode = dbStatus === 'error' ? 503 : 200;
    return new ApiResponse(statusCode, data, 'Health check completed').send(res);
  }
};

export default healthController;
