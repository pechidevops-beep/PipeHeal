import incidentService from '../services/incident.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import githubService from '../services/github.service.js';
import aiService from '../services/ai.service.js';
import validationService from '../services/validation.service.js';
import { db } from '../config/prisma.js';

export const incidentController = {
  async listIncidents(req, res) {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const { data, total } = await incidentService.listIncidents({
      userId: req.user.id,
      repositoryId: req.query.repositoryId,
      status: req.query.status,
      severity: req.query.severity,
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

  async getIncident(req, res) {
    const incident = await incidentService.getIncident(req.params.id, req.user.id);
    return ApiResponse.ok(res, incident, 'Incident retrieved');
  },

  async createIncident(req, res) {
    const incident = await incidentService.createIncident(req.body, req.user.id);
    return ApiResponse.created(res, incident, 'Incident created manually');
  },

  async updateIncident(req, res) {
    const incident = await incidentService.updateIncident(req.params.id, req.body, req.user.id);
    return ApiResponse.ok(res, incident, 'Incident updated');
  },

  async generatePatch(req, res) {
    const incidentId = req.params.id;
    // 1. Fetch incident from DB — verify it belongs to this user
    const incident = await incidentService.getIncident(incidentId, req.user.id);
    if (!incident) throw new ApiError(404, 'Incident not found');

    const repoName = incident.repository?.name;
    const ownerName = incident.repository?.owner;
    if (!repoName || !ownerName) throw new ApiError(400, 'Repository not found for incident');

    // Get user token
    const user = await db.user.findUnique({
      where: { id: req.user.id }
    });
    if (!user?.githubAccessToken) throw new ApiError(401, 'GitHub account not connected or missing token');
    
    let token = user.githubAccessToken;
    try {
      const { decryptToken } = await import('../utils/crypto.js');
      token = decryptToken(token);
    } catch (e) {
      throw new ApiError(500, 'Failed to decrypt GitHub token');
    }

    const filePath = req.body.filePath || '.github/workflows/pipeheal-test.yml';
    const result = await incidentService.generatePatchAndPR(incidentId, req.user.id, token, filePath);
    return ApiResponse.ok(res, result, 'Patch validated and PR created successfully');
  },
};

export default incidentController;
