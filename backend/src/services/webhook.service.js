import githubService from './github.service.js';
import workflowRunRepo from '../repositories/workflowRun.repository.js';
import repositoryRepo from '../repositories/repository.repository.js';
import { db } from '../config/prisma.js'; // to access Prisma directly for activities, or use a repo
import { emitToAll } from '../socket/handlers.js';
import { SOCKET_NAMESPACES } from '../constants/events.js';
import { logger } from '../utils/logger.js';
import { parseFailedLogs } from '../utils/logParser.js';
import incidentService from './incident.service.js';
import aiService from './ai.service.js';

export const webhookService = {
  /**
   * Processes incoming GitHub webhooks asynchronously.
   */
  async processWebhook(event, payload) {
    logger.info(`[Webhook] Processing event: ${event}`);

    // Track the webhook reception
    const repoFullName = payload.repository?.full_name;
    const dbRepo = repoFullName ? await repositoryRepo.findByFullName(repoFullName) : null;
    
    // Create generic or specific activity based on event type
    if (dbRepo) {
      let title = 'Webhook Received';
      let description = `Received ${event} event from GitHub.`;
      
      if (event === 'push') {
        const pusher = payload.pusher?.name || payload.sender?.login || 'Someone';
        const commitsCount = payload.commits?.length || 0;
        const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'unknown';
        title = 'Code Pushed';
        description = `${pusher} pushed ${commitsCount} commit(s) to ${branch}.`;
      } else if (event === 'pull_request') {
        const action = payload.action;
        const pr = payload.pull_request;
        title = `Pull Request ${action}`;
        description = `PR #${pr.number}: ${pr.title}`;
      } else if (event === 'deployment_status') {
        const state = payload.deployment_status?.state;
        const env = payload.deployment?.environment;
        title = `Deployment: ${env}`;
        description = `Deployment status is now ${state}.`;
      } else if (event === 'workflow_job') {
        const job = payload.workflow_job;
        title = `Job: ${job.name}`;
        description = `Job status is ${job.status} (${job.conclusion || 'running'}).`;
      }

      const activity = await db.activity.create({
        data: {
          eventType: event,
          title,
          description,
          metadata: { event, action: payload.action, repo: repoFullName },
        }
      });
      emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', activity);
    }

    if (event === 'workflow_run') {
      await this.processWorkflowRunUpdate(payload, dbRepo);
    }
  },

  async processWorkflowRunUpdate(payload, dbRepo) {
    if (!dbRepo) {
      logger.debug(`[Webhook] Ignoring untracked repo: ${payload.repository.full_name}`);
      return;
    }

    const run = payload.workflow_run;

    // Ignore runs on PipeHeal's own auto-fix branches to prevent recursive loops
    if (run.head_branch && run.head_branch.startsWith('pipeheal-fix-')) {
      logger.info(`[Webhook] Ignoring workflow run on auto-fix branch: ${run.head_branch}`);
      return;
    }

    // Fetch jobs for this workflow to calculate duration and store them if needed
    let jobsData = [];
    let rawLogs = '';

    const isTerminal = payload.action === 'completed' || run.status === 'completed';

    if (isTerminal) {
      let token = process.env.GITHUB_CLIENT_SECRET; // Fallback
      if (dbRepo.user?.githubAccessToken) {
        try {
          const { decryptToken } = await import('../utils/crypto.js');
          token = decryptToken(dbRepo.user.githubAccessToken);
        } catch (e) {
          logger.warn(`[Webhook] Failed to decrypt user token for log download: ${e.message}`);
        }
      }
      
      try {
        const jobsRes = await githubService.getJobs(dbRepo.owner, dbRepo.name, run.id, token);
        jobsData = jobsRes.jobs || [];
      } catch (err) {
        logger.warn(`[Webhook] Could not fetch jobs for run ${run.id}: ${err.message}`);
      }

      try {
        rawLogs = await githubService.downloadWorkflowLogs(dbRepo.owner, dbRepo.name, run.id, token);
      } catch (err) {
        logger.warn(`[Webhook] Could not fetch logs for run ${run.id}: ${err.message}`);
      }
    }

    let status = run.status;
    if (status === 'queued') status = 'QUEUED';
    else if (status === 'in_progress') status = 'IN_PROGRESS';
    else if (status === 'completed') status = 'COMPLETED';
    else if (status === 'waiting') status = 'WAITING';
    else if (status === 'requested') status = 'REQUESTED';
    else if (status === 'pending') status = 'PENDING';
    else status = 'QUEUED';

    // Calculate duration from jobs or run
    const startedAt = run.run_started_at ? new Date(run.run_started_at) : null;
    const completedAt = run.updated_at ? new Date(run.updated_at) : new Date();
    const durationMs = startedAt ? completedAt.getTime() - startedAt.getTime() : 0;

    const data = {
      workflowId: run.workflow_id,
      workflowName: run.name,
      headBranch: run.head_branch,
      headSha: run.head_sha,
      event: run.event,
      status,
      conclusion: run.conclusion,
      htmlUrl: run.html_url,
      repositoryId: dbRepo.id,
      startedAt,
      completedAt,
    };

    if (isTerminal) {
      data.logsUrl = run.logs_url;
      data.rawLogs = rawLogs;
      data.parsedMetadata = {
        jobsCount: jobsData.length,
        durationMs,
        actor: run.actor?.login,
      };

      const dbRun = await workflowRunRepo.upsert(run.id, data);

      // delete existing steps to prevent duplicates?
      await db.pipelineStep.deleteMany({ where: { workflowRunId: dbRun.id } });

      for (const job of jobsData) {
        for (const step of (job.steps || [])) {
          await db.pipelineStep.create({
            data: {
              githubStepId: step.number,
              jobId: job.id,
              jobName: job.name,
              stepName: step.name,
              status: step.status.toUpperCase() === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
              conclusion: step.conclusion,
              number: step.number,
              workflowRunId: dbRun.id,
              startedAt: step.started_at ? new Date(step.started_at) : null,
              completedAt: step.completed_at ? new Date(step.completed_at) : null,
            }
          });
        }
      }

      logger.info(`[Webhook] Stored completed workflow run ${dbRun.id} with logs.`);

      // Emit workflow_received
      emitToAll(SOCKET_NAMESPACES.PIPELINES, 'workflow_received', dbRun);

      // Activity tracking
      const activity = await db.activity.create({
        data: {
          eventType: 'workflow_downloaded',
          title: 'Workflow Logs Downloaded',
          description: `Logs and jobs fetched for workflow run ${run.name}`,
          workflowId: dbRun.id,
        },
        include: {
          workflowRun: { select: { workflowName: true, headBranch: true, status: true, headSha: true } }
        }
      });
      emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', activity);

      // Milestone 4: Trigger AI Incident Engine on Failure
      if (run.conclusion === 'failure' || run.conclusion === 'timed_out') {
        const parsedLogData = parseFailedLogs(rawLogs, jobsData);
        
        let lockAcquired = false;
        try {
          // Use advisory lock to prevent duplicate incidents if GitHub sends duplicate events
          const lockResult = await db.$queryRaw`SELECT pg_try_advisory_lock(hashtext(${dbRun.id})) as acquired`;
          lockAcquired = lockResult?.[0]?.acquired;

          if (lockAcquired) {
            const existingIncident = await db.incident.findFirst({
              where: { workflowRunId: dbRun.id }
            });

            if (!existingIncident) {
              // Create an incident
              const incidentData = {
                title: `Pipeline Failed: ${run.name}`,
                description: `Failed at ${parsedLogData.errorMessage}`,
                severity: 'HIGH',
                status: 'DIAGNOSING',
                errorCategory: parsedLogData.errorType,
                errorMessage: parsedLogData.errorMessage,
                repositoryId: dbRepo.id,
                workflowRunId: dbRun.id,
              };
      
              const incident = await incidentService.createIncident(incidentData, null);

              // Emit new incident
              emitToAll(SOCKET_NAMESPACES.INCIDENTS, 'incident_created', incident);

              // Async trigger AI
              aiService.diagnoseFailure(parsedLogData).then(async (diagnosis) => {
                await db.diagnosis.create({
                  data: {
                    rootCause: diagnosis.root_cause,
                    summary: diagnosis.summary,
                    failureType: diagnosis.failure_type,
                    suggestedFix: diagnosis.suggested_fix,
                    autoFixable: diagnosis.auto_fixable,
                    confidence: parseFloat(diagnosis.confidence) || 0.8,
                    aiModel: aiService.getProvider(),
                    rawResponse: diagnosis,
                    incidentId: incident.id,
                  }
                });
                
                await incidentService.updateIncident(incident.id, { status: 'OPEN' }, null);
                const updatedIncident = await incidentService.getIncident(incident.id);
                emitToAll(SOCKET_NAMESPACES.INCIDENTS, 'incident_updated', updatedIncident);
                
                // Activity for diagnosis
                const diagActivity = await db.activity.create({
                  data: {
                    eventType: 'diagnosis_completed',
                    title: 'AI Diagnosis Ready',
                    description: `AI diagnosed incident #${incident.id.substring(0, 6)}`,
                    incidentId: incident.id,
                  }
                });
                emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', diagActivity);

                // Trigger Auto-Fix if enabled and auto_fixable
                if (dbRepo.autoFixEnabled && diagnosis.auto_fixable) {
                  logger.info(`[Webhook] Auto-Fix is enabled for ${dbRepo.fullName}. Enqueuing patch generation job...`);
                  try {
                    const { autoFixQueue } = await import('./queue.service.js');
                  
                    await autoFixQueue.add('generate-patch', {
                      incidentId: incident.id,
                      userId: dbRepo.userId,
                      token: token,
                      filePath: '.github/workflows/pipeheal-test.yml' // Can be parsed dynamically later
                    });
                  
                    logger.info(`[Webhook] Job enqueued successfully for incident ${incident.id}`);
                  } catch (err) {
                    logger.error(`[Webhook] Failed to start auto-fix: ${err.message}`);
                  }
                }
              }).catch(err => {
                logger.error(`[Webhook] AI diagnosis failed: ${err.message}`);
                incidentService.updateIncident(incident.id, { status: 'OPEN' }, null);
              });
            }
          } else {
            logger.info(`[Webhook] Duplicate terminal event for run ${dbRun.id} is already being processed. Skipping.`);
          }
        } finally {
          if (lockAcquired) {
            await db.$queryRaw`SELECT pg_advisory_unlock(hashtext(${dbRun.id}))`.catch(() => {});
          }
        }
      }

      } else {
      // Just update status for requested / in_progress without fetching logs
      const dbRun = await workflowRunRepo.upsert(run.id, data);
      logger.info(`[Webhook] Updated workflow run ${dbRun.id} status to ${status}`);
      emitToAll(SOCKET_NAMESPACES.PIPELINES, 'workflow_received', dbRun);
    }
  }
};

export default webhookService;
