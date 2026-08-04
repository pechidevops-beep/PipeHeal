import diagnosisService from '../services/diagnosis.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const diagnosisController = {
  async diagnose(req, res) {
    const { workflowRunId } = req.body;
    
    // Diagnosis engine operates on workflow logs already stored in the database
    const diagnosis = await diagnosisService.runDiagnosis(workflowRunId, req.user.id);
    
    return ApiResponse.created(res, diagnosis, 'Diagnosis completed');
  },

  async generateFix(req, res) {
    const { incidentId, diagnosisId, filePath, originalCode } = req.body;
    
    const patch = await diagnosisService.generateFix(incidentId, diagnosisId, filePath, originalCode, req.user.id);
    
    return ApiResponse.created(res, patch, 'Patch generated');
  },
};

export default diagnosisController;
