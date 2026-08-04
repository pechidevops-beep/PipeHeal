import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const useIncidents = () => {
  const [incidents, setIncidents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getIncidents();
      // res = { success, data: [...], meta: { total } }
      const list = Array.isArray(res?.data) ? res.data : [];
      setIncidents(list);
      setTotal(res?.meta?.total ?? list.length);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Real-time updates
  useSocket('/incidents', {
    'incidents:created': (newIncident) => {
      setIncidents(prev => [newIncident, ...prev]);
      setTotal(prev => prev + 1);
    },
    'incidents:updated': (updated) => {
      setIncidents(prev => prev.map(i => i.id === updated.id ? { ...i, ...updated } : i));
    },
    'diagnosis_completed': () => fetchIncidents(),
    'patch_generated': () => fetchIncidents(),
    'sandbox_started': () => fetchIncidents(),
    'sandbox_completed': () => fetchIncidents(),
    'pull_request_created': () => fetchIncidents(),
  });

  const diagnose = async (workflowRunId) => {
    const res = await api.diagnoseIncident(workflowRunId);
    return res?.data;
  };

  const generatePatch = async (incidentId) => {
    const res = await api.generatePatch(incidentId);
    return res?.data;
  };

  const createPR = async (incidentId, title, body, headBranch, baseBranch) => {
    const res = await api.createPullRequest(incidentId, title, body, headBranch, baseBranch);
    return res?.data;
  };

  return {
    incidents,
    total,
    loading,
    error,
    refetch: fetchIncidents,
    diagnose,
    generatePatch,
    createPR,
  };
};

export default useIncidents;
