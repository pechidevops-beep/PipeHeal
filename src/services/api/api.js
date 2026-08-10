import apiClient from './axios.js';

export const api = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboardStats: () => apiClient.get('/dashboard'),
  getActivityFeed: (page = 1, limit = 50) => apiClient.get(`/activity?page=${page}&limit=${limit}`),

  // ── Repositories ──────────────────────────────────────────────────────────
  getRepositories: (page = 1, limit = 50) => apiClient.get(`/repositories?page=${page}&limit=${limit}`),
  getGithubRepos: () => apiClient.get('/repositories/github-repos'),
  addRepository: (fullName, options = {}) => apiClient.post('/repositories', { fullName, ...options }),
  removeRepository: (id) => apiClient.delete(`/repositories/${id}`),
  syncRepository: (id) => apiClient.post(`/repositories/${id}/sync`),
  toggleAutoFix: (id, enabled) => apiClient.patch(`/repositories/${id}/auto-fix`, { enabled }),

  // ── Pipelines / Workflows ──────────────────────────────────────────────────
  getPipelines: (page = 1, limit = 20) => apiClient.get(`/pipelines?page=${page}&limit=${limit}`),
  getPipeline: (id) => apiClient.get(`/pipelines/${id}`),

  // ── Incidents ─────────────────────────────────────────────────────────────
  getIncidents: (params = {}) => apiClient.get('/incidents', { params }),
  getIncident: (id) => apiClient.get(`/incidents/${id}`),

  // ── Diagnosis & Patches ────────────────────────────────────────────────────
  diagnoseIncident: (workflowRunId) => apiClient.post('/diagnosis', { workflowRunId }),
  generateFix: (incidentId, diagnosisId) => apiClient.post('/diagnosis/patch', { incidentId, diagnosisId }),
  generatePatch: (incidentId) => apiClient.post(`/incidents/${incidentId}/patch`, { }),
  getKnowledgeBase: (repositoryId, page = 1, limit = 20) => apiClient.get(`/knowledge-base?repositoryId=${repositoryId}&page=${page}&limit=${limit}`),

  // ── Sandbox ───────────────────────────────────────────────────────────────
  getSandboxRuns: (page = 1, limit = 20) => apiClient.get(`/sandbox?page=${page}&limit=${limit}`),
  runSandbox: (incidentId, patchId) => apiClient.post('/sandbox', patchId ? { incidentId, patchId } : { incidentId }),

  // ── Pull Requests ─────────────────────────────────────────────────────────
  createPullRequest: (incidentId, title, body, headBranch, baseBranch) =>
    apiClient.post('/pull-requests', { incidentId, title, body, headBranch, baseBranch }),

  // ── Settings ──────────────────────────────────────────────────────────────
  getProfile: () => apiClient.get('/settings/profile'),
  updateProfile: (data) => apiClient.patch('/settings/profile', data),
  updatePassword: (oldPassword, newPassword) => apiClient.patch('/settings/password', { oldPassword, newPassword }),
  disconnectGithub: () => apiClient.delete('/settings/github'),
  logoutAll: () => apiClient.post('/settings/logout-all'),
  deleteAccount: () => apiClient.delete('/settings/account'),
  testAiProvider: (provider, apiKey) => apiClient.post('/settings/ai-providers/test', { provider, apiKey }),
  getNotifications: () => apiClient.get('/settings/notifications'),
  updateNotifications: (data) => apiClient.patch('/settings/notifications', data),
  getUsage: () => apiClient.get('/settings/usage'),
};

export default api;
