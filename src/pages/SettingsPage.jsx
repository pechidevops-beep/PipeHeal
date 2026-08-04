import { useState } from 'react';
import useRepositories from '../hooks/useRepositories';
import './SettingsPage.css';

export default function SettingsPage() {
  const { repositories, loading } = useRepositories();
  const [activeTab, setActiveTab] = useState('ai');
  const [geminiKey, setGeminiKey] = useState('************************');

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Configure PipeHeal integrations, AI models, and preferences.</p>
      </div>

      <div className="settings-layout">
        {/* Sidebar Nav */}
        <aside className="settings-sidebar">
          <button 
            className={`settings-nav-btn ${activeTab === 'ai' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai')}
          >
            <span className="material-symbols-outlined">smart_toy</span>
            AI Providers
          </button>
          <button 
            className={`settings-nav-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <span className="material-symbols-outlined">campaign</span>
            Notifications
          </button>
        </aside>

        {/* Content Area */}
        <main className="settings-content">
          {activeTab === 'ai' && (
            <div className="settings-section">
              <h2>AI Providers</h2>
              <p className="settings-description">Manage API keys for the language models that power Auto-Fix.</p>
              
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="provider-logo gemini">G</div>
                  <div>
                    <h3>Google Gemini</h3>
                    <p>Primary model for diagnosis and patch generation.</p>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>API Key</label>
                  <input 
                    type="password" 
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="settings-input"
                  />
                </div>
                <button className="settings-btn-primary">Save Key</button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h2>Notifications</h2>
              <p className="settings-description">Configure where PipeHeal sends alerts when pipelines fail or patches are generated.</p>
              
              <div className="settings-card">
                <div className="settings-card-header">
                  <div className="provider-logo slack">S</div>
                  <div>
                    <h3>Slack Webhook</h3>
                    <p>Send a message to a Slack channel when an incident occurs.</p>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>Webhook URL</label>
                  <input 
                    type="url" 
                    placeholder="https://hooks.slack.com/services/..."
                    className="settings-input"
                  />
                </div>
                <button className="settings-btn-primary">Connect Slack</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
