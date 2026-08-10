import { useState, useMemo } from 'react';
import { useRepositories } from '../hooks/useRepositories';
import { formatDistanceToNow } from 'date-fns';
import './RepositoriesPage.css';

// ── Sub-components ───────────────────────────────────────────────────────────

function ConnectModal({ onClose, githubRepos, githubLoading, onFetch, onConnect, tracked }) {
  const [search, setSearch] = useState('');
  const [connecting, setConnecting] = useState(null);

  const trackedSet = new Set((tracked || []).map(r => r.fullName));

  const filtered = useMemo(() => {
    if (!search) return githubRepos;
    const q = search.toLowerCase();
    return githubRepos.filter(r =>
      r.full_name?.toLowerCase().includes(q) ||
      r.name?.toLowerCase().includes(q) ||
      r.owner?.login?.toLowerCase().includes(q)
    );
  }, [githubRepos, search]);

  const handleConnect = async (fullName) => {
    setConnecting(fullName);
    try {
      await onConnect(fullName);
      onClose();
    } catch (err) {
      console.error('Failed to connect repo:', err);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Connect GitHub Repository</h3>
            <p className="modal-subtitle">Select a repository to track in PipeHeal</p>
          </div>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modal-search-row">
          <div className="modal-search">
            <span className="material-symbols-outlined modal-search-icon">search</span>
            <input
              type="text"
              placeholder="Search repositories..."
              className="modal-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <button className="btn-icon-outline" onClick={onFetch} title="Refresh from GitHub">
            <span className={`material-symbols-outlined ${githubLoading ? 'spin-icon' : ''}`}>refresh</span>
          </button>
        </div>

        <div className="modal-repo-list">
          {githubLoading && githubRepos.length === 0 ? (
            <div className="modal-empty">
              <span className="material-symbols-outlined spin-icon">sync</span>
              <span>Loading your GitHub repositories...</span>
            </div>
          ) : !localStorage.getItem('pipeheal_token') ? (
            <div className="modal-empty">
              <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px' }}>account_circle</span>
              <span>You must connect your GitHub account first.</span>
              <button 
                className="btn-primary" 
                style={{ marginTop: '16px' }}
                onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/auth/github`}
              >
                Login with GitHub
              </button>
            </div>
          ) : githubRepos.length === 0 ? (
            <div className="modal-empty">
              <span className="material-symbols-outlined">info</span>
              <span>Click "Refresh" to load your GitHub repositories. (Or ensure PipeHeal is authorized).</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="modal-empty">No matching repositories found.</div>
          ) : (
            filtered.map(repo => {
              const isTracked = trackedSet.has(repo.full_name);
              const isConnecting = connecting === repo.full_name;
              return (
                <div key={repo.id} className={`modal-repo-item${isTracked ? ' modal-repo-item--tracked' : ''}`}>
                  <div className="modal-repo-info">
                    <div className="modal-repo-name">
                      <span className="material-symbols-outlined modal-repo-icon">source</span>
                      <span className="modal-repo-full">{repo.full_name}</span>
                      {repo.private && (
                        <span className="repo-badge repo-badge--private">Private</span>
                      )}
                    </div>
                    {repo.description && (
                      <p className="modal-repo-desc">{repo.description}</p>
                    )}
                    <div className="modal-repo-meta">
                      <span>{repo.default_branch || 'main'}</span>
                      {repo.language && <span>· {repo.language}</span>}
                    </div>
                  </div>
                  <button
                    className={`btn-connect${isTracked ? ' btn-connect--tracked' : ''}`}
                    onClick={() => !isTracked && !isConnecting && handleConnect(repo.full_name)}
                    disabled={isTracked || isConnecting}
                  >
                    {isConnecting
                      ? 'Connecting...'
                      : isTracked
                        ? 'Connected'
                        : 'Connect'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function WebhookBadge({ active, webhookId }) {
  if (!webhookId) {
    return <span className="pill pill-muted">No Webhook</span>;
  }
  return active
    ? <span className="pill pill-green">Active</span>
    : <span className="pill pill-amber">Inactive</span>;
}

function VisibilityBadge({ isPrivate }) {
  return isPrivate
    ? <span className="pill pill-purple">Private</span>
    : <span className="pill pill-blue">Public</span>;
}

function PipelineStatusBadge({ count }) {
  if (!count || count === 0) return <span className="pill pill-muted">No Runs</span>;
  return <span className="pill pill-cyan">{count} runs</span>;
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function RepositoriesPage() {
  const {
    repositories,
    total,
    loading,
    error,
    githubRepos,
    githubLoading,
    refetch,
    fetchGithubRepos,
    addRepository,
    removeRepository,
    syncRepository,
    toggleAutoFix,
  } = useRepositories();

  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | inactive | public | private
  const [removing, setRemoving] = useState(null);
  const [syncing, setSyncing] = useState(null);

  const filtered = useMemo(() => {
    let list = [...repositories];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.fullName?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.owner?.toLowerCase().includes(q)
      );
    }
    if (filter === 'active') list = list.filter(r => r.webhookActive);
    if (filter === 'inactive') list = list.filter(r => !r.webhookActive);
    if (filter === 'public') list = list.filter(r => !r.private);
    if (filter === 'private') list = list.filter(r => r.private);
    return list;
  }, [repositories, search, filter]);

  const handleOpenModal = async () => {
    setShowModal(true);
    if (githubRepos.length === 0) {
      await fetchGithubRepos();
    }
  };

  const handleRemove = async (id, fullName) => {
    if (!window.confirm(`Remove ${fullName} from PipeHeal? This will also delete the GitHub webhook.`)) return;
    setRemoving(id);
    try {
      await removeRepository(id);
    } catch (err) {
      console.error('Remove failed:', err);
    } finally {
      setRemoving(null);
    }
  };

  const handleSync = async (id) => {
    setSyncing(id);
    try {
      await syncRepository(id);
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="repos-page">
        <div className="repos-header-row skeleton-row">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--btn" />
        </div>
        <div className="repos-table-wrapper">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton skeleton--row" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="repos-page">
        <div className="page-error">
          <span className="material-symbols-outlined">error</span>
          Error loading repositories: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="repos-page">
      {/* Page Header */}
      <div className="repos-header">
        <div>
          <h1 className="repos-title">Repositories</h1>
          <p className="repos-subtitle">
            {total} connected {total === 1 ? 'repository' : 'repositories'} — GitHub webhooks active
          </p>
        </div>
        <div className="repos-header-actions">
          <button className="btn-outline" onClick={refetch} title="Refresh list">
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
          <button className="premium-button" onClick={handleOpenModal}>
            <span className="material-symbols-outlined">add_link</span>
            Connect GitHub
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="repos-controls">
        <div className="repos-search">
          <span className="material-symbols-outlined repos-search-icon">search</span>
          <input
            type="text"
            placeholder="Search repositories..."
            className="repos-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="repos-filters">
          {['all', 'active', 'inactive', 'public', 'private'].map(f => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="repos-empty">
          <div className="repos-empty-icon">
            <span className="material-symbols-outlined empty-icon-float">source</span>
          </div>
          <h3 className="repos-empty-title">
            {repositories.length === 0 ? 'No repositories connected yet' : 'No matching repositories'}
          </h3>
          <p className="repos-empty-desc">
            {repositories.length === 0
              ? 'Connect a GitHub repository to start monitoring pipelines and incidents.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {repositories.length === 0 && (
            <button className="premium-button" onClick={handleOpenModal}>
              <span className="material-symbols-outlined">add_link</span>
              Connect GitHub Repository
            </button>
          )}
        </div>
      ) : (
        <div className="repos-table-wrapper">
          {/* Table header */}
          <div className="repos-table-header">
            <div className="col-repo">Repository</div>
            <div className="col-branch">Branch</div>
            <div className="col-language">Language</div>
            <div className="col-visibility">Visibility</div>
            <div className="col-webhook">Webhook</div>
            <div className="col-pipeline">Pipelines</div>
            <div className="col-incident">Incidents</div>
            <div className="col-sync">Last Sync</div>
            <div className="col-actions">Actions</div>
          </div>

          {/* Table rows */}
          <div className="repos-table-body">
            {filtered.map(repo => (
              <div key={repo.id} className="repos-table-row">
                {/* Repository name */}
                <div className="col-repo">
                  <div className="repo-name-cell">
                    <div className="repo-icon">
                      <span className="material-symbols-outlined">source</span>
                    </div>
                    <div>
                      <div className="repo-full-name">{repo.fullName}</div>
                      {repo.description && (
                        <div className="repo-description">{repo.description}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="repo-metrics">
                  {/* Branch */}
                  <div className="col-branch">
                    <span className="branch-tag">
                      <span className="material-symbols-outlined">commit</span>
                      {repo.defaultBranch}
                    </span>
                  </div>

                  {/* Language */}
                  <div className="col-language">
                    <span className="pill pill-muted">{repo.language || 'N/A'}</span>
                  </div>

                  {/* Visibility */}
                  <div className="col-visibility">
                    <VisibilityBadge isPrivate={repo.private} />
                  </div>

                  {/* Webhook */}
                  <div className="col-webhook">
                    <WebhookBadge active={repo.webhookActive} webhookId={repo.webhookId} />
                  </div>

                  {/* Pipeline runs count */}
                  <div className="col-pipeline">
                    <PipelineStatusBadge count={repo._count?.workflowRuns} />
                  </div>

                  {/* Incidents count */}
                  <div className="col-incident">
                    {repo._count?.incidents > 0 ? (
                      <span className="pill pill-amber">{repo._count?.incidents} alerts</span>
                    ) : (
                      <span className="pill pill-muted">None</span>
                    )}
                  </div>

                  {/* Last sync */}
                  <div className="col-sync">
                    <span className="time-label">
                      {repo.updatedAt
                        ? formatDistanceToNow(new Date(repo.updatedAt), { addSuffix: true })
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="col-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '16px' }}>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={repo.autoFixEnabled} 
                        onChange={(e) => toggleAutoFix(repo.id, e.target.checked)}
                        disabled={syncing === repo.id}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Auto-Fix</span>
                  </div>
                  <button
                    className="row-action-btn"
                    onClick={() => handleSync(repo.id)}
                    disabled={syncing === repo.id}
                    title="Sync from GitHub"
                  >
                    <span className={`material-symbols-outlined ${syncing === repo.id ? 'spin-icon' : ''}`}>
                      sync
                    </span>
                  </button>
                  <a
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="row-action-btn"
                    title="Open in GitHub"
                  >
                    <span className="material-symbols-outlined">open_in_new</span>
                  </a>
                  <button
                    className="row-action-btn row-action-btn--danger"
                    onClick={() => handleRemove(repo.id, repo.fullName)}
                    disabled={removing === repo.id}
                    title="Remove repository"
                  >
                    <span className="material-symbols-outlined">
                      {removing === repo.id ? 'hourglass_empty' : 'link_off'}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connect Modal */}
      {showModal && (
        <ConnectModal
          onClose={() => setShowModal(false)}
          githubRepos={githubRepos}
          githubLoading={githubLoading}
          onFetch={fetchGithubRepos}
          onConnect={addRepository}
          tracked={repositories}
        />
      )}
    </div>
  );
}
