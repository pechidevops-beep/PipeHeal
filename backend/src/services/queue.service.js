import { Queue } from 'bullmq';
import Redis from 'ioredis';
import logger from '../utils/logger.js';

// Setup Redis connection
export const redisConnection = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null
    });

redisConnection.on('error', (err) => {
  logger.warn(`[Redis] Connection error: ${err.message}. Auto-fix worker will not run.`);
});

// Create the Auto-Fix Queue
export const autoFixQueue = new Queue('AutoFixQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true, // Automatically remove successful jobs to save memory
    removeOnFail: false,    // Keep failed jobs for inspection
  },
});

logger.info('[Queue Service] AutoFixQueue initialized and connected to Redis');
