import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const useSandbox = () => {
  const [sandboxRuns, setSandboxRuns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSandboxRuns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSandboxRuns();
      // res = { success, data: [...], meta: { total } }
      const list = Array.isArray(res?.data) ? res.data : [];
      setSandboxRuns(list);
      setTotal(res?.meta?.total ?? list.length);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch sandbox runs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSandboxRuns();
  }, [fetchSandboxRuns]);

  // Real-time updates
  useSocket('/incidents', {
    'sandbox_started': (newRun) => {
      setSandboxRuns(prev => [newRun, ...prev]);
      setTotal(prev => prev + 1);
    },
    'sandbox_completed': (updatedRun) => {
      setSandboxRuns(prev => prev.map(r => r.id === updatedRun.id ? { ...r, ...updatedRun } : r));
    },
  });

  const runSandbox = async (incidentId, patchId) => {
    const res = await api.runSandbox(incidentId, patchId);
    return res?.data;
  };

  return { sandboxRuns, total, loading, error, refetch: fetchSandboxRuns, runSandbox };
};

export default useSandbox;
