/**
 * Socket.IO event names.
 * Kept in one place to avoid typo drift across client + server.
 */

export const SOCKET_EVENTS = {
  // Connection lifecycle
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Dashboard
  DASHBOARD_UPDATE: 'dashboard:update',
  SYSTEM_STATS: 'dashboard:system_stats',

  // Workflow & Pipeline
  WORKFLOW_QUEUED: 'pipeline:workflow_queued',
  WORKFLOW_STARTED: 'pipeline:workflow_started',
  WORKFLOW_COMPLETED: 'pipeline:workflow_completed',
  WORKFLOW_FAILED: 'pipeline:workflow_failed',
  STEP_UPDATED: 'pipeline:step_updated',

  // Incidents
  INCIDENT_CREATED: 'incidents:created',
  INCIDENT_UPDATED: 'incidents:updated',
  INCIDENT_RESOLVED: 'incidents:resolved',

  // Diagnosis & Patches
  DIAGNOSIS_STARTED: 'incidents:diagnosis_started',
  DIAGNOSIS_COMPLETED: 'incidents:diagnosis_completed',
  PATCH_GENERATED: 'incidents:patch_generated',

  // Sandbox
  SANDBOX_STARTED: 'incidents:sandbox_started',
  SANDBOX_COMPLETED: 'incidents:sandbox_completed',
  SANDBOX_FAILED: 'incidents:sandbox_failed',

  // Pull Requests
  PR_OPENED: 'incidents:pr_opened',

  // Activity feed
  ACTIVITY: 'dashboard:activity',
};

export const SOCKET_NAMESPACES = {
  DASHBOARD: '/dashboard',
  INCIDENTS: '/incidents',
  PIPELINES: '/pipelines',
};

export default SOCKET_EVENTS;
