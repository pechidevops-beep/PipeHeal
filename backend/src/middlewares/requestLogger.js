import morgan from 'morgan';
import { logger } from '../utils/logger.js';

// Stream morgan output to Winston
const stream = {
  write: (message) => logger.http(message.trim()),
};

/**
 * HTTP request logger using Morgan + Winston.
 * Uses 'dev' format in development, 'combined' in production.
 */
export const requestLogger = morgan(
  process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream }
);

export default requestLogger;
