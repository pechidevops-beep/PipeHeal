import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * AuthCallbackPage
 * GitHub OAuth redirects here with ?token=JWT&refresh=REFRESH&login=user
 * We save the tokens and redirect to the dashboard.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refresh = params.get('refresh');
    const login = params.get('login');
    const err = params.get('error');

    if (err) {
      setError(decodeURIComponent(err));
      setStatus('Authentication failed');
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token) {
      localStorage.setItem('pipeheal_token', token);
      if (refresh) localStorage.setItem('pipeheal_refresh_token', refresh);
      if (login) localStorage.setItem('pipeheal_login', login);
      setStatus(`Welcome, ${login || 'user'}! Redirecting to dashboard...`);
      setTimeout(() => navigate('/dashboard'), 1000);
    } else {
      setError('No authentication token received');
      setTimeout(() => navigate('/'), 3000);
    }
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      background: '#0a0d18',
      color: '#F9FAFB',
      fontFamily: 'Inter, sans-serif',
    }}>
      {error ? (
        <>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#F43F5E' }}>error</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Authentication Failed</h2>
          <p style={{ color: '#9CA3AF', margin: 0 }}>{error}</p>
          <p style={{ color: '#9CA3AF', fontSize: 13 }}>Redirecting to login...</p>
        </>
      ) : (
        <>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#adc6ff', animation: 'spin 1s linear infinite' }}>sync</span>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>GitHub OAuth</h2>
          <p style={{ color: '#9CA3AF', margin: 0 }}>{status}</p>
        </>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
