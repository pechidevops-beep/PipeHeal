import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import userRepository from '../repositories/user.repository.js';
import ERROR_CODES from '../constants/errorCodes.js';

export const authService = {
  /**
   * Exchanges GitHub OAuth code for an access token.
   * If GITHUB_CLIENT_ID isn't set, returns a mock token.
   */
  async exchangeGitHubCode(code) {

    try {
      const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        },
        { headers: { Accept: 'application/json' } }
      );

      if (response.data.error) {
        throw new ApiError(400, response.data.error_description, ERROR_CODES.OAUTH_FAILED);
      }

      return response.data.access_token;
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(500, 'GitHub token exchange failed', ERROR_CODES.OAUTH_FAILED);
    }
  },

  /**
   * Fetches user profile from GitHub using the access token.
   */
  async fetchGitHubProfile(accessToken) {

    try {
      const { data } = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return data;
    } catch (err) {
      throw new ApiError(401, 'Failed to fetch GitHub profile', ERROR_CODES.OAUTH_FAILED);
    }
  },

  /**
   * Complete login flow: exchange code, get profile, upsert DB, issue JWTs.
   */
  async loginWithGitHub(code) {
    const githubToken = await this.exchangeGitHubCode(code);
    const profile = await this.fetchGitHubProfile(githubToken);

    // Upsert user in DB
    const user = await userRepository.upsert(profile.id.toString(), {
      login: profile.login,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatar_url,
      accessToken: githubToken, // In prod, encrypt this
    });

    const payload = { userId: user.id, githubId: user.githubId, role: user.role };
    
    return {
      user: {
        id: user.id,
        login: user.login,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      tokens: {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
      },
    };
  }
};

export default authService;
