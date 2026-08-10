import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const useSandbox = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sandbox'],
    queryFn: async () => {
      const res = await api.getSandboxRuns();
      const list = Array.isArray(res?.data) ? res.data : [];
      return { sandboxRuns: list, total: res?.meta?.total ?? list.length };
    }
  });

  useSocket('/incidents', {
    'sandbox_started': (newRun) => {
      queryClient.setQueryData(['sandbox'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          sandboxRuns: [newRun, ...oldData.sandboxRuns],
          total: oldData.total + 1
        };
      });
    },
    'sandbox_completed': (updatedRun) => {
      queryClient.setQueryData(['sandbox'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          sandboxRuns: oldData.sandboxRuns.map(r => r.id === updatedRun.id ? { ...r, ...updatedRun } : r)
        };
      });
    },
  });

  const runSandbox = async (incidentId, patchId) => {
    const res = await api.runSandbox(incidentId, patchId);
    return res?.data;
  };

  return { 
    sandboxRuns: data?.sandboxRuns || [], 
    total: data?.total || 0, 
    loading: isLoading, 
    error: error?.message || null, 
    refetch, 
    runSandbox 
  };
};

export default useSandbox;
