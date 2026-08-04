import dockerService from './docker.service.js';
import { db } from '../config/prisma.js';
import { emitToAll } from '../socket/handlers.js';
import { SOCKET_NAMESPACES } from '../constants/events.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';

export const sandboxService = {
  async runSandbox(incidentId, patchId, userId) {
    const incident = await db.incident.findUnique({
      where: { id: incidentId },
      include: {
        repository: true,
        workflowRun: true,
      }
    });

    if (!incident) throw new ApiError(404, 'Incident not found', ERROR_CODES.NOT_FOUND);

    let patch = null;
    if (patchId) {
      patch = await db.patch.findUnique({ where: { id: patchId } });
    } else {
      // Find the latest patch for this incident
      patch = await db.patch.findFirst({
        where: { incidentId },
        orderBy: { createdAt: 'desc' }
      });
    }

    await db.incident.update({ where: { id: incidentId }, data: { status: 'VERIFYING' } });

    // Create SandboxRun record
    const run = await db.sandboxRun.create({
      data: {
        incidentId,
        patchId: patch?.id,
        image: 'node:20-alpine',
        status: 'RUNNING',
      }
    });

    emitToAll(SOCKET_NAMESPACES.INCIDENTS, 'sandbox_started', run);
    
    // Create activity
    const startedActivity = await db.activity.create({
      data: {
        eventType: 'sandbox_started',
        title: 'Sandbox Verification Started',
        description: 'Provisioning Docker container and applying patch.',
        incidentId,
        userId,
      }
    });
    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', startedActivity);

    // Run verification asynchronously (fire-and-forget for this endpoint)
    this.executeSandboxAsync(run.id, incident, patch, userId).catch(err => {
      logger.error(`[Sandbox] Async execution failed: ${err.message}`);
    });

    return run;
  },

  async executeSandboxAsync(runId, incident, patch, userId) {
    const startTime = Date.now();
    let containerId = null;
    let finalStatus = 'FAILED';
    let combinedLogs = '';
    let exitCode = 1;

    try {
      containerId = await dockerService.createContainer('node:20-alpine');
      await db.sandboxRun.update({ where: { id: runId }, data: { containerId } });

      const repoFullName = incident.repository.fullName;
      const commitSha = incident.workflowRun.headSha;

      await dockerService.copyRepository(containerId, repoFullName, commitSha);

      if (patch && patch.diff) {
        await dockerService.applyPatch(containerId, patch.diff);
      }

      // We need a test command, fallback to "npm test"
      const testCommand = incident.errorCommand || 'npm test';
      const results = await dockerService.runTests(containerId, testCommand);
      
      exitCode = results.exitCode;
      finalStatus = exitCode === 0 ? 'PASSED' : 'FAILED';
      combinedLogs = results.stdout + '\\n' + results.stderr;

    } catch (err) {
      finalStatus = 'ERROR';
      combinedLogs = err.message;
      if (containerId) {
        try {
          const containerLogs = await dockerService.collectLogs(containerId);
          combinedLogs += '\\n--- Container Logs ---\\n' + containerLogs;
        } catch (e) {}
      }
    } finally {
      if (containerId) {
        await dockerService.destroyContainer(containerId);
      }
      
      const duration = Date.now() - startTime;

      const updatedRun = await db.sandboxRun.update({
        where: { id: runId },
        data: {
          status: finalStatus,
          exitCode,
          logs: combinedLogs,
          duration,
          completedAt: new Date(),
        }
      });

      await db.incident.update({
        where: { id: incident.id },
        data: { 
          status: finalStatus === 'PASSED' ? 'VERIFIED' : 'VERIFICATION_FAILED' 
        }
      });

      emitToAll(SOCKET_NAMESPACES.INCIDENTS, 'sandbox_completed', updatedRun);

      const completedActivity = await db.activity.create({
        data: {
          eventType: 'sandbox_completed',
          title: `Sandbox Verification ${finalStatus}`,
          description: `Verification ${finalStatus.toLowerCase()} in ${duration}ms.`,
          incidentId: incident.id,
          userId,
        }
      });
      emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', completedActivity);
    }
  }
};

export default sandboxService;
