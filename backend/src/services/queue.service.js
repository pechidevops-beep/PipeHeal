import { Queue } from 'bullmq';
import logger from '../utils/logger.js';

// Setup Redis connection options
export const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

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
