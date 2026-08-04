import pullRequestService from '../services/pullRequest.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const pullRequestController = {
  async createPullRequest(req, res) {
    const { incidentId, title, body, headBranch, baseBranch } = req.body;
    const token = req.user.accessToken;

    const pr = await pullRequestService.createDraftPR(
      incidentId,
      title,
      body,
      headBranch,
      baseBranch || 'main',
      token,
      req.user.id
    );

    return ApiResponse.created(res, pr, 'Draft Pull Request created');
  }
};

export default pullRequestController;
