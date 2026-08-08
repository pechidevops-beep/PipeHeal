import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const navLinks = ['Features', 'How it Works', 'Pricing', 'Docs', 'Blog'];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-3' : 'py-5'
        }`}
      >
        <div className="max-w-[1100px] mx-auto px-6">
          <div className={`flex items-center justify-between transition-all duration-300 ${
            scrolled ? 'bg-[var(--bg-elevated)]/80 backdrop-blur-lg border border-[var(--border-default)] rounded-full px-5 py-2 shadow-lg' : 'px-2 py-2'
          }`}>
            
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-bold text-black text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:scale-105 transition-transform duration-300">
                P
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">PipeHeal</span>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="px-4 py-2 text-[14px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors rounded-full hover:bg-[var(--border-default)]"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="text-[14px] font-medium text-[var(--text-secondary)] hover:text-white transition-colors px-3">
                Log in
              </Link>
              <Link
                to="/signup"
                className="premium-button text-[14px] px-5 py-2"
              >
                Start Free
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-x-4 top-20 z-40 md:hidden premium-card p-4"
          >
            <div className="flex flex-col gap-1 mb-4">
              {navLinks.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] hover:text-white hover:bg-[var(--border-default)] rounded-xl transition-all"
                >
                  {item}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-4 border-t border-[var(--border-default)]">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full text-center px-4 py-3 text-[15px] font-medium text-[var(--text-primary)] hover:text-white rounded-xl">
                Log in
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="w-full text-center premium-button text-[15px] px-4 py-3">
                Start Free Trial
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
