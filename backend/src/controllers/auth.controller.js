import authService from '../services/auth.service.js';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const authController = {
  async githubLogin(req, res) {
    const { code } = req.body; // validated by middleware
    const { user, tokens } = await authService.loginWithGitHub(code);
    
    return ApiResponse.ok(res, { user, tokens }, 'Successfully authenticated');
  },

  async refreshToken(req, res) {
    const { refreshToken } = req.body;
    
    // Verify token (throws if invalid)
    const decoded = verifyRefreshToken(refreshToken);
    
    // Issue new tokens
    const payload = { userId: decoded.userId, githubId: decoded.githubId, role: decoded.role };
    const tokens = {
      accessToken: signAccessToken(payload),
      refreshToken: signRefreshToken(payload), // Optional: rotate refresh token
    };

    return ApiResponse.ok(res, tokens, 'Tokens refreshed');
  },

  async getMe(req, res) {
    return ApiResponse.ok(res, { user: req.user }, 'Current user');
  },

  async logout(req, res) {
    // In a stateless JWT setup, logout is handled client-side by dropping the token.
    // If we had a token blacklist or DB tracking, we'd update it here.
    return ApiResponse.ok(res, null, 'Logged out successfully');
  },
  
  // This is primarily for the frontend to redirect the user to GitHub
  async getGithubAuthUrl(req, res) {
    if (!env.githubConfigured) {
      throw new ApiError(503, 'GitHub OAuth is not configured', ERROR_CODES.GITHUB_NOT_CONFIGURED);
    }
    const url = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(env.GITHUB_CALLBACK_URL)}&scope=repo,workflow,read:user,user:email`;
    return res.redirect(url);
  }
};

export default authController;
