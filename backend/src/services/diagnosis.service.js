import aiService from './ai.service.js';
import parserService from './parser.service.js';
import { db } from '../config/prisma.js';
import { emitToAll } from '../socket/handlers.js';
import { SOCKET_NAMESPACES } from '../constants/events.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';
import { logger } from '../utils/logger.js';

export const diagnosisService = {
  async runDiagnosis(workflowRunId, userId) {
    // 1. Fetch workflow run with raw logs
    const run = await db.workflowRun.findUnique({
      where: { id: workflowRunId },
      include: { incidents: { include: { repository: { include: { user: true } } } } }
    });
    if (!run) throw new ApiError(404, 'Workflow Run not found', ERROR_CODES.NOT_FOUND);

    // Make sure we have an incident to attach to, or create one if none exists (for Phase 3, 
    // it's best to ensure there's an incident since Diagnosis relates to Incident).
    let incident = run.incidents[0];

    // If logs are missing (e.g., from a partial sync), try downloading them now
    if (!run.rawLogs || run.rawLogs.trim() === '') {
      try {
        const repo = incident.repository;
        let token = process.env.GITHUB_CLIENT_SECRET;
        if (repo.user?.githubAccessToken) {
          const { decryptToken } = await import('../utils/crypto.js');
          token = decryptToken(repo.user.githubAccessToken);
        }
        const githubService = (await import('./github.service.js')).default;
        
        run.rawLogs = await githubService.downloadWorkflowLogs(repo.owner, repo.name, run.githubRunId.toString(), token);
        
        // Save back to DB
        await db.workflowRun.update({
          where: { id: run.id },
          data: { rawLogs: run.rawLogs }
        });
      } catch (err) {
        throw new ApiError(400, 'Could not fetch logs from GitHub: ' + err.message, ERROR_CODES.VALIDATION_FAILED);
      }
    }

    if (!run.rawLogs || run.rawLogs.trim() === '') {
      throw new ApiError(400, 'No raw logs found for this workflow run (empty on GitHub)', ERROR_CODES.VALIDATION_FAILED);
    }

    if (!incident) {
      incident = await db.incident.create({
        data: {
          title: `Failure Diagnosis for ${run.workflowName}`,
          status: 'DIAGNOSING',
          repositoryId: run.repositoryId,
          workflowRunId: run.id,
        }
      });
    } else {
      await db.incident.update({ where: { id: incident.id }, data: { status: 'DIAGNOSING' } });
    }

    // 2. Parse Logs
    const parsedLogData = parserService.parseLogs(run.rawLogs);
    if (!parsedLogData) {
      logger.warn('[Diagnosis] No standard error patterns found in logs');
    }

    // 3. AI Service
    // Pass parsed logs to AI. If parse failed, pass rawLogs snippet or generic info
    const aiResult = await aiService.diagnoseFailure(parsedLogData || {
      rawLogs: run.rawLogs.substring(0, 3000), // pass a chunk if not parsed
      errorType: 'Unknown'
    });

    // 4. Store Diagnosis
    const diagnosis = await db.diagnosis.create({
      data: {
        incidentId: incident.id,
        failureType: aiResult.failure_type,
        confidence: parseFloat(aiResult.confidence) || 0,
        rootCause: aiResult.root_cause,
        summary: aiResult.summary,
        suggestedFix: aiResult.suggested_fix,
        autoFixable: Boolean(aiResult.auto_fixable),
        aiModel: aiService.getProvider(),
      }
    });

    // Update Incident based on AI result
    await db.incident.update({
      where: { id: incident.id },
      data: { 
        status: 'OPEN', // wait for next action
        errorCategory: aiResult.failure_type,
        errorMessage: aiResult.summary,
        errorFile: parsedLogData?.filePath,
        errorLine: parsedLogData?.lineNumber,
        errorCommand: parsedLogData?.failedCommand,
      }
    });

    // 5. Activity Logging
    const activity = await db.activity.create({
      data: {
        eventType: 'diagnosis_completed',
        title: 'AI Diagnosis Completed',
        description: `Root cause identified via ${aiService.getProvider().toUpperCase()}: ${aiResult.summary}`,
        incidentId: incident.id,
        workflowId: run.id,
        userId,
      },
      include: {
        incident: { select: { title: true, status: true } }
      }
    });

    // 6. Emit Socket.IO Event
    emitToAll(SOCKET_NAMESPACES.INCIDENTS, 'diagnosis_completed', diagnosis);
    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', activity);

    return diagnosis;
  },

  async generateFix(incidentId, diagnosisId, filePath, originalCode, userId) {
    const incident = await db.incident.findUnique({ 
      where: { id: incidentId },
      include: { repository: { include: { user: true } } }
    });
    if (!incident) throw new ApiError(404, 'Incident not found', ERROR_CODES.NOT_FOUND);

    let diagnosisText = 'Unknown failure';
    if (diagnosisId) {
      const dbDiag = await db.diagnosis.findUnique({ where: { id: diagnosisId } });
      if (dbDiag) diagnosisText = dbDiag.suggestedFix || dbDiag.rootCause;
    }

    // Auto-fetch file from GitHub if not provided by frontend
    if (!filePath) filePath = incident.errorFile || '.github/workflows/pipeheal-test.yml';
    
    if (!originalCode || originalCode.trim() === '') {
      try {
        const repo = incident.repository;
        let token = process.env.GITHUB_CLIENT_SECRET;
        if (repo.user?.githubAccessToken) {
          const { decryptToken } = await import('../utils/crypto.js');
          token = decryptToken(repo.user.githubAccessToken);
        }
        const githubService = (await import('./github.service.js')).default;
        const fileRes = await githubService.getFile(repo.owner, repo.name, filePath, token);
        originalCode = fileRes.content;
      } catch (err) {
        logger.warn(`[DiagnosisService] Could not fetch original code for ${filePath}: ${err.message}`);
        originalCode = '// File not found or empty';
      }
    }

    const aiResult = await aiService.generatePatch(diagnosisText, filePath, originalCode);

    const patch = await db.patch.create({
      data: {
        incidentId,
        filePath: filePath || 'unknown',
        originalCode: originalCode || '',
        patchedCode: aiResult.patchedCode,
        diff: aiResult.diff,
        description: aiResult.description,
        aiModel: aiService.getProvider(),
      }
    });

    await db.incident.update({ where: { id: incidentId }, data: { status: 'PATCH_GENERATED' } });

    const activity = await db.activity.create({
      data: {
        eventType: 'patch_generated',
        title: 'AI Patch Generated',
        description: `Patch generated for ${filePath}`,
        incidentId,
        userId,
      }
    });
    
    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', activity);
    emitToAll(SOCKET_NAMESPACES.INCIDENTS, 'patch_generated', patch);

    return patch;
  }
};

export default diagnosisService;
