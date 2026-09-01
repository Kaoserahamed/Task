import opensocket from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const socket = opensocket(BACKEND_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('✅ Socket connected to backend');
});

socket.on('connect_error', (error) => {
  console.warn('⚠️ Socket connection error:', error.message);
  console.log('💡 Make sure backend is running on', BACKEND_URL);
});

socket.on('disconnect', () => {
  console.log('🔌 Socket disconnected');
});

export default socket;
