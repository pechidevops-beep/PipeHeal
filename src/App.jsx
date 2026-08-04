import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import DashboardPage from './pages/DashboardPage';
import PipelinesPage from './pages/PipelinesPage';
import IncidentsPage from './pages/IncidentsPage';
import SandboxPage from './pages/SandboxPage';
import RepositoriesPage from './pages/RepositoriesPage';
import AutoFixesPage from './pages/AutoFixesPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import SettingsPage from './pages/SettingsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* OAuth callback — outside AppLayout (no sidebar/topbar needed) */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/pipelines" element={<PipelinesPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/auto-fixes" element={<AutoFixesPage />} />
          <Route path="/sandbox" element={<SandboxPage />} />
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/repositories" element={<RepositoriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<PlaceholderPage title="Page Not Found" icon="search_off" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
