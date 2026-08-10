import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { api } from '../services/api/api';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import './TopBar.css';

export default function TopBar({ onMenuClick }) {
  const [token, setToken] = useState(null);
  const [login, setLogin] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [activities, setActivities] = useState([]);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('pipeheal_token'));
    setLogin(localStorage.getItem('pipeheal_login'));
  }, []);

  useEffect(() => {
    if (showNotifications) {
      api.getActivityFeed().then(res => setActivities(res.data.slice(0, 5))).catch(() => {});
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
      {/* Mobile Hamburger */}
      <button className="topbar-hamburger" onClick={onMenuClick}>
        <span className="material-symbols-outlined">menu</span>
      </button>

      {/* Left: Tab navigation */}
      <nav className="topbar-tabs" aria-label="Page tabs">
        <NavLink to="/dashboard" end className={({ isActive }) => `topbar-tab ${isActive ? 'topbar-tab--active' : ''}`}>Main</NavLink>
        <NavLink to="/dashboard/network" className={({ isActive }) => `topbar-tab ${isActive ? 'topbar-tab--active' : ''}`}>Network</NavLink>
        <NavLink to="/dashboard/logs" className={({ isActive }) => `topbar-tab ${isActive ? 'topbar-tab--active' : ''}`}>Logs</NavLink>
      </nav>

      {/* Right: Actions */}
      <div className="topbar-actions">
        {/* Search */}
        <div className={`topbar-search ${isMobileSearchOpen ? 'topbar-search--mobile-open' : ''}`}>
          <span 
            className="material-symbols-outlined topbar-search-icon"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            search
          </span>
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
          className="topbar-deploy-btn premium-button" 
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
            <AnimatePresence>
              {showNotifications && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="notifications-dropdown"
                >
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <Link to="/dashboard/settings" className="topbar-icon-btn" title="Settings">
            <span className="material-symbols-outlined">settings_suggest</span>
          </Link>
          
          {token ? (
            <div className="topbar-avatar" title={`Logged in as ${login}`} onClick={handleLogout} style={{ cursor: 'pointer' }}>
              <span className="material-symbols-outlined">logout</span>
            </div>
          ) : (
            <button 
              className="topbar-deploy-btn premium-button" 
              onClick={() => {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
                window.location.href = `${apiUrl}/auth/github`;
              }}
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
