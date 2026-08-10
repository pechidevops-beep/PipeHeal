import authService from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true, // MUST be true for sameSite: 'none'
  sameSite: 'none', // MUST be 'none' for cross-domain cookies (Vercel -> Render)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  
  async register(req, res) {
    const { email, password, firstName, lastName } = req.body;
    const { user, tokens } = await authService.registerWithEmail(email, password, firstName, lastName);
    
    res.cookie('pipeheal_refresh', tokens.refreshToken, COOKIE_OPTIONS);
    return ApiResponse.ok(res, { user, accessToken: tokens.accessToken }, 'User registered successfully');
  },

  async login(req, res) {
    const { email, password } = req.body;
    const { user, tokens } = await authService.loginWithEmail(email, password);
    
    res.cookie('pipeheal_refresh', tokens.refreshToken, COOKIE_OPTIONS);
    return ApiResponse.ok(res, { user, accessToken: tokens.accessToken }, 'Successfully authenticated');
  },

  async refreshToken(req, res) {
    const refreshToken = req.cookies.pipeheal_refresh;
    if (!refreshToken) {
      throw new ApiError(401, 'No refresh token provided', ERROR_CODES.UNAUTHORIZED);
    }
    
    const { user, accessToken } = await authService.refreshAccessToken(refreshToken);
    return ApiResponse.ok(res, { user, accessToken }, 'Tokens refreshed');
  },

  async logout(req, res) {
    // 1. Invalidate all outstanding tokens in DB
    await authService.logout(req.user.id);
    
    // 2. Clear cookie
    res.clearCookie('pipeheal_refresh', COOKIE_OPTIONS);
    
    return ApiResponse.ok(res, null, 'Logged out successfully');
  },

  async getMe(req, res) {
    return ApiResponse.ok(res, { user: req.user }, 'Current user');
  },

  async getGithubAuthUrl(req, res) {
    if (!env.githubConfigured) {
      throw new ApiError(503, 'GitHub OAuth is not configured', ERROR_CODES.GITHUB_NOT_CONFIGURED);
    }
    
    // If state is passed, it means we are connecting an existing session
    const state = req.query.state || '';
    const url = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITHUB_CALLBACK_URL)}&scope=repo,workflow,read:user,user:email&state=${state}`;
    return res.redirect(url);
  },

  async githubCallback(req, res) {
    const { code, state, error, error_description } = req.query;
    
    if (error) {
      logger.warn(`[OAuth] GitHub callback error: ${error} — ${error_description}`);
      return res.redirect(`${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(error_description || error)}`);
    }
    
    if (!code) {
      return res.redirect(`${env.FRONTEND_URL}/auth/callback?error=no_code`);
    }

    try {
      if (state && state.startsWith('connect:')) {
        // connecting to an existing session
        const userId = state.split(':')[1];
        await authService.connectGitHubToAccount(userId, code);
        return res.redirect(`${env.FRONTEND_URL}/dashboard?github=connected`);
      } else {
        // pure github login
        const result = await authService.loginWithGitHub(code);
        res.cookie('pipeheal_refresh', result.tokens.refreshToken, COOKIE_OPTIONS);
        return res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${encodeURIComponent(result.tokens.accessToken)}&refresh=${encodeURIComponent(result.tokens.refreshToken)}&login=${encodeURIComponent(result.user.login)}`);
      }
    } catch (err) {
      logger.error(`[OAuth] Token exchange failed: ${err.message}`);
      return res.redirect(`${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
    }
  }
};

export default authController;
