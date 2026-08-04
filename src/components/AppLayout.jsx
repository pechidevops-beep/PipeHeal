import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileBottomNav from './MobileBottomNav';
import { Outlet } from 'react-router-dom';
import './AppLayout.css';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <TopBar />
        <main className="app-main">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
