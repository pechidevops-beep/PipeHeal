import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api/api';
import { formatDistanceToNow } from 'date-fns';
import HeartbeatLoader from '../components/HeartbeatLoader';
import './AutoFixesPage.css';

export default function AutoFixesPage() {
  const { data: incidents = [], isLoading: loading } = useQuery({
    queryKey: ['autofixes'],
    queryFn: async () => {
      const res = await api.getIncidents({ status: 'RESOLVED', limit: 50 });
      // Filter those that have an AI patch which is verified
      return (res.data || []).filter(inc => 
        inc.patches?.some(p => p.status === 'VERIFIED')
      );
    }
  });

  if (loading) {
    return (
      <div className="autofix-page">
        <div className="autofix-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '30%' }}>
            <div className="skeleton" style={{ height: '48px', width: '100%' }} />
            <div className="skeleton" style={{ height: '20px', width: '60%' }} />
          </div>
        </div>
        <div className="autofix-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton" style={{ height: '180px', borderRadius: '14px' }} />
          ))}
        </div>
      </div>
    );
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
          <HeartbeatLoader status="flatline" style={{ width: '200px', height: '60px', opacity: 0.2, margin: '0 auto' }} />
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
