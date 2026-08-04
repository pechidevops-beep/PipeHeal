import { useState, useEffect } from 'react';
import { api } from '../services/api/api';
import { formatDistanceToNow } from 'date-fns';
import './AutoFixesPage.css';

export default function AutoFixesPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await api.getIncidents({ status: 'RESOLVED', limit: 50 });
        // Filter those that have an AI patch which is verified
        const autoFixed = (res.data || []).filter(inc => 
          inc.patches?.some(p => p.status === 'VERIFIED')
        );
        setIncidents(autoFixed);
      } catch (err) {
        console.error('Failed to fetch auto-fixes', err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  if (loading) {
    return <div className="autofix-page"><div className="skeleton" style={{ height: '200px' }} /></div>;
  }

  return (
    <div className="autofix-page">
      <div className="autofix-header">
        <div>
          <h1 className="autofix-title">Auto Fixes</h1>
          <p className="autofix-subtitle">
            History of pipelines automatically repaired by PipeHeal AI
          </p>
        </div>
      </div>

      {incidents.length === 0 ? (
        <div className="autofix-empty">
          <span className="material-symbols-outlined">auto_fix</span>
          <h3>No auto-fixes yet</h3>
          <p>Enable Auto-Fix on your repositories to let PipeHeal automatically push fixes for broken pipelines.</p>
        </div>
      ) : (
        <div className="autofix-grid">
          {incidents.map(incident => (
            <div key={incident.id} className="autofix-card">
              <div className="autofix-card-header">
                <span className="material-symbols-outlined" style={{ color: '#10B981' }}>check_circle</span>
                <span className="autofix-repo">{incident.repository?.fullName}</span>
                <span className="autofix-time">
                  {formatDistanceToNow(new Date(incident.resolvedAt || incident.updatedAt), { addSuffix: true })}
                </span>
              </div>
              <h3 className="autofix-incident-title">{incident.title}</h3>
              <p className="autofix-incident-desc">{incident.description}</p>
              
              {incident.pullRequests?.length > 0 && (
                <a 
                  href={incident.pullRequests[0].htmlUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn-outline"
                  style={{ marginTop: '16px', display: 'inline-flex' }}
                >
                  <span className="material-symbols-outlined">merge</span>
                  View Pull Request
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
