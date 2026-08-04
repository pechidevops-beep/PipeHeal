import { Worker } from 'bullmq';
import { redisConnection } from './queue.service.js';
import incidentService from './incident.service.js';
import logger from '../utils/logger.js';

const workerOptions = {
  connection: redisConnection,
  concurrency: 5, // Process up to 5 Auto-Fixes concurrently
};

export const autoFixWorker = new Worker(
  'AutoFixQueue',
  async (job) => {
    logger.info(`[Worker] Processing Auto-Fix Job ID: ${job.id}`);
    
    const { incidentId, userId, token, filePath } = job.data;
    
    try {
      // Execute the heavy I/O bound Auto-Fix pipeline
      const result = await incidentService.generatePatchAndPR(incidentId, userId, token, filePath);
      logger.info(`[Worker] Job ${job.id} completed. PR Created: ${result.prUrl}`);
      return result;
    } catch (error) {
      logger.error(`[Worker] Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  },
  workerOptions
);

autoFixWorker.on('completed', (job, returnvalue) => {
  logger.info(`[Worker] Job with id ${job.id} has been completed.`);
});

autoFixWorker.on('failed', (job, error) => {
  logger.error(`[Worker] Job with id ${job.id} has failed with ${error.message}`);
});

logger.info('[Worker] AutoFixWorker started listening for jobs');
