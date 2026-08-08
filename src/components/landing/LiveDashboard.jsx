import React from 'react';
import { motion } from 'framer-motion';

const metrics = [
  { label: 'MTTR (Avg)', value: '1.2m' },
  { label: 'Incidents Fixed', value: '4,892' },
  { label: 'Active Queue', value: '0' },
  { label: 'AI Accuracy', value: '99.4%' },
];

const logs = [
  { prefix: '[INFO]', color: 'text-slate-500', text: '2026-08-06 14:32:10 - Webhook received from Sentry: connection_timeout' },
  { prefix: '[ANALYSIS]', color: 'text-[var(--accent-blue)]', text: 'Correlated stack trace to backend-api repository (commit 8f2a1b)' },
  { prefix: '[SANDBOX]', color: 'text-purple-400', text: 'Provisioning isolated Docker environment... Success (1.2s)' },
  { prefix: '[PATCH]', color: 'text-amber-400', text: 'AI agent generated fix for connection pool exhaustion' },
  { prefix: '[TEST]', color: 'text-[var(--success)]', text: 'Running test suite... All 428 tests passed.' },
];

export default function LiveDashboard() {
  return (
    <section className="py-24 relative z-10 border-t border-[var(--border-default)] bg-[var(--bg-base)] overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex justify-center pointer-events-none">
        <div className="w-[800px] h-[500px] bg-[var(--success)] opacity-[0.03] blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">

        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white mb-4 leading-tight"
          >
            Command Center
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-secondary)] text-[16px] leading-relaxed"
          >
            Total visibility into your automated incident response infrastructure. 
            Real-time telemetry, zero blind spots.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="premium-card rounded-2xl overflow-hidden shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
        >
          <div className="bg-[#05050A]">
            
            {/* Terminal Chrome Header */}
            <div className="h-12 border-b border-[var(--border-default)] flex items-center justify-between px-4 bg-[var(--bg-elevated)]">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                  <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                </div>
                <div className="text-[12px] font-mono text-[var(--text-muted)]">System Status: <span className="text-[var(--success)]">Operational</span></div>
              </div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
                </span>
                <span className="text-[12px] text-[var(--success)] font-mono uppercase tracking-widest font-semibold">Live</span>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {metrics.map((m) => (
                  <div key={m.label} className="p-5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-default)]">
                    <div className="text-[12px] text-[var(--text-muted)] uppercase tracking-wide font-semibold mb-2">{m.label}</div>
                    <div className="text-3xl font-mono text-white tracking-tight">{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Console Log */}
              <div className="rounded-xl border border-[var(--border-default)] bg-[#02040A] p-6 font-mono text-[13px] leading-relaxed shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                <div className="text-[var(--text-muted)] mb-4 flex items-center gap-2 text-[12px] uppercase tracking-wider font-semibold">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                  Terminal Output
                </div>
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.4 + (index * 0.15) }}
                      className="text-[var(--text-secondary)] flex gap-3"
                    >
                      <span className={`shrink-0 ${log.color}`}>{log.prefix}</span>
                      <span>{log.text}</span>
                    </motion.div>
                  ))}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + (logs.length * 0.15) }}
                    className="text-white flex gap-2 items-center pt-1 mt-3 border-t border-white/[0.05]"
                  >
                    <span className="text-[var(--success)] font-bold text-[16px]">✓</span> Pull Request #143 automatically opened for review.
                  </motion.div>
                  <motion.div
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="w-2 h-4 bg-white/50 mt-2"
                  />
                </div>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
