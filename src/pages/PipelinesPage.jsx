import { useState, useMemo } from 'react';
import { usePipelines } from '../hooks/usePipelines';
import { formatDistanceToNow, formatDuration, intervalToDuration } from 'date-fns';
import './PipelinesPage.css';

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status, conclusion) {
  if (status === 'IN_PROGRESS') return 'cyan';
  if (conclusion === 'success') return 'green';
  if (conclusion === 'failure' || conclusion === 'timed_out') return 'rose';
  if (conclusion === 'cancelled') return 'amber';
  return 'muted';
}

function statusIcon(status, conclusion) {
  if (status === 'IN_PROGRESS') return 'sync';
  if (conclusion === 'success') return 'check_circle';
  if (conclusion === 'failure' || conclusion === 'timed_out') return 'error';
  if (conclusion === 'cancelled') return 'cancel';
  return 'pending';
}

function durationLabel(ms) {
  if (!ms) return '—';
  if (ms < 1000) return `${ms}ms`;
  const secs = Math.floor(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return `${mins}m ${rem}s`;
}

// ── Pipeline Flow Graph ───────────────────────────────────────────────────────

function PipelineGraph({ steps }) {
  if (!steps || steps.length === 0) {
    return (
      <div className="pipeline-graph-empty">
        <span className="material-symbols-outlined">schema</span>
        No pipeline steps recorded
      </div>
    );
  }

  const nodeW = 120;
  const nodeH = 80;
  const gap = 60;
  const totalW = steps.length * (nodeW + gap);
  const cy = 80;

  return (
    <div className="pipeline-graph-scroll">
      <svg
        width={Math.max(totalW, 400)}
        height={nodeH + 80}
        className="pipeline-svg"
      >
        {/* Connector lines */}
        {steps.map((step, i) => {
          if (i === 0) return null;
          const x1 = (i - 1) * (nodeW + gap) + nodeW / 2;
          const x2 = i * (nodeW + gap) + nodeW / 2;
          const color =
            step.conclusion === 'success' ? '#10B981'
              : step.conclusion === 'failure' ? '#F43F5E'
                : '#424754';
          return (
            <line
              key={`line-${i}`}
              x1={x1 + nodeW / 2}
              y1={cy}
              x2={x2 - nodeW / 2}
              y2={cy}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={step.status === 'QUEUED' ? '6 4' : undefined}
            />
          );
        })}

        {/* Nodes */}
        {steps.map((step, i) => {
          const cx = i * (nodeW + gap) + nodeW / 2;
          const color =
            step.conclusion === 'success' ? '#10B981'
              : step.conclusion === 'failure' ? '#F43F5E'
                : step.status === 'IN_PROGRESS' ? '#4cd7f6'
                  : '#424754';

          return (
            <g key={step.id} transform={`translate(${cx - 24}, ${cy - 24})`}>
              <circle
                cx={24}
                cy={24}
                r={24}
                fill="#111827"
                stroke={color}
                strokeWidth={2}
              />
              {step.conclusion === 'success' && (
                <text x={24} y={30} textAnchor="middle" fill={color} fontSize={16} fontFamily="Material Symbols Outlined">
                  ✓
                </text>
              )}
              {step.conclusion === 'failure' && (
                <text x={24} y={30} textAnchor="middle" fill={color} fontSize={16}>✗</text>
              )}
              {step.status === 'IN_PROGRESS' && (
                <circle cx={24} cy={24} r={8} fill={color} opacity={0.7} />
              )}
              {step.status === 'QUEUED' && (
                <circle cx={24} cy={24} r={6} fill="#424754" />
              )}
              <text
                x={24}
                y={62}
                textAnchor="middle"
                fill="#9CA3AF"
                fontSize={10}
                fontFamily="Inter, sans-serif"
                fontWeight={600}
                style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
              >
                {step.stepName?.length > 12 ? step.stepName.substring(0, 12) + '…' : step.stepName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Log Drawer ────────────────────────────────────────────────────────────────

function LogDrawer({ run, onClose }) {
  if (!run) return null;
  return (
    <div className="log-drawer-overlay" onClick={onClose}>
      <div className="log-drawer" onClick={e => e.stopPropagation()}>
        <div className="log-drawer-header">
          <div>
            <h3 className="log-drawer-title">{run.workflowName}</h3>
            <p className="log-drawer-meta">
              {run.repository?.fullName} · {run.headBranch} · {run.headSha?.substring(0, 7)}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="log-drawer-body">
          {run.rawLogs ? (
            <pre className="log-content">{run.rawLogs}</pre>
          ) : (
            <div className="log-empty">
              <span className="material-symbols-outlined">terminal</span>
              No logs available for this run
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PipelinesPage() {
  const { pipelines, loading, error, refetch } = usePipelines();
  const [selectedRun, setSelectedRun] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // pipelines is now always an array from the fixed usePipelines hook
  const runs = useMemo(() => {
    const list = Array.isArray(pipelines) ? pipelines : [];
    let filtered = list;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.workflowName?.toLowerCase().includes(q) ||
        r.repository?.fullName?.toLowerCase().includes(q) ||
        r.headBranch?.toLowerCase().includes(q) ||
        r.headSha?.includes(q)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r =>
        statusFilter === 'failed'
          ? r.conclusion === 'failure' || r.conclusion === 'timed_out'
          : statusFilter === 'success'
            ? r.conclusion === 'success'
            : statusFilter === 'running'
              ? r.status === 'IN_PROGRESS'
              : true
      );
    }
    return filtered;
  }, [pipelines, search, statusFilter]);

  const latestRun = runs[0] ?? null;

  if (loading && runs.length === 0) {
    return (
      <div className="pipelines-page">
        <div className="pipelines-header-row skeleton-row">
          <div className="skeleton skeleton--title" />
          <div className="skeleton skeleton--btn" />
        </div>
        <div className="skeleton skeleton--hero" />
        <div className="skeleton skeleton--list" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pipelines-page">
        <div className="page-error-bar">
          <span className="material-symbols-outlined">error</span>
          Error loading pipelines: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="pipelines-page">
      {/* Header */}
      <div className="pipelines-header">
        <div>
          <h1 className="pipelines-title">Pipeline Monitor</h1>
          <p className="pipelines-subtitle">
            GitHub Actions workflow runs — real-time CI/CD visibility
          </p>
        </div>
        <button className="btn-outline" onClick={refetch}>
          <span className="material-symbols-outlined">refresh</span>
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="pipelines-controls">
        <div className="repos-search">
          <span className="material-symbols-outlined repos-search-icon">search</span>
          <input
            type="text"
            placeholder="Search workflows, repos, branches..."
            className="repos-search-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="repos-filters">
          {['all', 'running', 'success', 'failed'].map(f => (
            <button
              key={f}
              className={`filter-btn${statusFilter === f ? ' filter-btn--active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Empty */}
      {runs.length === 0 && (
        <div className="pipelines-empty">
          <div className="repos-empty-icon">
            <span className="material-symbols-outlined">schema</span>
          </div>
          <h3 className="repos-empty-title">No pipeline runs yet</h3>
          <p className="repos-empty-desc">
            Connect a repository and push to GitHub to see your CI/CD workflows here.
          </p>
        </div>
      )}

      {/* Pipeline runs list */}
      {runs.length > 0 && (
        <div className="pipeline-runs-list">
          {runs.map(run => {
            const color = statusColor(run.status, run.conclusion);
            const icon = statusIcon(run.status, run.conclusion);
            const durationMs = run.parsedMetadata?.durationMs;

            return (
              <div
                key={run.id}
                className={`pipeline-run-card pipeline-run-card--${color}`}
                onClick={() => setSelectedRun(run)}
              >
                {/* Run status icon */}
                <div className={`run-status-icon run-status-icon--${color}`}>
                  <span
                    className="material-symbols-outlined"
                    style={run.status === 'IN_PROGRESS' ? { animation: 'spin-anim 2s linear infinite' } : {}}
                  >
                    {icon}
                  </span>
                </div>

                {/* Main info */}
                <div className="run-info">
                  <div className="run-top-row">
                    <span className="run-workflow-name">
                      {run.workflowName?.includes('.github/workflows/') 
                        ? run.workflowName.split('/').pop().replace('.yml', '').replace('.yaml', '')
                        : run.workflowName}
                    </span>
                    <span className={`run-conclusion run-conclusion--${color}`}>
                      {run.status === 'IN_PROGRESS' ? 'Running' : (run.conclusion || run.status)}
                    </span>
                  </div>
                  <div className="run-meta">
                    <span className="run-meta-item">
                      <span className="material-symbols-outlined">source</span>
                      {run.repository?.fullName || '—'}
                    </span>
                    <span className="run-meta-item">
                      <span className="material-symbols-outlined">commit</span>
                      {run.headBranch}
                    </span>
                    <span className="run-meta-item run-sha">
                      {run.headSha?.substring(0, 7)}
                    </span>
                    {run.parsedMetadata?.actor && (
                      <span className="run-meta-item">
                        <span className="material-symbols-outlined">person</span>
                        {run.parsedMetadata.actor}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side stats */}
                <div className="run-stats">
                  <div className="run-stat">
                    <span className="run-stat-label">Duration</span>
                    <span className="run-stat-value">{durationLabel(durationMs)}</span>
                  </div>
                  {run.parsedMetadata?.jobsCount != null && (
                    <div className="run-stat">
                      <span className="run-stat-label">Jobs</span>
                      <span className="run-stat-value">{run.parsedMetadata.jobsCount}</span>
                    </div>
                  )}
                  <div className="run-stat">
                    <span className="run-stat-label">When</span>
                    <span className="run-stat-value">
                      {run.createdAt
                        ? formatDistanceToNow(new Date(run.createdAt), { addSuffix: true })
                        : '—'}
                    </span>
                  </div>
                  <button
                    className="run-logs-btn"
                    onClick={e => { e.stopPropagation(); setSelectedRun(run); }}
                    title="View logs"
                  >
                    <span className="material-symbols-outlined">terminal</span>
                    Logs
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log drawer */}
      {selectedRun && (
        <LogDrawer run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}
    </div>
  );
}
