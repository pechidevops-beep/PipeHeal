import { getIO } from './index.js';
import { SOCKET_NAMESPACES, SOCKET_EVENTS } from '../constants/events.js';

/**
 * Push an event to a specific user on a specific namespace.
 */
export function emitToUser(namespace, userId, event, payload) {
  try {
    const io = getIO();
    io.of(namespace).to(`user:${userId}`).emit(event, payload);
  } catch (err) {
    // Silent fail if socket not init (e.g. during testing)
  }
}

/**
 * Push an event to all connected clients on a namespace.
 */
export function emitToAll(namespace, event, payload) {
  try {
    const io = getIO();
    io.of(namespace).emit(event, payload);
  } catch (err) {
    // Silent fail
  }
}

// Higher level helpers for business logic

export const socketEmitter = {
  // ── Dashboard ──────────────────────────────────────────────────────────────
  
  sendDashboardUpdate(userId, payload) {
    emitToUser(SOCKET_NAMESPACES.DASHBOARD, userId, SOCKET_EVENTS.DASHBOARD_UPDATE, payload);
  },

  sendActivity(userId, activity) {
    emitToUser(SOCKET_NAMESPACES.DASHBOARD, userId, SOCKET_EVENTS.ACTIVITY, activity);
  },

  // ── Incidents ──────────────────────────────────────────────────────────────

  sendIncidentCreated(userId, incident) {
    emitToUser(SOCKET_NAMESPACES.INCIDENTS, userId, SOCKET_EVENTS.INCIDENT_CREATED, incident);
  },

  sendIncidentUpdated(userId, incident) {
    emitToUser(SOCKET_NAMESPACES.INCIDENTS, userId, SOCKET_EVENTS.INCIDENT_UPDATED, incident);
  },

  sendDiagnosisUpdate(userId, diagnosis) {
    emitToUser(SOCKET_NAMESPACES.INCIDENTS, userId, SOCKET_EVENTS.DIAGNOSIS_COMPLETED, diagnosis);
  },

  sendSandboxUpdate(userId, sandboxRun) {
    const event = sandboxRun.status === 'RUNNING' 
      ? SOCKET_EVENTS.SANDBOX_STARTED 
      : (sandboxRun.status === 'ERROR' || sandboxRun.status === 'FAILED')
        ? SOCKET_EVENTS.SANDBOX_FAILED
        : SOCKET_EVENTS.SANDBOX_COMPLETED;

    emitToUser(SOCKET_NAMESPACES.INCIDENTS, userId, event, sandboxRun);
  },

  // ── Pipelines ──────────────────────────────────────────────────────────────

  sendWorkflowUpdate(userId, workflowRun) {
    emitToUser(SOCKET_NAMESPACES.PIPELINES, userId, SOCKET_EVENTS.WORKFLOW_COMPLETED, workflowRun);
  }
};
