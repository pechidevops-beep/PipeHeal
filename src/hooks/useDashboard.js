import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const useDashboard = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const dashRes = await api.getDashboardStats().catch(() => null);
      let stats = dashRes?.data?.stats || null;
      let activities = Array.isArray(dashRes?.data?.activity) ? dashRes.data.activity : [];

      const actRes = await api.getActivityFeed(1, 20).catch(() => null);
      if (actRes?.data) {
        const list = Array.isArray(actRes.data) ? actRes.data
          : Array.isArray(actRes.data?.data) ? actRes.data.data
          : [];
        if (list.length > 0) activities = list;
      }

      return { stats, activities };
    }
  });

  useSocket('/dashboard', {
    'dashboard:update': (newStats) => {
      queryClient.setQueryData(['dashboard'], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, stats: { ...oldData.stats, ...newStats } };
      });
    },
    'dashboard:activity': (newActivity) => {
      queryClient.setQueryData(['dashboard'], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, activities: [newActivity, ...oldData.activities].slice(0, 50) };
      });
    },
    'activity': (newActivity) => {
      queryClient.setQueryData(['dashboard'], (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, activities: [newActivity, ...oldData.activities].slice(0, 50) };
      });
    },
  });

  return { 
    stats: data?.stats || null, 
    activities: data?.activities || [], 
    loading: isLoading, 
    error: error?.message || null, 
    refetch 
  };
};

export default useDashboard;
