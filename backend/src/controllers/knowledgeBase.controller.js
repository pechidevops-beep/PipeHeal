import knowledgeBaseService from '../services/knowledgeBase.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import repositoryRepo from '../repositories/repository.repository.js';
import { ApiError } from '../utils/ApiError.js';

export const knowledgeBaseController = {
  async listEntries(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    // For now we assume Knowledge Base is scoped per repository,
    // so we expect a repositoryId in query.
    const { repositoryId } = req.query;
    if (!repositoryId) {
      throw new ApiError(400, 'repositoryId is required');
    }

    // Verify user owns the repo
    const repo = await repositoryRepo.findById(repositoryId, req.user.id);
    if (!repo) {
      throw new ApiError(404, 'Repository not found');
    }

    const { data, total } = await knowledgeBaseService.listEntries(repositoryId, page, limit);

    return ApiResponse.paginated(res, data, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  }
};

export default knowledgeBaseController;
