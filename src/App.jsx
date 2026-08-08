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

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing & Auth */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        
        {/* OAuth callback — outside AppLayout */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Dashboard Layout */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
          <Route path="pipelines" element={<PipelinesPage />} />
          <Route path="network" element={<PlaceholderPage title="Network Overview" icon="hub" />} />
          <Route path="logs" element={<PlaceholderPage title="System Logs" icon="terminal" />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="auto-fixes" element={<AutoFixesPage />} />
          <Route path="sandbox" element={<SandboxPage />} />
          <Route path="knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="repositories" element={<RepositoriesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<PlaceholderPage title="Page Not Found" icon="search_off" />} />
          </Route>
        </Route>
        
        {/* Fallback for completely unknown routes */}
        <Route path="*" element={<PlaceholderPage title="404 Not Found" icon="search_off" />} />
      </Routes>
    </BrowserRouter>
  );
}
