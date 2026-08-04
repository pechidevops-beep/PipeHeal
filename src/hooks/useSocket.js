import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

/**
 * Custom hook to connect to a specific Socket.IO namespace
 * @param {string} namespace - The namespace to connect to (e.g., '/dashboard')
 * @param {Object} eventHandlers - An object mapping event names to handler functions
 */
export const useSocket = (namespace = '/', eventHandlers = {}) => {
  const socketRef = useRef(null);
  
  // Use a ref for handlers so they don't trigger reconnection when they change
  const handlersRef = useRef(eventHandlers);
  
  useEffect(() => {
    handlersRef.current = eventHandlers;
  }, [eventHandlers]);

  useEffect(() => {
    // Connect to the specific namespace
    const socket = io(`${SOCKET_URL}${namespace}`, {
      transports: ['websocket'],
      auth: {
        token: localStorage.getItem('pipeheal_token')
      }
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`Connected to Socket.IO namespace: ${namespace}`);
    });

    socket.on('connect_error', (error) => {
      console.error(`Socket.IO Connection Error (${namespace}):`, error);
    });

    // Register all event handlers dynamically
    // To avoid stale closures, we always call the latest function in handlersRef
    const setupHandlers = () => {
      // Get all current event names from the ref
      Object.keys(handlersRef.current).forEach((eventName) => {
        socket.on(eventName, (...args) => {
          if (handlersRef.current[eventName]) {
            handlersRef.current[eventName](...args);
          }
        });
      });
    };
    
    setupHandlers();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [namespace]); // Only reconnect if namespace changes

  return socketRef.current;
};

export default useSocket;
