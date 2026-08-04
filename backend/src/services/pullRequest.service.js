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
      include: { repository: true }
    });
    
    if (!incident) throw new ApiError(404, 'Incident not found', ERROR_CODES.NOT_FOUND);

    const { repository } = incident;

    // Create via GitHub
    const ghPr = await githubService.createDraftPR(
      repository.owner,
      repository.name,
      title,
      body,
      headBranch,
      baseBranch,
      token
    );

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
