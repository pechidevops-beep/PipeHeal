import pipelineService from '../services/pipeline.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const pipelineController = {
  async listPipelines(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const repositoryId = req.query.repositoryId; // optional

    const { data, total } = await pipelineService.listPipelines(repositoryId, page, limit);

    return ApiResponse.paginated(res, data, {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  },

  async getPipeline(req, res) {
    const pipeline = await pipelineService.getPipelineRun(req.params.id);
    return ApiResponse.ok(res, pipeline, 'Pipeline retrieved');
  }
};

export default pipelineController;
