import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { db } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

/**
 * Protect routes — verifies JWT access token.
 * Attaches decoded user to req.user.
 * In development mode with no token, uses the first user in the DB (or a stub).
 */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const token = extractTokenFromHeader(req);

  if (!token) {
    if (process.env.NODE_ENV !== 'production') {
      // Dev bypass: try to use the first real user in DB, otherwise use stub
      if (db) {
        try {
          const firstUser = await db.user.findFirst({
            select: { id: true, login: true, role: true, email: true, avatarUrl: true, accessToken: true },
            orderBy: { createdAt: 'asc' },
          });
          if (firstUser) {
            req.user = firstUser;
            return next();
          }
        } catch (err) {
          logger.warn('[Auth] Dev bypass DB lookup failed: ' + err.message);
        }
      }
      // Fallback stub (no DB or no users yet)
      req.user = { id: 'dev_user_stub', login: 'dev', role: 'ADMIN', email: null, avatarUrl: null, accessToken: null };
      return next();
    }
    throw ApiError.unauthorized('No token provided');
  }

  const decoded = verifyAccessToken(token);
  req.user = decoded;

  // Enrich with DB data (skipped if DB is unavailable)
  if (db) {
    try {
      const user = await db.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, login: true, role: true, email: true, avatarUrl: true, accessToken: true },
      });
      if (!user) throw ApiError.unauthorized('User no longer exists');
      req.user = { ...decoded, ...user };
    } catch (err) {
      if (err instanceof ApiError) throw err;
      logger.warn(`[Auth] DB lookup failed, using token data: ${err.message}`);
    }
  }

  next();
});

/**
 * Require a specific role.
 * @param {...string} roles - e.g. 'ADMIN'
 */
export const requireRole = (...roles) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden(`Requires role: ${roles.join(' or ')}`);
    }
    next();
  });

/**
 * Optional authentication — doesn't throw if no token.
 * Sets req.user to null if unauthenticated.
 */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractTokenFromHeader(req);
  if (!token) {
    req.user = null;
    return next();
  }
  try {
    req.user = verifyAccessToken(token);
  } catch {
    req.user = null;
  }
  next();
});
