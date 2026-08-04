import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

/**
 * axios interceptor returns response.data directly.
 * So api.getRepositories() resolves to:
 *   { success: true, data: [...], meta: { total, page, ... }, message: '...' }
 */
export const useRepositories = () => {
  const [repositories, setRepositories] = useState([]);
  const [total, setTotal] = useState(0);
  const [githubRepos, setGithubRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRepositories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getRepositories();
      // res = { success, data: [...], meta: { total } }
      const items = Array.isArray(res?.data) ? res.data : [];
      setRepositories(items);
      setTotal(res?.meta?.total ?? items.length);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGithubRepos = useCallback(async () => {
    try {
      setGithubLoading(true);
      const res = await api.getGithubRepos();
      // res = { success, data: [...] }
      const items = Array.isArray(res?.data) ? res.data : [];
      setGithubRepos(items);
    } catch (err) {
      console.error('Failed to fetch GitHub repos:', err);
      setGithubRepos([]);
    } finally {
      setGithubLoading(false);
    }
  }, []);

  const addRepository = useCallback(async (fullName) => {
    const res = await api.addRepository(fullName);
    await fetchRepositories();
    return res?.data;
  }, [fetchRepositories]);

  const removeRepository = useCallback(async (id) => {
    await api.removeRepository(id);
    setRepositories(prev => prev.filter(r => r.id !== id));
    setTotal(prev => Math.max(0, prev - 1));
  }, []);

  const syncRepository = useCallback(async (id) => {
    const res = await api.syncRepository(id);
    const updated = res?.data;
    if (updated) {
      setRepositories(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    }
    return updated;
  }, []);

  const toggleAutoFix = useCallback(async (id, enabled) => {
    const res = await api.toggleAutoFix(id, enabled);
    const updated = res?.data;
    if (updated) {
      setRepositories(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    }
    return updated;
  }, []);

  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  // Real-time Socket.IO updates
  useSocket('/dashboard', {
    repository_connected: (repo) => {
      setRepositories(prev => {
        if (prev.find(r => r.id === repo.id)) return prev;
        return [repo, ...prev];
      });
      setTotal(prev => prev + 1);
    },
    repository_removed: ({ id }) => {
      setRepositories(prev => prev.filter(r => r.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
    },
    repository_synced: (updated) => {
      setRepositories(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
    },
    repository_autofix_toggled: (updated) => {
      setRepositories(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
    },
  });

  return {
    repositories,
    total,
    loading,
    error,
    githubRepos,
    githubLoading,
    refetch: fetchRepositories,
    fetchGithubRepos,
    addRepository,
    removeRepository,
    syncRepository,
    toggleAutoFix,
  };
};

export default useRepositories;
