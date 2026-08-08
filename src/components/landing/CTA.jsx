import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-24 relative z-10 border-t border-[var(--border-default)] bg-[var(--bg-base)] overflow-hidden">
      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[1000px] h-[400px] bg-[var(--accent-blue)] opacity-[0.05] blur-[140px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
        <h2 className="text-4xl sm:text-5xl lg:text-[56px] font-bold tracking-tight text-white mb-6 leading-[1.1]">
          Ready to automate <br className="hidden sm:block" />
          your DevOps?
        </h2>
        <p className="text-[var(--text-secondary)] text-[16px] sm:text-[18px] max-w-2xl mx-auto mb-10 leading-relaxed">
          Join thousands of elite engineering teams who trust PipeHeal to keep their production systems healthy and their engineers happy.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto premium-button flex items-center justify-center gap-2 px-8 py-4 text-[15px]"
          >
            Start Your Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#contact"
            className="w-full sm:w-auto ghost-button flex items-center justify-center px-8 py-4 text-[15px]"
          >
            Contact Sales
          </a>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-8 text-[13px] text-[var(--text-muted)] font-medium tracking-wide uppercase">
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />No credit card required</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />14-day free trial</span>
          <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
