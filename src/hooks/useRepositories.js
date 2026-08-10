import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/api.js';
import { useSocket } from './useSocket.js';

export const useRepositories = () => {
  const queryClient = useQueryClient();

  const { data: repoData, isLoading: loading, error, refetch: refetchRepositories } = useQuery({
    queryKey: ['repositories'],
    queryFn: async () => {
      const res = await api.getRepositories();
      const items = Array.isArray(res?.data) ? res.data : [];
      return { repositories: items, total: res?.meta?.total ?? items.length };
    }
  });

  const { data: githubReposData, isLoading: githubLoading, refetch: fetchGithubRepos } = useQuery({
    queryKey: ['githubRepos'],
    queryFn: async () => {
      const res = await api.getGithubRepos();
      return Array.isArray(res?.data) ? res.data : [];
    },
    enabled: false
  });

  const addRepositoryMutation = useMutation({
    mutationFn: (fullName) => api.addRepository(fullName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories'] })
  });

  const removeRepositoryMutation = useMutation({
    mutationFn: (id) => api.removeRepository(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories'] })
  });

  const syncRepositoryMutation = useMutation({
    mutationFn: (id) => api.syncRepository(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories'] })
  });

  const toggleAutoFixMutation = useMutation({
    mutationFn: ({ id, enabled }) => api.toggleAutoFix(id, enabled),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['repositories'] })
  });

  useSocket('/dashboard', {
    repository_connected: (repo) => {
      queryClient.setQueryData(['repositories'], (oldData) => {
        if (!oldData) return oldData;
        if (oldData.repositories.find(r => r.id === repo.id)) return oldData;
        return {
          ...oldData,
          repositories: [repo, ...oldData.repositories],
          total: oldData.total + 1
        };
      });
    },
    repository_removed: ({ id }) => {
      queryClient.setQueryData(['repositories'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          repositories: oldData.repositories.filter(r => r.id !== id),
          total: Math.max(0, oldData.total - 1)
        };
      });
    },
    repository_synced: (updated) => {
      queryClient.setQueryData(['repositories'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          repositories: oldData.repositories.map(r => r.id === updated.id ? { ...r, ...updated } : r)
        };
      });
    },
    repository_autofix_toggled: (updated) => {
      queryClient.setQueryData(['repositories'], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          repositories: oldData.repositories.map(r => r.id === updated.id ? { ...r, ...updated } : r)
        };
      });
    },
  });

  return {
    repositories: repoData?.repositories || [],
    total: repoData?.total || 0,
    loading,
    error: error?.message || null,
    githubRepos: githubReposData || [],
    githubLoading,
    refetch: refetchRepositories,
    fetchGithubRepos,
    addRepository: async (fullName) => {
      const res = await addRepositoryMutation.mutateAsync(fullName);
      return res?.data;
    },
    removeRepository: async (id) => {
      await removeRepositoryMutation.mutateAsync(id);
    },
    syncRepository: async (id) => {
      const res = await syncRepositoryMutation.mutateAsync(id);
      return res?.data;
    },
    toggleAutoFix: async (id, enabled) => {
      const res = await toggleAutoFixMutation.mutateAsync({ id, enabled });
      return res?.data;
    },
  };
};

export default useRepositories;
