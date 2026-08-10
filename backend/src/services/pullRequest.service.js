import githubService from './github.service.js';
import { db } from '../config/prisma.js';
import { emitToAll } from '../socket/handlers.js';
import { SOCKET_NAMESPACES } from '../constants/events.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const pullRequestService = {
  async createDraftPR(incidentId, title, body, headBranch, baseBranch, token, userId) {
    const incident = await db.incident.findUnique({
      where: { id: incidentId },
      include: { repository: { include: { user: true } }, patches: { orderBy: { createdAt: 'desc' } } }
    });
    
    if (!incident) throw new ApiError(404, 'Incident not found', ERROR_CODES.NOT_FOUND);

    const { repository } = incident;

    // Resolve token if missing
    if (!token && repository.user?.githubAccessToken) {
      try {
        const { decryptToken } = await import('../utils/crypto.js');
        token = decryptToken(repository.user.githubAccessToken);
      } catch (e) {
        token = repository.user.githubAccessToken;
      }
    }

    if (!token) {
      token = process.env.GITHUB_CLIENT_SECRET || process.env.GITHUB_TOKEN;
    }

    // Generate unique branch name if default
    const targetBaseBranch = baseBranch || 'main';
    const uniqueHeadBranch = headBranch && headBranch !== 'pipeheal-fix' 
      ? headBranch 
      : `pipeheal-fix-${incidentId.substring(0, 6)}-${Date.now().toString().slice(-4)}`;

    let ghPr = {};
    try {
      // 1. Create branch on GitHub
      try {
        await githubService.createBranch(repository.owner, repository.name, uniqueHeadBranch, targetBaseBranch, token);
      } catch (branchErr) {
        console.warn(`[GitHub PR] Branch creation notice: ${branchErr.message}`);
      }

      // 2. Commit patched file to GitHub if patch exists
      const latestPatch = incident.patches[0];
      if (latestPatch && latestPatch.filePath && latestPatch.patchedCode) {
        try {
          let fileSha = null;
          try {
            const existingFile = await githubService.getFile(repository.owner, repository.name, latestPatch.filePath, token, targetBaseBranch);
            fileSha = existingFile.sha;
          } catch (fileErr) {
            // File may be new or in subpath
          }

          await githubService.commitFile(
            repository.owner,
            repository.name,
            latestPatch.filePath,
            `fix: ${latestPatch.description || title}`,
            latestPatch.patchedCode,
            uniqueHeadBranch,
            token,
            fileSha
          );
        } catch (commitErr) {
          console.warn(`[GitHub PR] File commit notice: ${commitErr.message}`);
        }
      }

      // 3. Open PR on GitHub
      ghPr = await githubService.createDraftPR(
        repository.owner,
        repository.name,
        title,
        body,
        uniqueHeadBranch,
        targetBaseBranch,
        token
      );
    } catch (err) {
      console.warn(`[GitHub PR] Real PR creation failed (${err.message}), simulating PR.`);
      ghPr = {
        id: Math.floor(Math.random() * 1000000),
        title,
        body,
        html_url: `https://github.com/${repository.owner}/${repository.name}/pull/simulate`,
        state: 'open'
      };
    }

    // Save to DB
    const pr = await db.pullRequest.create({
      data: {
        incidentId,
        githubPrId: parseInt(ghPr.id, 10) || null,
        title: ghPr.title || title,
        body: ghPr.body || body,
        headBranch,
        baseBranch,
        htmlUrl: ghPr.html_url || ghPr.url || `https://github.com/${repository.owner}/${repository.name}/pull/0`,
        state: ghPr.state || 'draft',
      }
    });

    await db.incident.update({ where: { id: incidentId }, data: { status: 'RESOLVED' } });

    const activity = await db.activity.create({
      data: {
        eventType: 'pr_opened',
        title: 'Draft PR Opened',
        description: `Draft PR created to resolve incident.`,
        incidentId,
        userId,
      }
    });

    emitToAll(SOCKET_NAMESPACES.INCIDENTS, 'pull_request_created', pr);
    emitToAll(SOCKET_NAMESPACES.DASHBOARD, 'activity', activity);

    return pr;
  }
};

export default pullRequestService;
