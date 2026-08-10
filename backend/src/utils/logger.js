import { createLogger, format, transports } from 'winston';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import Transport from 'winston-transport';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, '../../..', 'logs');

// Ensure logs directory exists
try {
  mkdirSync(LOG_DIR, { recursive: true });
} catch (_) {}

const { combine, timestamp, printf, colorize, errors, json } = format;

// Console format — colorized, human-readable
const consoleFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${stack || message}${metaStr}`;
  })
);

export const logEmitter = new EventEmitter();

// Custom transport to emit logs via EventEmitter
class SocketTransport extends Transport {
  constructor(opts) {
    super(opts);
  }
  log(info, callback) {
    setImmediate(() => {
      logEmitter.emit('log', info);
    });
    callback();
  }
}

// File format — structured JSON
const fileFormat = combine(
  timestamp(),
  errors({ stack: true }),
  json()
);

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  exitOnError: false,
  transports: [
    // Console (always on in dev)
    new transports.Console({
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'test',
    }),

    // info.log — all levels info and above
    new transports.File({
      filename: join(LOG_DIR, 'info.log'),
      level: 'info',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10 MB
      maxFiles: 5,
      tailable: true,
    }),

    // error.log — errors only
    new transports.File({
      filename: join(LOG_DIR, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true,
    }),

    // Custom transport for live streaming to UI — emits plain info object
    new SocketTransport({
      format: combine(
        timestamp({ format: 'HH:mm:ss.SSS' }),
        errors({ stack: true })
      )
    })
  ],
});

export default logger;
