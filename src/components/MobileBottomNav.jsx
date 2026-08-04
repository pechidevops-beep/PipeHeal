import { NavLink } from 'react-router-dom';
import './MobileBottomNav.css';

const mobileNavItems = [
  { path: '/', icon: 'dashboard', label: 'Dash', exact: true },
  { path: '/incidents', icon: 'emergency_home', label: 'Incidents' },
  { path: '/pipelines', icon: 'account_tree', label: 'Pipelines' },
  { path: '/sandbox', icon: 'science', label: 'Sandbox' },
  { path: '/settings', icon: 'settings', label: 'Settings' },
];

export default function MobileBottomNav() {
  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {mobileNavItems.map(({ path, icon, label }) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={({ isActive }) =>
            `mobile-nav-item${isActive ? ' mobile-nav-item--active' : ''}`
          }
        >
          {({ isActive }) => (
            <>
              <span
                className="material-symbols-outlined mobile-nav-icon"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="mobile-nav-label">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
