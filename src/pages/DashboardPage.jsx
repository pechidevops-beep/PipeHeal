import ShaderBackground from '../components/ShaderBackground';
import { useDashboard } from '../hooks/useDashboard';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import NumberCounter from '../components/NumberCounter';
import './DashboardPage.css';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { stats, activities, loading, error } = useDashboard();
  const { user } = useAuth();

  const handleConnectGithub = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/auth/github?state=connect:${user?.id}`;
  };

  if (!user?.githubId) {
    return (
      <div className="dashboard-page flex flex-col items-center justify-center text-center p-8">
        <span className="material-symbols-outlined text-6xl text-[var(--accent-blue)] mb-4">account_tree</span>
        <h2 className="text-2xl font-bold text-white mb-2">Connect GitHub to continue</h2>
        <p className="text-[var(--text-secondary)] max-w-md mb-8">
          PipeHeal requires read-only access to your repositories and workflows to monitor and auto-remediate pipeline failures.
        </p>
        <button onClick={handleConnectGithub} className="premium-button px-6 py-3 flex items-center gap-2 text-[14px]">
          <span className="material-symbols-outlined text-[18px]">add_link</span>
          Connect GitHub
        </button>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="page-loading">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--hero" />
        <div className="metrics-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="skeleton skeleton--card" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="page-error">Error loading dashboard: {error}</div>;
  }

  const dynamicCards = [
    {
      title: 'Healthy Pipelines',
      value: stats?.stats?.healthyPipelines?.toString() || '0',
      suffix: `/ ${stats?.stats?.totalPipelines || 0}`,
      badge: 'Active projects',
      badgeClass: 'badge--green',
      icon: 'check_circle',
      iconClass: 'icon--green',
      accentClass: 'accent--green',
    },
    {
      title: 'Needs Attention',
      value: stats?.stats?.openIncidents?.toString() || '0',
      suffix: '',
      badge: 'Unresolved incidents',
      badgeClass: 'badge--amber',
      icon: 'warning',
      iconClass: 'icon--amber',
      accentClass: 'accent--amber',
    },
    {
      title: 'Auto Fixed Today',
      value: stats?.stats?.autoFixedToday?.toString() || '0',
      suffix: '',
      badge: 'Resolved automatically',
      badgeClass: 'badge--cyan',
      icon: 'auto_fix',
      iconClass: 'icon--cyan icon--pulse',
      accentClass: 'accent--cyan',
      glow: true,
    },
    {
      title: 'Success Rate',
      value: `${stats?.stats?.successRate || 0}%`,
      suffix: '',
      badge: 'Last 30 days',
      badgeClass: 'badge--muted',
      icon: 'analytics',
      iconClass: 'icon--rose',
      accentClass: 'accent--rose',
    },
  ];

  const getActivityColor = (eventType) => {
    if (eventType?.includes('resolved') || eventType?.includes('completed')) return 'dot--green';
    if (eventType?.includes('failed')) return 'dot--rose';
    if (eventType?.includes('started')) return 'dot--cyan';
    return 'dot--muted';
  };

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Observatory</h1>
          <p className="page-subtitle">Real-time system health and autonomous interventions.</p>
        </div>
        <button className="btn-deploy premium-button">Deploy</button>
      </div>

      {/* Hero Status Card */}
      <section className="hero-card">
        <div className="hero-shader">
          <ShaderBackground className="w-full h-full" />
        </div>
        <div className="hero-content">
          <div className="hero-status-badge">
            <span className="hero-status-dot">
              <span className="hero-status-ping" />
            </span>
            System Status
          </div>
          <h2 className="hero-headline">
            AI Monitoring{' '}
            <span className="hero-headline-highlight">
              <NumberCounter value={stats?.stats?.totalPipelines || 0} /> Active Pipelines
            </span>
          </h2>
          <p className="hero-description">
            Autonomous healing agents are active across 4 clusters. Latency is optimal.
          </p>
        </div>
      </section>

      {/* Metric Cards */}
      <motion.section 
        className="metrics-grid"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
      >
        {dynamicCards.map((card) => (
          <motion.div
            key={card.title}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
            }}
            className={`metric-card premium-card premium-card--accent-edge premium-card--accent-${card.accentClass.split('--')[1]}${card.glow ? ' metric-card--glow' : ''}`}
          >
            <div className={`metric-card-accent ${card.accentClass}`} />
            <div className="metric-card-header">
              <span className="metric-card-label section-label">{card.title}</span>
              <span className={`material-symbols-outlined metric-card-icon ${card.iconClass}`}>
                {card.icon}
              </span>
            </div>
            <div className="metric-card-value-row">
              <span className="metric-card-value stat-value">
                <NumberCounter value={card.value} />
              </span>
              {card.suffix && <span className="metric-card-suffix">{card.suffix}</span>}
            </div>
            <div className={`metric-card-badge pill pill-${card.badgeClass.split('--')[1]}`}>{card.badge}</div>
          </motion.div>
        ))}
      </motion.section>

      {/* Bottom Grid */}
      <div className="dashboard-bottom-grid">
        {/* Activity Timeline */}
        <section className="activity-panel">
          <div className="panel-header">
            <h3 className="panel-title">Recent AI Activity</h3>
            <button className="panel-view-all">
              View all
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_forward</span>
            </button>
          </div>
          <div className="panel-body">
            <div className="timeline">
              {activities?.length > 0 ? (
                activities.slice(0, 10).map((item, i) => (
                  <div key={i} className="timeline-item">
                    <span className={`timeline-dot ${getActivityColor(item.eventType)}`} />
                    <div className="timeline-content">
                      <div className="timeline-row">
                        <h4 className="timeline-title">{item.title}</h4>
                        <span className="timeline-time">
                          {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="timeline-desc">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="timeline-empty">No recent activity</div>
              )}
            </div>
          </div>
        </section>

        {/* Cluster Health */}
        <section className="cluster-panel">
          <div className="panel-header">
            <h3 className="panel-title">Cluster Health</h3>
          </div>
          <div className="panel-body cluster-body">
            {/* Orbital visualization */}
            <div className="orbital">
              <div className="orbital-ring orbital-ring--outer" />
              <div className="orbital-ring orbital-ring--inner" />
              <div className="orbital-hub">
                <span className="material-symbols-outlined" style={{ color: '#4cd7f6', fontSize: '22px' }}>hub</span>
              </div>
              <div className="orbital-node orbital-node--top" />
              <div className="orbital-node orbital-node--bottom" />
              <div className="orbital-node orbital-node--left orbital-node--pulse" />
              <div className="orbital-node orbital-node--right" />
            </div>

            {/* Cluster bars */}
            <div className="cluster-bars">
              <div className="cluster-bar-item">
                <div className="cluster-bar-header">
                  <span className="cluster-bar-name">US-East-1</span>
                  <span className="cluster-bar-value cluster-bar-value--green">99.99%</span>
                </div>
                <div className="cluster-bar-track">
                  <div className="cluster-bar-fill cluster-bar-fill--green" style={{ width: '99%' }} />
                </div>
              </div>
              <div className="cluster-bar-item">
                <div className="cluster-bar-header">
                  <span className="cluster-bar-name">EU-Central</span>
                  <span className="cluster-bar-value cluster-bar-value--cyan">Load Balancing</span>
                </div>
                <div className="cluster-bar-track">
                  <div className="cluster-bar-fill cluster-bar-fill--cyan cluster-bar-fill--pulse" style={{ width: '75%' }} />
                </div>
              </div>
              <div className="cluster-bar-item">
                <div className="cluster-bar-header">
                  <span className="cluster-bar-name">AP-Southeast</span>
                  <span className="cluster-bar-value cluster-bar-value--green">98.7%</span>
                </div>
                <div className="cluster-bar-track">
                  <div className="cluster-bar-fill cluster-bar-fill--green" style={{ width: '98%' }} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
