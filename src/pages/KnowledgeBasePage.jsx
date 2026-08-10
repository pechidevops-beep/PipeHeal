import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { api } from '../services/api/api';
import useRepositories from '../hooks/useRepositories';
import { formatDistanceToNow } from 'date-fns';
import DiffViewer from '../components/DiffViewer';
import HeartbeatLoader from '../components/HeartbeatLoader';
import './KnowledgeBasePage.css';

export default function KnowledgeBasePage() {
  const { repositories, loading: reposLoading } = useRepositories();
  const [selectedRepoId, setSelectedRepoId] = useState('');

  useEffect(() => {
    if (repositories.length > 0 && !selectedRepoId) {
      setSelectedRepoId(repositories[0].id);
    }
  }, [repositories, selectedRepoId]);

  const { data: entries = [], isLoading: loading, isFetching } = useQuery({
    queryKey: ['knowledgeBase', selectedRepoId],
    queryFn: async () => {
      const res = await api.getKnowledgeBase(selectedRepoId);
      return res.data || [];
    },
    enabled: !!selectedRepoId,
    placeholderData: keepPreviousData,
  });

  if (reposLoading) {
      <div className="kb-page">
        <div className="kb-header-skeleton">
          <HeartbeatLoader status="loading" />
        </div>
      </div>
  }

  return (
    <div className="kb-page">
      <div className="kb-header">
        <div>
          <h1 className="kb-title">Knowledge Base</h1>
          <p className="kb-subtitle">
            AI Memory: Past successful pipeline fixes stored for RAG (Retrieval-Augmented Generation).
          </p>
        </div>
        
        {repositories.length > 0 && (
          <select 
            className="kb-repo-select"
            value={selectedRepoId}
            onChange={(e) => setSelectedRepoId(e.target.value)}
          >
            {repositories.map(repo => (
              <option key={repo.id} value={repo.id}>{repo.fullName}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '40px' }}><HeartbeatLoader status="loading" /></div>
      ) : entries.length === 0 ? (
        <div className="kb-empty">
          <HeartbeatLoader status="flatline" style={{ width: '100px', margin: '0 auto', opacity: 0.2 }} />
          <h3>Memory Unlit</h3>
          <p>Once PipeHeal successfully generates and validates patches for this repository, it will memorize the solutions here to fix similar issues faster in the future.</p>
        </div>
      ) : (
        <div className="kb-grid">
          {entries.map(entry => (
            <div key={entry.id} className="kb-card">
              <div className="kb-card-header">
                <span className="material-symbols-outlined kb-icon">memory</span>
                <span className="kb-time">Learned {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}</span>
              </div>
              <div className="kb-card-body">
                <h4 className="kb-label">Diagnosed Root Cause:</h4>
                <p className="kb-text">{entry.rootCause}</p>
                
                <h4 className="kb-label" style={{ marginTop: '16px', marginBottom: '8px' }}>Successful Patch Diff:</h4>
                <DiffViewer diffString={entry.patchDiff} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
