import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGithubLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    window.location.href = `${apiUrl}/auth/github`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      return setError('Email and password are required');
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Premium ambient background blur */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[800px] h-[600px] bg-[var(--accent-blue)] opacity-[0.05] blur-[160px] rounded-full mix-blend-screen" />
        <div className="w-[600px] h-[500px] bg-[var(--accent-cyan)] opacity-[0.04] blur-[160px] rounded-full mix-blend-screen -translate-y-24 translate-x-24" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="premium-card p-8 sm:p-10 relative">
          
          {/* Subtle top edge highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <Link to="/" className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-bold text-lg mb-6 hover:scale-105 transition-transform duration-300">
              P
            </Link>
            <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">Welcome back</h1>
            <p className="text-[14px] text-[var(--text-secondary)]">Sign in to your PipeHeal account</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full premium-input px-4 py-3 text-[14px] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full premium-input px-4 py-3 pr-10 text-[14px] placeholder:text-[var(--text-muted)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-4 h-4 rounded border border-[var(--border-default)] bg-[var(--bg-base)] peer-checked:bg-[var(--accent-blue)] peer-checked:border-[var(--accent-blue)] transition-all" />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[13px] text-[var(--text-secondary)] group-hover:text-white transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-[13px] text-[var(--text-secondary)] hover:text-white transition-colors">Forgot password?</a>
            </div>

            <button type="submit" disabled={isLoading} className="w-full premium-button py-3 text-[14px] mt-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-[1px] bg-[var(--border-default)]" />
            </div>
            <div className="relative px-3 bg-[var(--bg-elevated)] text-[12px] text-[var(--text-muted)] font-medium">
              OR
            </div>
          </div>

          {/* GitHub SSO */}
          <button
            onClick={handleGithubLogin}
            disabled={isLoading}
            className="w-full h-12 flex items-center justify-center gap-2.5 ghost-button text-[14px] disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          <p className="text-center text-[13px] text-[var(--text-secondary)] mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:text-[var(--accent-cyan)] transition-colors">Sign up</Link>
          </p>

        </div>
      </motion.div>
    </div>
  );
}
