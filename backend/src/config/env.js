import 'dotenv/config';

/**
 * Centralized, validated environment configuration.
 * The server will warn (not crash) if optional vars are missing.
 */

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[ENV] FATAL ERROR: ${key} is not set in the environment.`);
  }
  return value;
}

function getEnv(key, defaultValue = '') {
  return process.env[key] || defaultValue;
}

export const env = {
  // Server
  PORT: parseInt(getEnv('PORT', '3001'), 10),
  NODE_ENV: getEnv('NODE_ENV', 'development'),
  isProduction: getEnv('NODE_ENV') === 'production',
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),
  DIRECT_URL: getEnv('DIRECT_URL'),

  // Supabase
  SUPABASE_URL: getEnv('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnv('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY'),

  // JWT
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnv('JWT_EXPIRES_IN', '15m'), // Note: 15m as per instructions
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_REFRESH_EXPIRES_IN: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),

  // GitHub
  GITHUB_CLIENT_ID: requireEnv('GITHUB_CLIENT_ID'),
  GITHUB_CLIENT_SECRET: requireEnv('GITHUB_CLIENT_SECRET'),
  GITHUB_WEBHOOK_SECRET: getEnv('GITHUB_WEBHOOK_SECRET', 'dev-webhook-secret'),
  GITHUB_CALLBACK_URL: getEnv('GITHUB_CALLBACK_URL', 'http://localhost:3001/api/v1/auth/github/callback'), // changed from github to auth/github
  WEBHOOK_BASE_URL: getEnv('WEBHOOK_BASE_URL', 'http://localhost:3001'),

  // Encryption
  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),

  // AI
  CLAUDE_API_KEY: getEnv('CLAUDE_API_KEY'),
  CLAUDE_MODEL: getEnv('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
  GEMINI_API_KEY: getEnv('GEMINI_API_KEY'),

  // Docker
  DOCKER_HOST: getEnv('DOCKER_HOST', 'unix:///var/run/docker.sock'),
  DOCKER_SANDBOX_IMAGE: getEnv('DOCKER_SANDBOX_IMAGE', 'node:20-alpine'),
  DOCKER_TIMEOUT_MS: parseInt(getEnv('DOCKER_TIMEOUT_MS', '120000'), 10),

  // CORS
  ALLOWED_ORIGINS: getEnv('ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000')
    .split(',')
    .map((o) => o.trim()),
  FRONTEND_URL: getEnv('FRONTEND_URL', 'http://localhost:5173'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(getEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(getEnv('RATE_LIMIT_MAX', '100'), 10),

  // Logging
  LOG_LEVEL: getEnv('LOG_LEVEL', 'info'),
  LOG_DIR: getEnv('LOG_DIR', 'logs'),

  // Feature flags (auto-detected from credential presence)
  get githubConfigured() {
    return Boolean(this.GITHUB_CLIENT_ID && this.GITHUB_CLIENT_SECRET);
  },
  get aiConfigured() {
    return Boolean(this.CLAUDE_API_KEY || this.GEMINI_API_KEY);
  },
  get dbConfigured() {
    return Boolean(this.DATABASE_URL);
  },
};

export default env;
