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

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Setup Namespaces
  const dashboardNamespace = io.of(SOCKET_NAMESPACES.DASHBOARD);
  const incidentsNamespace = io.of(SOCKET_NAMESPACES.INCIDENTS);
  const pipelinesNamespace = io.of(SOCKET_NAMESPACES.PIPELINES);

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
