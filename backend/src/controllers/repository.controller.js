import repositoryService from '../services/repository.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const repositoryController = {
  /**
   * GET /repositories
   * Lists repositories tracked in PipeHeal for this user.
   */
  async listRepositories(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    const { data, total } = await repositoryService.listRepositories(req.user.id, page, limit);

    return ApiResponse.paginated(res, data, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  },

  /**
   * GET /repositories/github-repos
   * Lists the user's GitHub repositories (from GitHub API).
   */
  async listGithubRepositories(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 100;
    const sort = req.query.sort || 'updated';
    const direction = req.query.direction || 'desc';

    const repos = await repositoryService.listGithubRepositories(req.user.id, page, limit, sort, direction);
    return ApiResponse.ok(res, repos, 'GitHub repositories fetched');
  },

  /**
   * POST /repositories
   * Tracks a new repository (validates, saves, creates webhook).
   */
  async addRepository(req, res) {
    const repo = await repositoryService.addRepository(req.user.id, req.body, req.user.githubAccessToken);
    return ApiResponse.created(res, repo, 'Repository tracked successfully');
  },

  /**
   * DELETE /repositories/:id
   * Untracks a repository (removes webhook too).
   */
  async removeRepository(req, res) {
    await repositoryService.removeRepository(req.params.id, req.user.id);
    return ApiResponse.ok(res, null, 'Repository removed successfully');
  },

  /**
   * POST /repositories/:id/sync
   * Refreshes repository metadata from GitHub.
   */
  async syncRepository(req, res) {
    const updated = await repositoryService.syncRepository(req.params.id, req.user.id);
    return ApiResponse.ok(res, updated, 'Repository synced with GitHub');
  },

  toggleAutoFix: async (req, res) => {
    const { enabled } = req.body;
    if (typeof enabled !== 'boolean') {
      return ApiResponse.error(res, 'enabled must be a boolean', 400);
    }
    const updated = await repositoryService.toggleAutoFix(req.params.id, req.user.id, enabled);
    return ApiResponse.ok(res, updated, `Auto-Fix ${enabled ? 'enabled' : 'disabled'}`);
  }
};

export default repositoryController;
