import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    num: '01',
    title: 'Detect',
    desc: 'PipeHeal listens via webhook for incoming alerts from Sentry, Datadog, or PagerDuty the moment they occur.'
  },
  {
    num: '02',
    title: 'Analyze',
    desc: 'Our AI model analyzes the stack trace and directly correlates it to your connected GitHub repositories.'
  },
  {
    num: '03',
    title: 'Reproduce',
    desc: 'A secure Docker sandbox is spun up instantly to reproduce the failing state and verify the environment.'
  },
  {
    num: '04',
    title: 'Patch',
    desc: 'PipeHeal generates the code fix and automatically verifies it against your test suite in the sandbox.'
  },
  {
    num: '05',
    title: 'Deploy',
    desc: 'A pristine draft PR is opened in your repository with the verified fix, ready for your final approval.'
  }
];

export default function HowItWorks() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"]
  });

  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section id="how-it-works" className="py-32 relative z-10 border-t border-[var(--border-default)] bg-[var(--bg-base)]">
      <div className="max-w-[1200px] mx-auto px-6">
        
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          {/* Left Text */}
          <div className="lg:w-1/3">
            <div className="sticky top-32">
              <motion.h2 
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white mb-6 leading-tight"
              >
                From alert to merged PR in <span className="text-gradient-accent">seconds.</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-[var(--text-secondary)] text-[16px] leading-relaxed"
              >
                The entire incident lifecycle, fully autonomous. You only step in when it's time to hit merge.
              </motion.p>
            </div>
          </div>

          {/* Right Timeline */}
          <div className="lg:w-2/3 relative" ref={containerRef}>
            
            {/* Progress Track Background */}
            <div className="absolute left-[20px] md:left-[28px] top-4 bottom-4 w-[2px] bg-[var(--border-default)]" />
            
            {/* Progress Track Fill */}
            <motion.div 
              className="absolute left-[20px] md:left-[28px] top-4 bottom-4 w-[2px] bg-[var(--accent-blue)] origin-top"
              style={{ scaleY }}
            />

            <div className="flex flex-col gap-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative pl-16 md:pl-24"
                >
                  {/* Step Node */}
                  <div className="absolute left-[13px] md:left-[21px] top-1.5 w-4 h-4 rounded-full bg-[var(--bg-base)] border-2 border-[var(--border-default)] z-10" />
                  
                  {/* Active Step Node Glow (simplified logic for demo, real logic would use intersection observer) */}
                  <div className="absolute left-[13px] md:left-[21px] top-1.5 w-4 h-4 rounded-full bg-[var(--accent-blue)] shadow-[0_0_10px_var(--accent-blue)] z-20 opacity-0 transition-opacity duration-300" />

                  <div className="premium-card p-6 md:p-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-[12px] font-mono font-medium text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/20 bg-[var(--accent-cyan)]/10 px-2.5 py-1 rounded-md">
                        STEP {step.num}
                      </div>
                      <h3 className="text-xl font-semibold text-white tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-[var(--text-secondary)] text-[15px] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
