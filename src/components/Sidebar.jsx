import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api/api';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true },
  { path: '/dashboard/pipelines', icon: 'account_tree', label: 'Pipelines' },
  { path: '/dashboard/incidents', icon: 'emergency_home', label: 'AI Incidents' },
  { path: '/dashboard/auto-fixes', icon: 'auto_fix', label: 'Auto Fixes' },
  { path: '/dashboard/sandbox', icon: 'science', label: 'Sandbox' },
  { path: '/dashboard/knowledge-base', icon: 'menu_book', label: 'Knowledge Base' },
  { path: '/dashboard/repositories', icon: 'source', label: 'Repositories' },
];

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const queryClient = useQueryClient();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handlePrefetch = (path) => {
    if (path === '/dashboard/pipelines') {
      queryClient.prefetchQuery({ queryKey: ['pipelines'], queryFn: async () => {
        const res = await api.getPipelines();
        const items = Array.isArray(res?.data) ? res.data : [];
        return { pipelines: items, total: res?.meta?.total ?? items.length };
      }});
    } else if (path === '/dashboard/incidents') {
      queryClient.prefetchQuery({ queryKey: ['incidents'], queryFn: async () => {
        const res = await api.getIncidents();
        const list = Array.isArray(res?.data) ? res.data : [];
        return { incidents: list, total: res?.meta?.total ?? list.length };
      }});
    } else if (path === '/dashboard/repositories') {
      queryClient.prefetchQuery({ queryKey: ['repositories'], queryFn: async () => {
        const res = await api.getRepositories();
        const items = Array.isArray(res?.data) ? res.data : [];
        return { repositories: items, total: res?.meta?.total ?? items.length };
      }});
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="sidebar-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <nav className={`app-sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`} aria-label="Sidebar Navigation">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
              terminal
            </span>
          </div>
          <div className="sidebar-brand-container">
            <h1 className="sidebar-brand">PipeHeal</h1>
            <p className="sidebar-tagline">Autonomous DevOps</p>
          </div>
        </div>

        {/* Navigation */}
        <ul className="sidebar-nav">
          {navItems.map((item) => (
            <li 
              key={item.path} 
              style={{ position: 'relative' }} 
              onMouseEnter={() => handlePrefetch(item.path)}
              onFocus={() => handlePrefetch(item.path)}
            >
              <NavLink
                to={item.path}
                end={item.exact}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.div
                        layoutId="sidebarActiveTab"
                        className="sidebar-active-indicator"
                        initial={false}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span
                      className="material-symbols-outlined sidebar-link-icon"
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {item.icon}
                    </span>
                    <span className="sidebar-link-label">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Settings at bottom */}
        <div className="sidebar-footer">
          <div style={{ position: 'relative' }}>
            <NavLink
              to="/dashboard/settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveTab"
                      className="sidebar-active-indicator"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span
                    className="material-symbols-outlined sidebar-link-icon"
                    style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
                  >
                    settings
                  </span>
                  <span className="sidebar-link-label">Settings</span>
                </>
              )}
            </NavLink>
          </div>
          <button
            className="sidebar-link sidebar-logout-btn"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
          >
            <span className="material-symbols-outlined sidebar-link-icon">logout</span>
            <span className="sidebar-link-label">Logout</span>
          </button>
        </div>
      </nav>
    </>
  );
}
