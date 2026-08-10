import { Server } from 'socket.io';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
import { SOCKET_NAMESPACES, SOCKET_EVENTS } from '../constants/events.js';
import { verifyAccessToken } from '../utils/jwt.js';

let io;

/**
 * Initialize Socket.IO server.
 */
export function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Authentication Middleware — decode token if present but don't block
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        socket.user = decoded;
      } catch (err) {
        // Invalid token — still allow connection for public namespaces
        socket.user = null;
      }
    } else {
      socket.user = null;
    }
    next();
  });

  const dashboardNamespace = io.of(SOCKET_NAMESPACES.DASHBOARD);
  const incidentsNamespace = io.of(SOCKET_NAMESPACES.INCIDENTS);
  const pipelinesNamespace = io.of(SOCKET_NAMESPACES.PIPELINES);
  const logsNamespace = io.of('/logs');
  const networkNamespace = io.of('/network');

  const setupNamespace = (namespace, name) => {
    namespace.use((socket, next) => {
      // Re-use auth logic from global middleware
      next();
    });

    namespace.on(SOCKET_EVENTS.CONNECT, (socket) => {
      logger.info(`[Socket.IO] Client connected to ${name} namespace: ${socket.id} (User: ${socket.user?.login})`);
      
      // Join a room specific to this user to push private updates
      if (socket.user?.id) {
        socket.join(`user:${socket.user.id}`);
      }

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        logger.info(`[Socket.IO] Client disconnected from ${name}: ${socket.id}`);
      });
    });
  };

  setupNamespace(dashboardNamespace, 'Dashboard');
  setupNamespace(incidentsNamespace, 'Incidents');
  setupNamespace(pipelinesNamespace, 'Pipelines');
  setupNamespace(networkNamespace, 'Network');
  
  // Custom setup for network to broadcast metrics
  networkNamespace.on('connection', (socket) => {
    import('../middlewares/metrics.middleware.js').then(({ metricsEmitter, getMetrics }) => {
      // Send immediate state
      socket.emit('metrics_update', getMetrics());
      
      const listener = (metrics) => socket.emit('metrics_update', metrics);
      metricsEmitter.on('update', listener);
      
      socket.on('disconnect', () => {
        metricsEmitter.off('update', listener);
      });
    });
  });
  
  // Custom setup for logs to broadcast Winston logs
  logsNamespace.on('connection', (socket) => {
    // Import logEmitter dynamically to avoid circular dependencies at top level
    import('../utils/logger.js').then(({ logEmitter }) => {
      const logListener = (info) => {
        // Winston SocketTransport emits the info object directly
        try {
          const logData = typeof info === 'string' ? JSON.parse(info) : info;
          socket.emit('new_log', {
            level: logData.level,
            message: logData.message || logData[Symbol.for('message')],
            timestamp: logData.timestamp || new Date().toLocaleTimeString('en-US', { hour12: false }),
            stack: logData.stack
          });
        } catch (e) {
          // ignore parsing errors
        }
      };
      
      logEmitter.on('log', logListener);
      socket.on('disconnect', () => {
        logEmitter.off('log', logListener);
      });
    });
  });

  logger.info('[Socket.IO] Server initialized with namespaces');
  return io;
}

/**
 * Get the initialized Socket.IO instance.
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Please call initSocketIO first.');
  }
  return io;
}
