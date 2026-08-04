import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/', icon: 'dashboard', label: 'Dashboard', exact: true },
  { path: '/pipelines', icon: 'account_tree', label: 'Pipelines' },
  { path: '/incidents', icon: 'emergency_home', label: 'AI Incidents' },
  { path: '/auto-fixes', icon: 'auto_fix', label: 'Auto Fixes' },
  { path: '/sandbox', icon: 'science', label: 'Sandbox' },
  { path: '/knowledge-base', icon: 'menu_book', label: 'Knowledge Base' },
  { path: '/repositories', icon: 'source', label: 'Repositories' },
];

export default function Sidebar() {
  return (
    <nav className="app-sidebar" aria-label="Sidebar Navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>
            terminal
          </span>
        </div>
        <div>
          <h1 className="sidebar-brand">PipeHeal</h1>
          <p className="sidebar-tagline">Autonomous DevOps</p>
        </div>
      </div>

      {/* Navigation */}
      <ul className="sidebar-nav">
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
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
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `sidebar-link${isActive ? ' sidebar-link--active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
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
        <button
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', marginTop: '4px', color: '#EF4444' }}
          onClick={() => {
            localStorage.removeItem('pipeheal_token');
            window.location.href = '/';
          }}
        >
          <span className="material-symbols-outlined sidebar-link-icon">logout</span>
          <span className="sidebar-link-label">Logout</span>
        </button>
      </div>
    </nav>
  );
}
