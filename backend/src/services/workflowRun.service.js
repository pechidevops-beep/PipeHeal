import workflowRunRepo from '../repositories/workflowRun.repository.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const workflowRunService = {
  async listRuns(filters = {}) {
    return workflowRunRepo.findAll(filters);
  },

  async getRun(id) {
    const run = await workflowRunRepo.findById(id);
    if (!run) throw new ApiError(404, 'Workflow run not found', ERROR_CODES.NOT_FOUND);
    return run;
  }
};

export default workflowRunService;
