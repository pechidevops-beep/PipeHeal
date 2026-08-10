import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React, { Suspense, lazy } from 'react';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PipelinesPage = lazy(() => import('./pages/PipelinesPage'));
const IncidentsPage = lazy(() => import('./pages/IncidentsPage'));
const SandboxPage = lazy(() => import('./pages/SandboxPage'));
const RepositoriesPage = lazy(() => import('./pages/RepositoriesPage'));
const AutoFixesPage = lazy(() => import('./pages/AutoFixesPage'));
const KnowledgeBasePage = lazy(() => import('./pages/KnowledgeBasePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NetworkPage = lazy(() => import('./pages/NetworkPage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));

// A global fallback skeleton for full page loads
const PageFallback = () => (
  <div style={{ padding: '32px', width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', gap: '24px', background: 'var(--bg-main, #0B0F19)' }}>
    <div style={{ width: '30%', height: '48px', background: '#111827', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
    <div style={{ width: '100%', height: '200px', background: '#111827', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <div style={{ height: '120px', background: '#111827', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ height: '120px', background: '#111827', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ height: '120px', background: '#111827', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
      <div style={{ height: '120px', background: '#111827', borderRadius: '12px', animation: 'shimmer 1.5s infinite' }} />
    </div>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageFallback />}>
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
            <Route path="network" element={<NetworkPage />} />
            <Route path="logs" element={<LogsPage />} />
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
      </Suspense>
    </BrowserRouter>
  );
}
