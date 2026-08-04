import workflowRunService from '../services/workflowRun.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const workflowRunController = {
  async listRuns(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    
    const { data, total } = await workflowRunService.listRuns({
      repositoryId: req.query.repositoryId,
      status: req.query.status,
      page,
      limit,
    });

    return ApiResponse.paginated(res, data, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  },

  async getRun(req, res) {
    const run = await workflowRunService.getRun(req.params.id);
    return ApiResponse.ok(res, run, 'Workflow run retrieved');
  }
};

export default workflowRunController;
