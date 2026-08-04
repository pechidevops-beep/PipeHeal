import { useState, useEffect } from 'react';
import { api } from '../services/api/api';
import useRepositories from '../hooks/useRepositories';
import { formatDistanceToNow } from 'date-fns';
import './KnowledgeBasePage.css';

export default function KnowledgeBasePage() {
  const { repositories, loading: reposLoading } = useRepositories();
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (repositories.length > 0 && !selectedRepoId) {
      setSelectedRepoId(repositories[0].id);
    }
  }, [repositories, selectedRepoId]);

  useEffect(() => {
    if (!selectedRepoId) return;
    
    const fetchEntries = async () => {
      try {
        setLoading(true);
        const res = await api.getKnowledgeBase(selectedRepoId);
        setEntries(res.data || []);
      } catch (err) {
        console.error('Failed to fetch knowledge base entries', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, [selectedRepoId]);

  if (reposLoading) {
    return <div className="kb-page"><div className="skeleton" style={{ height: '200px' }} /></div>;
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
        <div className="skeleton" style={{ height: '300px' }} />
      ) : entries.length === 0 ? (
        <div className="kb-empty">
          <span className="material-symbols-outlined">menu_book</span>
          <h3>Knowledge Base is empty</h3>
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
                
                <h4 className="kb-label" style={{ marginTop: '16px' }}>Successful Patch Diff:</h4>
                <pre className="kb-diff">
                  <code>{entry.patchDiff}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
