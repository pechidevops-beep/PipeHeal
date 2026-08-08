import { Worker } from 'bullmq';
import { redisConnection } from './queue.service.js';
import incidentService from './incident.service.js';
import { db } from '../config/prisma.js';
import logger from '../utils/logger.js';

const workerOptions = {
  connection: redisConnection,
  concurrency: 2, // Keep low — Gemini free tier has strict per-minute rate limits
  lockDuration: 300000, // 5 min lock per job (AI + patch can take a while)
};

export const autoFixWorker = new Worker(
  'AutoFixQueue',
  async (job) => {
    const { incidentId, userId, token, filePath } = job.data;
    const logPrefix = `[Worker][job=${job.id}][incident=${incidentId?.substring(0, 8)}]`;

    logger.info(`${logPrefix} Starting Auto-Fix pipeline`);

    // ── Per-Repo Advisory Lock ──────────────────────────────────────────────
    // Prevents two AI agents patching the same repo simultaneously.
    let repoId = null;
    try {
      const incident = await db.incident.findUnique({
        where: { id: incidentId },
        select: { repositoryId: true, status: true },
      });

      if (!incident) {
        logger.warn(`${logPrefix} Incident not found — skipping`);
        return;
      }

      // Skip if already resolved or being processed
      if (['RESOLVED', 'CLOSED'].includes(incident.status)) {
        logger.info(`${logPrefix} Incident already ${incident.status} — skipping`);
        return;
      }

      repoId = incident.repositoryId;

      // Try to acquire advisory lock for this repo (non-blocking)
      const lockResult = await db.$queryRaw`
        SELECT pg_try_advisory_lock(hashtext(${repoId})) as acquired
      `;
      const lockAcquired = lockResult?.[0]?.acquired;

      if (!lockAcquired) {
        logger.warn(`${logPrefix} Could not acquire advisory lock for repo ${repoId} — another job is running. Will retry.`);
        throw new Error('Advisory lock not available — another patch job is running for this repo');
      }

      logger.info(`${logPrefix} Advisory lock acquired for repo ${repoId}`);
    } catch (lockErr) {
      if (lockErr.message.includes('Advisory lock')) throw lockErr;
      logger.warn(`${logPrefix} Advisory lock check failed (non-fatal): ${lockErr.message}`);
    }

    const startTime = Date.now();

    try {
      // Update incident to show it's being processed
      await db.incident.update({
        where: { id: incidentId },
        data: { status: 'PATCH_GENERATED' },
      }).catch(() => {}); // Non-fatal

      logger.info(`${logPrefix} Calling generatePatchAndPR`);
      const result = await incidentService.generatePatchAndPR(incidentId, userId, token, filePath);
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      logger.info(`${logPrefix} Completed in ${elapsed}s. PR: ${result.prUrl}`);
      return result;
    } catch (error) {
      logger.error(`${logPrefix} Failed: ${error.message}`);
      // Mark incident as OPEN (failed patch — user can retry manually)
      await db.incident.update({
        where: { id: incidentId },
        data: { status: 'OPEN' },
      }).catch(() => {});
      throw error;
    } finally {
      // Release advisory lock
      if (repoId) {
        await db.$queryRaw`SELECT pg_advisory_unlock(hashtext(${repoId}))`.catch(() => {});
        logger.info(`${logPrefix} Advisory lock released for repo ${repoId}`);
      }
    }
  },
  workerOptions
);

autoFixWorker.on('completed', (job) => {
  logger.info(`[Worker] Job ${job.id} completed successfully`);
});

autoFixWorker.on('failed', (job, error) => {
  logger.error(`[Worker] Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${error.message}`);
});

autoFixWorker.on('stalled', (jobId) => {
  logger.warn(`[Worker] Job ${jobId} stalled — will be re-queued automatically`);
});

autoFixWorker.on('error', (err) => {
  logger.warn(`[Worker] Worker error: ${err.message}`);
});

logger.info('[Worker] AutoFixWorker started — concurrency: 2');
