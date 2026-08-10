import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const usePipelines = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['pipelines'],
    queryFn: async () => {
      const res = await api.getPipelines();
      const items = Array.isArray(res?.data) ? res.data : [];
      return { pipelines: items, total: res?.meta?.total ?? items.length };
    }
  });

  useSocket('/pipelines', {
    'workflow_received': (newRun) => {
      queryClient.setQueryData(['pipelines'], (oldData) => {
        if (!oldData) return oldData;
        const exists = oldData.pipelines.find(p => p.id === newRun.id);
        return {
          ...oldData,
          pipelines: exists 
            ? oldData.pipelines.map(p => p.id === newRun.id ? newRun : p)
            : [newRun, ...oldData.pipelines]
        };
      });
    },
    'workflow_updated': (updatedRun) => {
      queryClient.setQueryData(['pipelines'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pipelines: oldData.pipelines.map(p => p.id === updatedRun.id ? updatedRun : p)
        };
      });
    },
  });

  return { 
    pipelines: data?.pipelines || [], 
    total: data?.total || 0,
    loading: isLoading, 
    error: error?.message || null, 
    refetch 
  };
};

export default usePipelines;
