import opensocket from 'socket.io-client';
import API_BASE_URL from './config/api';
import { logDebug, logWarn } from './utils/logger';

// The socket reaches the same origin as the REST client, so it reads the URL
// from the one config module instead of re-deriving it from the environment:
// that duplication is how the socket and the API client drifted apart.
const BACKEND_URL = API_BASE_URL;

// Disable socket.io on production Vercel deployment
// Socket.io doesn't work on Vercel serverless functions
const isProduction = BACKEND_URL.includes('vercel.app');

let socket;

if (!isProduction) {
  // Only connect socket in development
  socket = opensocket(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  // Add connection listeners
  socket.on('connect', () => {
    logDebug('✅ Socket connected to backend:', socket.id);
  });

  socket.on('connect_error', (error) => {
    logWarn('⚠️ Socket connection error:', error.message);
    logDebug('💡 Make sure backend is running on', BACKEND_URL);
  });

  socket.on('disconnect', (reason) => {
    logDebug('🔌 Socket disconnected:', reason);
  });
} else {
  logDebug('ℹ️ Socket.io disabled in production (Vercel serverless limitation)');
  // Return a mock socket object to prevent errors
  socket = {
    on: () => {},
    emit: () => {},
    off: () => {},
    disconnect: () => {},
  };
}

export default socket;
