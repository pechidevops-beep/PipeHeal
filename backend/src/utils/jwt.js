import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';
import ERROR_CODES from '../constants/errorCodes.js';

/**
 * Sign a JWT access token.
 * @param {object} payload - Data to encode (userId, githubId, role)
 * @returns {string} Signed JWT string
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'pipeheal',
    audience: 'pipeheal-api',
  });
}

/**
 * Sign a JWT refresh token.
 * @param {object} payload
 * @returns {string}
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    issuer: 'pipeheal',
    audience: 'pipeheal-refresh',
  });
}

/**
 * Verify an access token.
 * @param {string} token
 * @returns {object} Decoded payload
 * @throws {ApiError} On invalid or expired token
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, {
      issuer: 'pipeheal',
      audience: 'pipeheal-api',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw new ApiError(401, 'Invalid token', ERROR_CODES.INVALID_TOKEN);
  }
}

/**
 * Verify a refresh token.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'pipeheal',
      audience: 'pipeheal-refresh',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Refresh token expired', ERROR_CODES.TOKEN_EXPIRED);
    }
    throw new ApiError(401, 'Invalid refresh token', ERROR_CODES.INVALID_TOKEN);
  }
}

/**
 * Extract token from Authorization header.
 * Supports "Bearer <token>" format.
 * @param {import('express').Request} req
 * @returns {string|null}
 */
export function extractTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}
