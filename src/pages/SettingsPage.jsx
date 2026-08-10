import { useState, useEffect } from 'react';
import { api } from '../services/api/api';
import useRepositories from '../hooks/useRepositories';
import './SettingsPage.css';
import { useAuth } from '../contexts/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  // State for forms
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
  const [password, setPassword] = useState({ oldPassword: '', newPassword: '' });
  const [aiKey, setAiKey] = useState('');
  const [notifications, setNotifications] = useState({ notifyOnNewIncident: true });
  const [usage, setUsage] = useState(null);
  
  // State for feedback
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName || '', lastName: user.lastName || '', email: user.email || '' });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'usage' && !usage) {
      api.getUsage().then(res => setUsage(res.data?.usage)).catch(console.error);
    }
    if (activeTab === 'notifications') {
      api.getNotifications().then(res => setNotifications(res.data?.settings)).catch(console.error);
    }
  }, [activeTab]);

  const handleSave = async (action, data) => {
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (action === 'profile') await api.updateProfile(data);
      else if (action === 'password') await api.updatePassword(data.oldPassword, data.newPassword);
      else if (action === 'ai') await api.testAiProvider('gemini', data.aiKey);
      else if (action === 'notifications') await api.updateNotifications(data);
      
      setSuccessMsg('Settings saved successfully.');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'An error occurred while saving.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      window.location.href = '/login';
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to delete account.');
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account settings and preferences.</p>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar">
          <button className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span className="material-symbols-outlined">person</span> Profile
          </button>
          <button className={`settings-nav-btn ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <span className="material-symbols-outlined">shield</span> Account & Security
          </button>
          <button className={`settings-nav-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
            <span className="material-symbols-outlined">smart_toy</span> AI Providers
          </button>
          <button className={`settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span className="material-symbols-outlined">campaign</span> Notifications
          </button>
          <button className={`settings-nav-btn ${activeTab === 'usage' ? 'active' : ''}`} onClick={() => setActiveTab('usage')}>
            <span className="material-symbols-outlined">data_usage</span> Usage & Limits
          </button>
          <div className="settings-nav-divider" />
          <button className={`settings-nav-btn danger-btn ${activeTab === 'danger' ? 'active' : ''}`} onClick={() => setActiveTab('danger')}>
            <span className="material-symbols-outlined">warning</span> Danger Zone
          </button>
        </aside>

        <main className="settings-content">
          {successMsg && <div className="settings-alert success">{successMsg}</div>}
          {errorMsg && <div className="settings-alert error">{errorMsg}</div>}

          {activeTab === 'profile' && (
            <div className="settings-section">
              <h2>Profile</h2>
              <p className="settings-description">Update your personal information.</p>
              <div className="settings-card premium-card">
                <div className="settings-form-group">
                  <label>First Name</label>
                  <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="premium-input" />
                </div>
                <div className="settings-form-group">
                  <label>Last Name</label>
                  <input type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="premium-input" />
                </div>
                <div className="settings-form-group">
                  <label>Email Address</label>
                  <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="premium-input" />
                </div>
                <button className="premium-button" onClick={() => handleSave('profile', profile)} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h2>Account & Security</h2>
              <p className="settings-description">Manage your password and connected accounts.</p>
              <div className="settings-card premium-card">
                <h3>Change Password</h3>
                <div className="settings-form-group" style={{ marginTop: '16px' }}>
                  <label>Current Password</label>
                  <input type="password" value={password.oldPassword} onChange={e => setPassword({...password, oldPassword: e.target.value})} className="premium-input" />
                </div>
                <div className="settings-form-group">
                  <label>New Password</label>
                  <input type="password" value={password.newPassword} onChange={e => setPassword({...password, newPassword: e.target.value})} className="premium-input" />
                </div>
                <button className="premium-button" onClick={() => handleSave('password', password)} disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="settings-section">
              <h2>AI Providers</h2>
              <p className="settings-description">Manage API keys for the language models.</p>
              <div className="settings-card premium-card">
                <div className="settings-card-header">
                  <div className="provider-logo gemini">G</div>
                  <div>
                    <h3>Google Gemini</h3>
                    <p>Primary model for diagnosis and patch generation.</p>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>API Key</label>
                  <input type="password" value={aiKey} onChange={e => setAiKey(e.target.value)} placeholder="AIzaSy..." className="premium-input" />
                </div>
                <button className="premium-button" onClick={() => handleSave('ai', { aiKey })} disabled={loading}>
                  {loading ? 'Testing & Saving...' : 'Save & Verify Key'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notifications</h2>
              <p className="settings-description">Configure alert preferences.</p>
              <div className="settings-card premium-card">
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: '#F9FAFB' }}>
                  <input type="checkbox" checked={notifications.notifyOnNewIncident || false} onChange={e => setNotifications({...notifications, notifyOnNewIncident: e.target.checked})} />
                  Notify me on new incidents
                </label>
                <button className="premium-button" style={{ marginTop: '24px' }} onClick={() => handleSave('notifications', notifications)} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="settings-section">
              <h2>Usage & Limits</h2>
              <p className="settings-description">Monitor your auto-fix usage.</p>
              {usage ? (
                <div className="settings-card premium-card">
                  <h3>Plan: {usage.currentPlan}</h3>
                  <div style={{ marginTop: '16px', background: '#111827', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>Auto Fixes Used</span>
                      <span>{usage.autoFixesUsed} / {usage.autoFixesLimit}</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#374151', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(usage.autoFixesUsed / usage.autoFixesLimit) * 100}%`, height: '100%', background: '#3B82F6' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="skeleton" style={{ height: '150px' }} />
              )}
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="settings-section">
              <h2 style={{ color: '#EF4444' }}>Danger Zone</h2>
              <p className="settings-description">Irreversible actions for your account.</p>
              <div className="settings-card premium-card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                <h3>Delete Account</h3>
                <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '16px' }}>
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="ghost-button" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => setShowDeleteModal(true)}>
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content premium-card">
            <h2 style={{ color: '#EF4444', margin: '0 0 16px 0' }}>Confirm Deletion</h2>
            <p style={{ marginBottom: '24px', color: '#D1D5DB' }}>
              Are you absolutely sure you want to delete your account? This action cannot be undone and will erase all your repositories, incidents, and data.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button className="ghost-button" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="premium-button" style={{ background: '#EF4444' }} onClick={handleDeleteAccount}>
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
