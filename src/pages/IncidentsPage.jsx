import { useState, useEffect } from 'react';
import { useIncidents } from '../hooks/useIncidents';
import { api } from '../services/api/api';
import { formatDistanceToNow } from 'date-fns';
import './IncidentsPage.css';

// ── PR Modal ──────────────────────────────────────────────────────────────────

function PRModal({ incident, onClose, onSubmit }) {
  const patches = incident?.patches ?? [];
  const diagnoses = incident?.diagnoses ?? [];
  const latestPatch = patches[0];
  const latestDiag = diagnoses[0];

  const [headBranch, setHeadBranch] = useState('pipeheal-fix');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(
        incident.id,
        `Fix: ${incident.title}`,
        latestDiag?.summary || 'AI-generated fix',
        headBranch,
        incident.workflowRun?.headBranch || 'main'
      );
      onClose();
    } catch (err) {
      console.error('PR creation failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="inc-modal-overlay" onClick={onClose}>
      <div className="inc-modal" onClick={e => e.stopPropagation()}>
        <div className="inc-modal-header">
          <div>
            <h3 className="inc-modal-title">Create Draft Pull Request</h3>
            <p className="inc-modal-subtitle">Review the patch before opening a GitHub PR</p>
          </div>
          <button className="inc-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="inc-modal-body">
          {latestDiag && (
            <div className="inc-modal-section">
              <h4 className="inc-modal-section-title">
                <span className="material-symbols-outlined">troubleshoot</span>
                Diagnosis Summary
              </h4>
              <p className="inc-modal-text">{latestDiag.summary}</p>
              <div className="inc-modal-meta-row">
                <span className="inc-meta-chip">Confidence: {Math.round((latestDiag.confidence || 0) * 100)}%</span>
                <span className="inc-meta-chip">AI: {latestDiag.aiModel}</span>
                <span className={`inc-meta-chip${latestDiag.autoFixable ? ' inc-meta-chip--green' : ''}`}>
                  {latestDiag.autoFixable ? 'Auto-fixable' : 'Manual review required'}
                </span>
              </div>
            </div>
          )}

          {latestPatch && (
            <div className="inc-modal-section">
              <h4 className="inc-modal-section-title">
                <span className="material-symbols-outlined">code</span>
                Patch — {latestPatch.filePath}
              </h4>
              <div className="inc-diff-box">
                <pre className="inc-diff-content">{latestPatch.diff || latestPatch.description}</pre>
              </div>
            </div>
          )}

          <div className="inc-modal-section">
            <label className="inc-modal-label">Head branch name</label>
            <input
              className="inc-modal-input"
              value={headBranch}
              onChange={e => setHeadBranch(e.target.value)}
              placeholder="pipeheal-fix"
            />
          </div>
        </div>

        <div className="inc-modal-footer">
          <button className="inc-btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="inc-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            <span className="material-symbols-outlined">call_merge</span>
            {submitting ? 'Creating PR...' : 'Approve & Create PR'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Severity / Status helpers ─────────────────────────────────────────────────

function getSeverityClass(s) {
  if (s === 'CRITICAL') return 'sev-critical';
  if (s === 'HIGH') return 'sev-high';
  if (s === 'MEDIUM') return 'sev-medium';
  return 'sev-low';
}

function getStatusClass(s) {
  if (s === 'RESOLVED' || s === 'CLOSED') return 'stat-green';
  if (s === 'OPEN' || s === 'DIAGNOSING') return 'stat-amber';
  if (s === 'PATCH_GENERATED') return 'stat-blue';
  if (s === 'VERIFYING') return 'stat-cyan';
  return 'stat-muted';
}

function getStatusIcon(s) {
  if (s === 'RESOLVED') return 'check_circle';
  if (s === 'DIAGNOSING') return 'psychology';
  if (s === 'PATCH_GENERATED') return 'code';
  if (s === 'VERIFYING') return 'science';
  return 'error';
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function IncidentsPage() {
  const { incidents, loading, error, diagnose, generatePatch, createPR, refetch } = useIncidents();
  const [selectedId, setSelectedId] = useState(null);
  const [incidentDetail, setIncidentDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPRModal, setShowPRModal] = useState(false);

  // Auto-select first incident
  useEffect(() => {
    if (incidents.length > 0 && !selectedId) {
      setSelectedId(incidents[0].id);
    }
  }, [incidents, selectedId]);

  // Fetch detail
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const load = async () => {
      setDetailLoading(true);
      try {
        const res = await api.getIncident(selectedId);
        // axios interceptor returns { success, data: {...incident...} }
        if (!cancelled) setIncidentDetail(res?.data ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedId]);

  const handleAction = async (action) => {
    if (!incidentDetail || actionLoading) return;
    setActionLoading(true);
    try {
      if (action === 'diagnose') {
        await diagnose(incidentDetail.workflowRunId);
      } else if (action === 'patch') {
        await generatePatch(incidentDetail.id);
      } else if (action === 'sandbox') {
        await api.runSandbox(incidentDetail.id, null);
      }
      // Refetch updated detail
      const res = await api.getIncident(selectedId);
      setIncidentDetail(res?.data ?? null);
      refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && incidents.length === 0) {
    return (
      <div className="incidents-page">
        <div className="inc-skeleton-layout">
          <div className="skeleton inc-skeleton-panel" />
          <div className="skeleton inc-skeleton-detail" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="incidents-page">
        <div className="page-error-bar">
          <span className="material-symbols-outlined">error</span>
          Error loading incidents: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="incidents-page">
      {/* Layout: left list + right detail */}
      <div className="inc-layout">
        {/* Left: Incident List */}
        <div className="inc-list-panel">
          <div className="inc-list-header">
            <div>
              <h2 className="inc-list-title">Active Incidents</h2>
              <p className="inc-list-subtitle">{incidents.length} issues requiring attention</p>
            </div>
          </div>

          <div className="inc-list-scroll">
            {incidents.length === 0 ? (
              <div className="inc-list-empty">
                <span className="material-symbols-outlined">check_circle</span>
                No active incidents
              </div>
            ) : (
              incidents.map(incident => (
                <div
                  key={incident.id}
                  className={`inc-list-item${selectedId === incident.id ? ' inc-list-item--active' : ''}`}
                  onClick={() => setSelectedId(incident.id)}
                >
                  <div className="inc-item-top">
                    <div className="inc-item-left">
                      <span className={`material-symbols-outlined inc-item-icon ${getStatusClass(incident.status)}`}>
                        {getStatusIcon(incident.status)}
                      </span>
                      <span className="inc-item-title">{incident.title}</span>
                    </div>
                    <span className={`inc-sev-badge ${getSeverityClass(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <p className="inc-item-repo">
                    {incident.repository?.name}
                    {incident.workflowRunId && ` · run #${incident.workflowRun?.githubRunId || '—'}`}
                  </p>
                  <div className="inc-item-footer">
                    <span className={`inc-status-text ${getStatusClass(incident.status)}`}>
                      {incident.status}
                    </span>
                    <span className="inc-time">
                      {incident.createdAt
                        ? formatDistanceToNow(new Date(incident.createdAt), { addSuffix: true })
                        : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div className="inc-detail-panel">
          {detailLoading ? (
            <div className="inc-detail-loading">
              <span className="material-symbols-outlined spin-icon">sync</span>
              Loading incident details...
            </div>
          ) : !incidentDetail ? (
            <div className="inc-detail-empty">
              <span className="material-symbols-outlined">arrow_back</span>
              Select an incident to view details
            </div>
          ) : (
            <>
              {/* Detail header */}
              <div className="inc-detail-header">
                <div className="inc-detail-header-inner">
                  <div className="inc-detail-ai-icon">
                    <span className="material-symbols-outlined">smart_toy</span>
                  </div>
                  <div>
                    <h3 className="inc-detail-title">PipeHeal Analysis</h3>
                    <span className="inc-detail-id">ID: {incidentDetail.id?.substring(0, 8)}</span>
                  </div>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="inc-detail-body">
                {/* Context cards */}
                <div className="inc-context-grid">
                  <div className="inc-context-card">
                    <p className="inc-context-label">Status</p>
                    <p className={`inc-context-value ${getStatusClass(incidentDetail.status)}`}>
                      <span className="material-symbols-outlined">{getStatusIcon(incidentDetail.status)}</span>
                      {incidentDetail.status}
                    </p>
                  </div>
                  <div className="inc-context-card">
                    <p className="inc-context-label">Severity</p>
                    <p className={`inc-context-value ${getSeverityClass(incidentDetail.severity)}`}>
                      {incidentDetail.severity}
                    </p>
                  </div>
                  <div className="inc-context-card">
                    <p className="inc-context-label">Repository</p>
                    <p className="inc-context-value inc-mono">
                      {incidentDetail.repository?.name || '—'}
                    </p>
                  </div>
                  <div className="inc-context-card">
                    <p className="inc-context-label">Workflow Run</p>
                    <p className="inc-context-value inc-mono stat-green">
                      #{incidentDetail.workflowRun?.githubRunId || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Diagnosis Output */}
                {incidentDetail.diagnoses?.length > 0 && (
                  <div className="inc-diag-block">
                    <h4 className="inc-section-title">
                      <span className="material-symbols-outlined">troubleshoot</span>
                      Root Cause
                    </h4>
                    <p className="inc-diag-summary">
                      {incidentDetail.diagnoses[0].rootCause}
                    </p>
                    <div className="inc-diag-meta">
                      <span className="inc-meta-chip">
                        Confidence: {Math.round((incidentDetail.diagnoses[0].confidence || 0) * 100)}%
                      </span>
                      <span className="inc-meta-chip">
                        Type: {incidentDetail.diagnoses[0].failureType}
                      </span>
                      {incidentDetail.diagnoses[0].autoFixable && (
                        <span className="inc-meta-chip inc-meta-chip--green">Auto-fixable</span>
                      )}
                    </div>
                    {incidentDetail.diagnoses[0].suggestedFix && (
                      <div className="inc-suggested-fix">
                        <h5 className="inc-fix-title">
                          <span className="material-symbols-outlined">auto_fix_high</span>
                          Suggested Fix
                        </h5>
                        <p className="inc-fix-text">{incidentDetail.diagnoses[0].suggestedFix}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error details */}
                {incidentDetail.errorMessage && (
                  <div className="inc-error-block">
                    <h4 className="inc-section-title">
                      <span className="material-symbols-outlined">terminal</span>
                      Error Details
                    </h4>
                    <div className="inc-error-box">
                      <span className="inc-error-cat">{incidentDetail.errorCategory}</span>
                      {incidentDetail.errorFile && (
                        <span className="inc-error-loc">
                          {incidentDetail.errorFile}
                          {incidentDetail.errorLine && `:${incidentDetail.errorLine}`}
                        </span>
                      )}
                      <p className="inc-error-msg">{incidentDetail.errorMessage}</p>
                    </div>
                  </div>
                )}

                {/* Patch */}
                {incidentDetail.patches?.length > 0 && (
                  <div className="inc-patch-block">
                    <h4 className="inc-section-title">
                      <span className="material-symbols-outlined">build</span>
                      AI-Generated Patch
                    </h4>
                    <div className="inc-diff-box">
                      <div className="inc-diff-header">
                        <span className="inc-mono">{incidentDetail.patches[0].filePath}</span>
                      </div>
                      <pre className="inc-diff-content">
                        {incidentDetail.patches[0].diff || incidentDetail.patches[0].description}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Sandbox runs */}
                {incidentDetail.sandboxRuns?.length > 0 && (
                  <div className="inc-sandbox-block">
                    <h4 className="inc-section-title">
                      <span className="material-symbols-outlined">science</span>
                      Sandbox Verification
                    </h4>
                    {incidentDetail.sandboxRuns.map(run => (
                      <div key={run.id} className={`inc-sandbox-card ${run.status === 'PASSED' ? 'inc-sandbox-card--pass' : 'inc-sandbox-card--fail'}`}>
                        <div className="inc-sandbox-top">
                          <span className={`material-symbols-outlined ${run.status === 'PASSED' ? 'stat-green' : 'stat-rose'}`}>
                            {run.status === 'PASSED' ? 'check_circle' : 'cancel'}
                          </span>
                          <span className="inc-sandbox-status">{run.status}</span>
                          {run.duration && <span className="inc-time">{run.duration}ms</span>}
                        </div>
                        {run.logs && (
                          <pre className="inc-sandbox-logs">{run.logs.substring(0, 500)}</pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* PR links */}
                {incidentDetail.pullRequests?.length > 0 && (
                  <div className="inc-pr-block">
                    <h4 className="inc-section-title">
                      <span className="material-symbols-outlined">call_merge</span>
                      Pull Requests
                    </h4>
                    {incidentDetail.pullRequests.map(pr => (
                      <a
                        key={pr.id}
                        href={pr.htmlUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inc-pr-link"
                      >
                        <span className="material-symbols-outlined">open_in_new</span>
                        {pr.title} — {pr.state}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Sticky footer actions */}
              <div className="inc-detail-footer">
                <div className="inc-agent-status">
                  <span className="inc-agent-dot" />
                  <span className="inc-agent-label">Agent ready</span>
                </div>

                <div className="inc-action-btns">
                  {(incidentDetail.status === 'OPEN') && incidentDetail.workflowRunId && (
                    <button
                      className="inc-action-btn inc-action-btn--primary"
                      onClick={() => handleAction('diagnose')}
                      disabled={actionLoading}
                    >
                      <span className="material-symbols-outlined">psychology</span>
                      {actionLoading ? 'Running...' : 'Diagnose'}
                    </button>
                  )}
                  {incidentDetail.status === 'OPEN' && incidentDetail.diagnoses?.length > 0 && (
                    <button
                      className="inc-action-btn inc-action-btn--primary"
                      onClick={() => handleAction('patch')}
                      disabled={actionLoading}
                    >
                      <span className="material-symbols-outlined">code</span>
                      {actionLoading ? 'Running...' : 'Generate Patch'}
                    </button>
                  )}
                  {incidentDetail.status === 'PATCH_GENERATED' && (
                    <button
                      className="inc-action-btn inc-action-btn--primary"
                      onClick={() => handleAction('sandbox')}
                      disabled={actionLoading}
                    >
                      <span className="material-symbols-outlined">science</span>
                      Verify in Sandbox
                    </button>
                  )}
                  {(incidentDetail.status === 'VERIFIED' || incidentDetail.status === 'PATCH_GENERATED') && incidentDetail.patches?.length > 0 && (
                    <button
                      className="inc-action-btn inc-action-btn--green"
                      onClick={() => setShowPRModal(true)}
                      disabled={actionLoading}
                    >
                      <span className="material-symbols-outlined">call_merge</span>
                      Create PR
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PR Modal */}
      {showPRModal && incidentDetail && (
        <PRModal
          incident={incidentDetail}
          onClose={() => setShowPRModal(false)}
          onSubmit={createPR}
        />
      )}
    </div>
  );
}
