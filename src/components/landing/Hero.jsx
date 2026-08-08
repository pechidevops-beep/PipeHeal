import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TerminalSquare, ShieldCheck, Activity } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 px-6 overflow-hidden z-10">
      
      <div className="max-w-[1000px] mx-auto w-full flex flex-col items-center text-center">
        
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full premium-card text-[12px] font-medium text-[var(--text-secondary)] mb-8 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
          <span>The next generation of DevOps is here.</span>
          <div className="w-[1px] h-3 bg-[var(--border-default)] mx-1" />
          <Link to="/blog" className="text-white hover:text-[var(--accent-cyan)] transition-colors flex items-center gap-1">
            Read announcement <ArrowRight className="w-3 h-3" />
          </Link>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl lg:text-[64px] font-bold tracking-tight text-white leading-[1.05] mb-6"
        >
          Your Autonomous <br />
          <span className="text-gradient-accent">DevOps Engineer.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-10"
        >
          PipeHeal automatically detects, analyzes, and patches your production incidents before your users even notice.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Link
            to="/signup"
            className="w-full sm:w-auto premium-button flex items-center justify-center gap-2 px-8 py-4 text-[15px]"
          >
            Start Building Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto ghost-button flex items-center justify-center gap-2 px-8 py-4 text-[15px]"
          >
            <TerminalSquare className="w-4 h-4 text-[var(--text-secondary)]" />
            Book a Demo
          </a>
        </motion.div>
      </div>

      {/* Dashboard Preview */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[1200px] mx-auto mt-24 relative"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-transparent to-transparent z-20 pointer-events-none" />
        
        <div className="relative z-10 premium-card rounded-t-xl border-b-0 overflow-hidden shadow-[0_-20px_80px_rgba(59,130,246,0.1)]">
          {/* Mac window header */}
          <div className="h-12 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex items-center px-6">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
            </div>
            <div className="mx-auto flex items-center gap-2 px-4 py-1.5 rounded-md bg-[var(--bg-base)] border border-[var(--border-default)] text-[12px] text-[var(--text-muted)] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--success)]" />
              app.pipeheal.io
            </div>
          </div>

          {/* IDE Content Mockup */}
          <div className="grid grid-cols-12 h-[500px]">
            {/* Sidebar */}
            <div className="col-span-3 border-r border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 space-y-4">
              <div className="text-[11px] font-semibold text-[var(--text-muted)] tracking-wider uppercase">Repositories</div>
              <div className="space-y-1">
                {['frontend-web', 'api-gateway', 'auth-service'].map((repo, i) => (
                  <div key={repo} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] transition-colors ${i === 0 ? 'bg-[var(--border-default)] text-white' : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--border-default)]'}`}>
                    <Activity className={`w-3.5 h-3.5 ${i === 0 ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`} />
                    {repo}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Area */}
            <div className="col-span-9 p-8 bg-[var(--bg-base)]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-[18px] font-medium text-white mb-1">Production Telemetry</h3>
                  <p className="text-[13px] text-[var(--text-secondary)]">Real-time analysis of frontend-web deployment</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success)]"></span>
                  </span>
                  <span className="text-[12px] text-[var(--success)] font-mono">Live Sync</span>
                </div>
              </div>

              {/* Code diff block */}
              <div className="rounded-lg border border-[var(--border-default)] overflow-hidden bg-[var(--bg-elevated)] font-mono text-[13px]">
                <div className="flex bg-[var(--bg-elevated)] border-b border-[var(--border-default)] text-[var(--text-muted)] text-[12px]">
                  <div className="px-4 py-2 border-r border-[var(--border-default)] text-[var(--text-primary)]">db.ts</div>
                  <div className="px-4 py-2">AI Fix Applied (PR #142)</div>
                </div>
                <div className="p-4 space-y-1 overflow-x-hidden">
                  <div className="text-[var(--text-secondary)] flex"><span className="w-8 select-none opacity-50">12</span><span>{'const pool = new Pool({'}</span></div>
                  <div className="text-[var(--text-secondary)] flex"><span className="w-8 select-none opacity-50">13</span><span className="ml-4">{'max: 20,'}</span></div>
                  <div className="text-rose-400 bg-rose-500/10 -mx-4 px-4 flex"><span className="w-8 select-none text-rose-500 opacity-80">-</span><span className="ml-4">{'idleTimeoutMillis: 30000'}</span></div>
                  <div className="text-[var(--success)] bg-[var(--success)]/10 -mx-4 px-4 flex"><span className="w-8 select-none text-[var(--success)] opacity-80">+</span><span className="ml-4">{'idleTimeoutMillis: 10000, // Reduced to prevent connection exhaustion'}</span></div>
                  <div className="text-[var(--text-secondary)] flex"><span className="w-8 select-none opacity-50">16</span><span className="ml-4">{'connectionTimeoutMillis: 2000,'}</span></div>
                  <div className="text-[var(--text-secondary)] flex"><span className="w-8 select-none opacity-50">17</span><span>{'});'}</span></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
