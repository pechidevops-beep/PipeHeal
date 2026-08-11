import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import userRepository from '../repositories/user.repository.js';
import ERROR_CODES from '../constants/errorCodes.js';
import bcrypt from 'bcryptjs';
import { encryptToken, decryptToken } from '../utils/crypto.js';

export const authService = {
  
  /**
   * Register with Email and Password
   */
  async registerWithEmail(email, password, firstName, lastName) {
    const hashedPassword = await bcrypt.hash(password, 12);
    
    let user = await userRepository.findByEmail(email);
    if (user) {
      if (!user.password) {
        // User was created via GitHub and has no password, so let them set one
        user = await userRepository.update(user.id, {
          password: hashedPassword,
          firstName: user.firstName || firstName,
          lastName: user.lastName || lastName,
        });
      } else {
        throw new ApiError(409, 'A user with this email already exists.', 'P2002');
      }
    } else {
      user = await userRepository.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        tokenVersion: 0,
        emailVerified: false,
      });
    }
    
    const payload = { userId: user.id, role: user.role, tokenVersion: user.tokenVersion };
    return {
      user: this._sanitizeUser(user),
      tokens: {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
      },
    };
  },

  /**
   * Login with Email and Password
   */
  async loginWithEmail(email, password) {
    const user = await userRepository.findByEmail(email);
    
    if (!user) {
      throw new ApiError(401, 'Invalid email or password', ERROR_CODES.UNAUTHORIZED);
    }

    if (!user.password) {
      throw new ApiError(401, 'This account is linked to GitHub. Please sign in with GitHub.', ERROR_CODES.UNAUTHORIZED);
    }
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ApiError(401, 'Invalid email or password', ERROR_CODES.UNAUTHORIZED);
    }
    
    const payload = { userId: user.id, role: user.role, githubId: user.githubId, tokenVersion: user.tokenVersion };
    return {
      user: this._sanitizeUser(user),
      tokens: {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
      },
    };
  },

  /**
   * Refresh Token logic using tokenVersion checking
   */
  async refreshAccessToken(token) {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (err) {
      throw new ApiError(401, 'Invalid or expired refresh token', ERROR_CODES.UNAUTHORIZED);
    }
    
    const user = await userRepository.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, 'User not found', ERROR_CODES.UNAUTHORIZED);
    }
    
    // Check if token was revoked (e.g. by logout)
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, 'Token revoked', ERROR_CODES.UNAUTHORIZED);
    }
    
    const payload = { userId: user.id, role: user.role, githubId: user.githubId, tokenVersion: user.tokenVersion };
    return {
      accessToken: signAccessToken(payload),
      user: this._sanitizeUser(user)
    };
  },

  /**
   * Logout user by incrementing tokenVersion
   */
  async logout(userId) {
    const user = await userRepository.findById(userId);
    if (user) {
      await userRepository.update(userId, { tokenVersion: user.tokenVersion + 1 });
    }
  },

  /**
   * Exchanges GitHub OAuth code for an access token.
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
   * Login or signup via GitHub exclusively (No existing session)
   */
  async loginWithGitHub(code) {
    const githubToken = await this.exchangeGitHubCode(code);
    const profile = await this.fetchGitHubProfile(githubToken);
    
    const email = profile.email || `${profile.login}@github.local`; // Fallback if email is private
    const githubId = profile.id.toString();

    let user = await userRepository.findByGithubId(githubId);
    
    if (!user) {
      // Check if a user with this email already exists
      const existingEmailUser = await userRepository.findByEmail(email);
      if (existingEmailUser) {
        // Link github to this existing email account
        user = await userRepository.update(existingEmailUser.id, {
          githubId,
          login: profile.login,
          avatarUrl: profile.avatar_url,
          githubAccessToken: encryptToken(githubToken),
        });
      } else {
        // Create new user
        user = await userRepository.create({
          githubId,
          email,
          login: profile.login,
          firstName: profile.name?.split(' ')[0] || null,
          lastName: profile.name?.split(' ').slice(1).join(' ') || null,
          avatarUrl: profile.avatar_url,
          githubAccessToken: encryptToken(githubToken),
          emailVerified: true,
        });
      }
    } else {
      // Update github token and info for existing github user
      user = await userRepository.update(user.id, {
        login: profile.login,
        avatarUrl: profile.avatar_url,
        githubAccessToken: encryptToken(githubToken),
      });
    }

    const payload = { userId: user.id, githubId: user.githubId, role: user.role, tokenVersion: user.tokenVersion };
    
    return {
      user: this._sanitizeUser(user),
      tokens: {
        accessToken: signAccessToken(payload),
        refreshToken: signRefreshToken(payload),
      },
    };
  },

  /**
   * Link GitHub to an ALREADY logged-in account
   */
  async connectGitHubToAccount(userId, code) {
    const githubToken = await this.exchangeGitHubCode(code);
    const profile = await this.fetchGitHubProfile(githubToken);
    
    const githubId = profile.id.toString();
    
    // Check if this GitHub account belongs to someone else
    const existing = await userRepository.findByGithubId(githubId);
    if (existing && existing.id !== userId) {
      // The user connected a GitHub account that is already tied to another user account.
      // We will switch their session to the existing account instead of throwing an error.
      const user = await userRepository.update(existing.id, {
        login: profile.login,
        avatarUrl: profile.avatar_url,
        githubAccessToken: encryptToken(githubToken),
      });

      const payload = { userId: user.id, githubId: user.githubId, role: user.role, tokenVersion: user.tokenVersion };
      
      return {
        switchedUser: true,
        user: this._sanitizeUser(user),
        tokens: {
          accessToken: signAccessToken(payload),
          refreshToken: signRefreshToken(payload),
        }
      };
    }
    
    const user = await userRepository.update(userId, {
      githubId,
      login: profile.login,
      avatarUrl: profile.avatar_url,
      githubAccessToken: encryptToken(githubToken),
    });
    
    return {
      switchedUser: false,
      user: this._sanitizeUser(user)
    };
  },

  _sanitizeUser(user) {
    const { password, githubAccessToken, ...safeUser } = user;
    return safeUser;
  }
};

export default authService;
