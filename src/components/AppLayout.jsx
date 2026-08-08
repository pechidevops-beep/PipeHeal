import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { Outlet } from 'react-router-dom';
import './AppLayout.css';

export default function AppLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      <div className="app-content">
        <TopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
