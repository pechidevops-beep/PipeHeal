import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const usePipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getPipelines();
      // res = { success, data: [...], meta: { total } }
      const items = Array.isArray(res?.data) ? res.data : [];
      setPipelines(items);
      setTotal(res?.meta?.total ?? items.length);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch pipelines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  // Real-time updates
  useSocket('/pipelines', {
    'workflow_received': (newRun) => {
      setPipelines(prev => {
        const exists = prev.find(p => p.id === newRun.id);
        return exists
          ? prev.map(p => p.id === newRun.id ? newRun : p)
          : [newRun, ...prev];
      });
    },
    'workflow_updated': (updatedRun) => {
      setPipelines(prev => prev.map(p => p.id === updatedRun.id ? updatedRun : p));
    },
  });

  return { pipelines, loading, error, total, refetch: fetchPipelines };
};

export default usePipelines;
