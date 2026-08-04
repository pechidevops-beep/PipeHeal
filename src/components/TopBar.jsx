import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api/api';
import { formatDistanceToNow } from 'date-fns';
import './TopBar.css';

export default function TopBar() {
  const [token, setToken] = useState(null);
  const [login, setLogin] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    setToken(localStorage.getItem('pipeheal_token'));
    setLogin(localStorage.getItem('pipeheal_login'));
  }, []);

  useEffect(() => {
    if (showNotifications) {
      api.getActivities().then(res => setActivities(res.data.slice(0, 5))).catch(() => {});
    }
  }, [showNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('pipeheal_token');
    localStorage.removeItem('pipeheal_refresh_token');
    localStorage.removeItem('pipeheal_login');
    window.location.reload();
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setTimeout(() => {
      alert('GitHub Actions workflow triggered successfully!');
      setIsDeploying(false);
    }, 1500);
  };

  return (
    <header className="app-topbar" aria-label="Top Application Bar">
      {/* Left: Tab navigation */}
      <nav className="topbar-tabs" aria-label="Page tabs">
        <a href="#" className="topbar-tab topbar-tab--active">Main</a>
        <a href="#" className="topbar-tab">Network</a>
        <a href="#" className="topbar-tab">Logs</a>
      </nav>

      {/* Right: Actions */}
      <div className="topbar-actions">
        {/* Search */}
        <div className="topbar-search">
          <span className="material-symbols-outlined topbar-search-icon">search</span>
          <input
            type="text"
            placeholder="Search resources..."
            className="topbar-search-input"
          />
        </div>

        {/* Repo selector */}
        <div className="topbar-repo-badge">
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>source</span>
          pipeheal/core-backend
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>expand_more</span>
        </div>

        {/* Deploy button */}
        <button 
          className="topbar-deploy-btn" 
          onClick={handleDeploy}
          disabled={isDeploying}
        >
          {isDeploying ? 'Deploying...' : 'Deploy'}
        </button>

        {/* Icon buttons */}
        <div className="topbar-icon-group">
          <div style={{ position: 'relative' }}>
            <button 
              className="topbar-icon-btn" 
              title="Notifications"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <span className="material-symbols-outlined">notifications</span>
              <span className="notification-dot"></span>
            </button>
            {showNotifications && (
              <div className="notifications-dropdown">
                <h4>Recent Activity</h4>
                {activities.length === 0 ? (
                  <p style={{ color: '#9CA3AF', fontSize: '13px' }}>No recent activity.</p>
                ) : (
                  activities.map(act => (
                    <div key={act.id} className="notification-item">
                      <span className="material-symbols-outlined" style={{ color: act.status === 'success' ? '#10B981' : '#3B82F6' }}>
                        {act.status === 'success' ? 'check_circle' : 'info'}
                      </span>
                      <div>
                        <p>{act.title}</p>
                        <small>{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</small>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <Link to="/settings" className="topbar-icon-btn" title="Settings">
            <span className="material-symbols-outlined">settings_suggest</span>
          </Link>
          
          {token ? (
            <div className="topbar-avatar" title={`Logged in as ${login}`} onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <span className="material-symbols-outlined">logout</span>
            </div>
          ) : (
            <button 
              className="topbar-deploy-btn" 
              style={{ background: '#3b82f6' }}
              onClick={() => window.location.href = 'http://localhost:3001/api/v1/auth/github'}
            >
              Login GitHub
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
