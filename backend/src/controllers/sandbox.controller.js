import sandboxService from '../services/sandbox.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const sandboxController = {
  async runSandbox(req, res) {
    const { incidentId, patchId, image, timeout } = req.body;
    
    const result = await sandboxService.runSandbox(incidentId, patchId, image, timeout, req.user.id);
    
    return ApiResponse.created(res, result, 'Sandbox verification completed');
  },

  async getSandboxRun(req, res) {
    // Basic wrapper, real logic in repo/service
    const { sandboxRepository } = await import('../repositories/sandbox.repository.js');
    const run = await sandboxRepository.findById(req.params.id);
    if (!run) {
      const { ApiError } = await import('../utils/ApiError.js');
      throw new ApiError(404, 'Sandbox run not found');
    }
    return ApiResponse.ok(res, run, 'Sandbox run retrieved');
  }
};

export default sandboxController;
