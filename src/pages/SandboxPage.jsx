import { useState, useMemo } from 'react';
import { useSandbox } from '../hooks/useSandbox';
import { formatDistanceToNow } from 'date-fns';
import './SandboxPage.css';

// ── Diff viewer ───────────────────────────────────────────────────────────────

function DiffLine({ line }) {
  const isAdd = line.startsWith('+') && !line.startsWith('+++');
  const isDel = line.startsWith('-') && !line.startsWith('---');
  const isHunk = line.startsWith('@@');
  const isHeader = line.startsWith('+++') || line.startsWith('---');

  const cls = isAdd ? 'diff-add'
    : isDel ? 'diff-del'
      : isHunk ? 'diff-hunk'
        : isHeader ? 'diff-header'
          : 'diff-ctx';

  return <div className={`diff-line ${cls}`}>{line}</div>;
}

function PatchDiff({ patch }) {
  if (!patch) {
    return (
      <div className="sandbox-empty-diff">
        <span className="material-symbols-outlined">code_off</span>
        No patch generated yet
      </div>
    );
  }

  const diff = patch.diff || '';
  const lines = diff.split('\n');

  return (
    <div className="patch-diff-viewer">
      <div className="patch-diff-header">
        <span className="material-symbols-outlined">difference</span>
        {patch.filePath}
        {patch.description && <span className="patch-desc">{patch.description}</span>}
      </div>
      <div className="patch-diff-body">
        {lines.length > 0 && diff
          ? lines.map((l, i) => <DiffLine key={i} line={l} />)
          : <p className="patch-fallback">{patch.description || 'No diff content'}</p>
        }
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function Timeline({ run }) {
  const steps = [
    {
      label: 'Sandbox Provisioned',
      desc: 'Container initialized',
      done: !!run,
      icon: 'start',
    },
    {
      label: 'Repository Cloned',
      desc: 'Source code copied into container',
      done: run?.status !== 'PENDING',
      icon: 'download',
    },
    {
      label: 'Patch Applied',
      desc: 'AI-generated fix applied',
      done: run?.status !== 'PENDING' && run?.status !== 'RUNNING',
      icon: 'build',
      ai: true,
    },
    {
      label: 'Tests Executed',
      desc: 'Test suite executed in isolated env',
      done: run?.status === 'PASSED' || run?.status === 'FAILED' || run?.status === 'ERROR',
      icon: 'science',
    },
    {
      label: 'Verification Complete',
      desc: 'Container destroyed, results collected',
      done: run?.status === 'PASSED',
      icon: 'verified',
    },
  ];

  return (
    <div className="sandbox-timeline">
      {steps.map((step, idx) => (
        <div key={idx} className="timeline-step">
          <div className="timeline-track">
            <div className={`timeline-dot ${step.done ? (step.ai ? 'timeline-dot--ai' : 'timeline-dot--done') : 'timeline-dot--pending'}`}>
              <span className="material-symbols-outlined">{step.done ? 'check' : 'pending'}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`timeline-line ${step.done ? 'timeline-line--done' : ''}`} />
            )}
          </div>
          <div className="timeline-content">
            <h4 className={`timeline-label ${step.done ? 'timeline-label--done' : ''}`}>{step.label}</h4>
            <p className="timeline-desc">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Log viewer ────────────────────────────────────────────────────────────────

function LogViewer({ logs, status }) {
  if (!logs) {
    return (
      <div className="log-placeholder">
        {status === 'RUNNING'
          ? <><span className="material-symbols-outlined spin-icon">sync</span> Waiting for output...</>
          : <><span className="material-symbols-outlined">terminal</span> No logs available</>
        }
      </div>
    );
  }
  return <pre className="sandbox-log-content">{logs}</pre>;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SandboxPage() {
  const { sandboxRuns, loading, error, refetch } = useSandbox();
  const [selectedRunId, setSelectedRunId] = useState(null);

  const runs = useMemo(() =>
    Array.isArray(sandboxRuns) ? sandboxRuns : [],
    [sandboxRuns]
  );

  const selectedRun = useMemo(() =>
    selectedRunId
      ? runs.find(r => r.id === selectedRunId)
      : runs[0] ?? null,
    [selectedRunId, runs]
  );

  const latestPatch = selectedRun?.incident?.patches?.[0] ?? null;

  if (loading && runs.length === 0) {
    return (
      <div className="sandbox-page">
        <div className="skeleton sandbox-skeleton-title" />
        <div className="sandbox-two-col">
          <div className="skeleton sandbox-skeleton-left" />
          <div className="skeleton sandbox-skeleton-right" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sandbox-page">
        <div className="page-error-bar">
          <span className="material-symbols-outlined">error</span>
          Error loading sandbox runs: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="sandbox-page">
      {/* Header */}
      <div className="sandbox-header">
        <div>
          <h2 className="sandbox-title">Sandbox Verification</h2>
          <p className="sandbox-subtitle">
            Isolated Docker environment for patch testing
            {selectedRun && ` — Incident #${selectedRun.incidentId?.substring(0, 6)}`}
          </p>
        </div>
        <div className="sandbox-header-actions">
          <button className="btn-outline" onClick={refetch}>
            <span className="material-symbols-outlined">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Run selector tabs (if multiple runs) */}
      {runs.length > 1 && (
        <div className="sandbox-run-tabs">
          {runs.slice(0, 6).map(run => (
            <button
              key={run.id}
              className={`run-tab${selectedRun?.id === run.id ? ' run-tab--active' : ''} run-tab--${run.status?.toLowerCase()}`}
              onClick={() => setSelectedRunId(run.id)}
            >
              <span className="material-symbols-outlined">
                {run.status === 'PASSED' ? 'check_circle'
                  : run.status === 'FAILED' ? 'cancel'
                    : run.status === 'RUNNING' ? 'sync'
                      : 'pending'}
              </span>
              {run.id.substring(0, 6)}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {runs.length === 0 ? (
        <div className="sandbox-empty">
          <div className="sandbox-empty-icon">
            <span className="material-symbols-outlined">science</span>
          </div>
          <h3 className="sandbox-empty-title">No sandbox runs yet</h3>
          <p className="sandbox-empty-desc">
            After AI generates a patch for an incident, click "Verify in Sandbox" to test it here.
          </p>
        </div>
      ) : (
        <div className="sandbox-two-col">
          {/* Left column: Timeline + Logs */}
          <div className="sandbox-left-col">
            {/* Status banner */}
            {selectedRun && (
              <div className={`sandbox-status-banner sandbox-status-banner--${selectedRun.status?.toLowerCase()}`}>
                <span className="material-symbols-outlined">
                  {selectedRun.status === 'PASSED' ? 'verified'
                    : selectedRun.status === 'FAILED' ? 'cancel'
                      : selectedRun.status === 'RUNNING' ? 'sync'
                        : 'hourglass_empty'}
                </span>
                <div>
                  <div className="banner-status">{selectedRun.status}</div>
                  <div className="banner-detail">
                    {selectedRun.duration ? `${selectedRun.duration}ms` : 'Running...'}
                    {selectedRun.exitCode != null && ` · Exit code: ${selectedRun.exitCode}`}
                  </div>
                </div>
                {selectedRun.createdAt && (
                  <span className="banner-time">
                    {formatDistanceToNow(new Date(selectedRun.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
            )}

            {/* Timeline */}
            <div className="sandbox-panel">
              <h3 className="sandbox-panel-title">
                <span className="material-symbols-outlined">timeline</span>
                Execution Timeline
              </h3>
              <Timeline run={selectedRun} />
            </div>

            {/* Container logs */}
            <div className="sandbox-panel sandbox-panel--logs">
              <div className="sandbox-log-header">
                <h3 className="sandbox-panel-title">
                  <span className="material-symbols-outlined">terminal</span>
                  Container Output
                </h3>
                <div className="terminal-dots">
                  <span className="tdot tdot--red" />
                  <span className="tdot tdot--yellow" />
                  <span className="tdot tdot--green" />
                </div>
              </div>
              <div className="sandbox-log-body">
                <LogViewer logs={selectedRun?.logs} status={selectedRun?.status} />
              </div>
            </div>
          </div>

          {/* Right column: Patch diff */}
          <div className="sandbox-right-col">
            <div className="sandbox-panel sandbox-panel--diff">
              <div className="diff-panel-header">
                <div>
                  <h3 className="sandbox-panel-title">
                    <span className="material-symbols-outlined">difference</span>
                    Patch Diff Review
                  </h3>
                  <p className="sandbox-panel-subtitle">AI-generated changes to be applied</p>
                </div>
              </div>
              <div className="diff-panel-body">
                <PatchDiff patch={latestPatch} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
