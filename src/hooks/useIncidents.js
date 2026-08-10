import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const useIncidents = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['incidents'],
    queryFn: async () => {
      const res = await api.getIncidents();
      const list = Array.isArray(res?.data) ? res.data : [];
      return { incidents: list, total: res?.meta?.total ?? list.length };
    }
  });

  useSocket('/incidents', {
    'incidents:created': (newIncident) => {
      queryClient.setQueryData(['incidents'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          incidents: [newIncident, ...oldData.incidents],
          total: oldData.total + 1
        };
      });
    },
    'incidents:updated': (updated) => {
      queryClient.setQueryData(['incidents'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          incidents: oldData.incidents.map(i => i.id === updated.id ? { ...i, ...updated } : i)
        };
      });
    },
    'diagnosis_completed': () => refetch(),
    'patch_generated': () => refetch(),
    'sandbox_started': () => refetch(),
    'sandbox_completed': () => refetch(),
    'pull_request_created': () => refetch(),
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
    incidents: data?.incidents || [],
    total: data?.total || 0,
    loading: isLoading,
    error: error?.message || null,
    refetch,
    diagnose,
    generatePatch,
    createPR,
  };
};

export default useIncidents;
