import workflowRunRepo from '../repositories/workflowRun.repository.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const pipelineService = {
  // Pipelines are essentially an aggregation of WorkflowRuns.
  // In a more complex system, this might track actual CI/CD definitions.
  
  async listPipelines(repositoryId, page, limit) {
    // For now, list workflow runs
    return workflowRunRepo.findAll({ repositoryId, page, limit });
  },

  async getPipelineRun(id) {
    const run = await workflowRunRepo.findById(id);
    if (!run) throw new ApiError(404, 'Pipeline run not found', ERROR_CODES.NOT_FOUND);
    return run;
  }
};

export default pipelineService;
