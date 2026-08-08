import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Container, GitPullRequest, Activity, Database, Server } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI Root Cause Analysis',
    desc: 'Instantly analyzes massive logs and pinpoints the exact line of failing code with contextual intelligence.',
  },
  {
    icon: Container,
    title: 'Docker Sandbox',
    desc: 'Test AI-generated fixes in isolated, secure Docker environments before deployment.',
  },
  {
    icon: GitPullRequest,
    title: 'GitHub Integration',
    desc: 'Auto-create draft PRs with verified fixes for seamless review.',
  },
  {
    icon: Activity,
    title: 'Real-time Monitoring',
    desc: 'WebSocket-powered live updates across all your production pipelines.',
  },
  {
    icon: Server,
    title: 'Scalable Architecture',
    desc: 'Built with Redis queues, designed for enterprise-grade scale.',
  },
  {
    icon: Database,
    title: 'Smart Caching',
    desc: 'Intelligently caches build artifacts and dependencies to accelerate pipeline execution.',
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative z-10 border-t border-[var(--border-default)] bg-[var(--bg-base)]">
      <div className="max-w-[1200px] mx-auto px-6">

        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white mb-4 leading-tight"
          >
            Everything you need. <br/>
            <span className="text-[var(--text-secondary)]">Nothing you don't.</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-[var(--text-secondary)] text-[16px] leading-relaxed"
          >
            A cohesive platform to automate your entire incident response workflow from detection to resolution.
          </motion.p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="premium-card p-6 flex flex-col group"
              >
                <div className="mb-5 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent-blue)]/10 border border-[var(--accent-blue)]/20 group-hover:bg-[var(--accent-blue)]/20 transition-colors duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                  <Icon className="w-6 h-6 text-[var(--accent-blue)]" />
                </div>
                
                <h3 className="text-[18px] font-semibold text-white tracking-tight mb-2 group-hover:text-[var(--accent-cyan)] transition-colors">{feature.title}</h3>
                <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed flex-grow">
                  {feature.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
