import { PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let prisma;

/**
 * Returns a singleton Prisma Client instance.
 * Gracefully handles missing DATABASE_URL.
 */
function getPrismaClient() {
  if (prisma) return prisma;

  if (!env.DATABASE_URL) {
    logger.warn('[Prisma] DATABASE_URL not set. Database features will be unavailable.');
    return null;
  }

  prisma = new PrismaClient({
    log: env.isDevelopment
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ]
      : [{ emit: 'event', level: 'error' }],
    errorFormat: 'pretty',
  });

  if (env.isDevelopment) {
    prisma.$on('query', (e) => {
      logger.debug(`[Prisma Query] ${e.query} | Duration: ${e.duration}ms`);
    });
  }

  prisma.$on('warn', (e) => logger.warn(`[Prisma] ${e.message}`));
  prisma.$on('error', (e) => logger.error(`[Prisma] ${e.message}`));

  return prisma;
}

export const db = getPrismaClient();

/**
 * Connect to the database.
 * Safe to call multiple times; Prisma manages the pool.
 */
export async function connectDatabase() {
  if (!db) {
    logger.warn('[Database] Skipping connection — DATABASE_URL not configured.');
    return false;
  }
  try {
    await db.$connect();
    logger.info('[Database] Connected to PostgreSQL via Prisma.');
    return true;
  } catch (err) {
    logger.error(`[Database] Connection failed: ${err.message}`);
    return false;
  }
}

/**
 * Gracefully disconnect from the database.
 */
export async function disconnectDatabase() {
  if (!db) return;
  try {
    await db.$disconnect();
    logger.info('[Database] Disconnected.');
  } catch (err) {
    logger.error(`[Database] Disconnect error: ${err.message}`);
  }
}
