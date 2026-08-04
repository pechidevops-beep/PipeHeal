import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

/**
 * useDashboard
 * 
 * The axios interceptor returns response.data directly (the full API response body).
 * So apiClient.get('/dashboard') resolves to:
 *   { success: true, data: { stats: {...}, activity: [...] }, ... }
 * 
 * We access .data to get the payload.
 */
export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Dashboard returns { stats: {...}, activity: [...] } in .data
      const dashRes = await api.getDashboardStats().catch(() => null);
      if (dashRes?.data) {
        setStats(dashRes.data);
        if (Array.isArray(dashRes.data.activity)) {
          setActivities(dashRes.data.activity);
        }
      }

      // Separately fetch activity feed as fallback/supplement
      const actRes = await api.getActivityFeed(1, 20).catch(() => null);
      if (actRes?.data) {
        const list = Array.isArray(actRes.data) ? actRes.data
          : Array.isArray(actRes.data?.data) ? actRes.data.data
          : [];
        if (list.length > 0) setActivities(list);
      }

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Real-time updates
  useSocket('/dashboard', {
    'dashboard:update': (newStats) => {
      setStats(prev => ({ ...prev, ...newStats }));
    },
    'dashboard:activity': (newActivity) => {
      setActivities(prev => [newActivity, ...prev].slice(0, 50));
    },
    // Also handle generic 'activity' event
    'activity': (newActivity) => {
      setActivities(prev => [newActivity, ...prev].slice(0, 50));
    },
  });

  return { stats, activities, loading, error, refetch: fetchDashboardData };
};

export default useDashboard;
