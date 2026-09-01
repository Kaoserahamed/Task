import opensocket from 'socket.io-client';

const BACKEND_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const socket = opensocket(BACKEND_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

// Add connection listeners
socket.on('connect', () => {
    console.log('✅ Socket connected to backend:', socket.id);
});

socket.on('connect_error', (error) => {
    console.warn('⚠️ Socket connection error:', error.message);
    console.log('💡 Make sure backend is running on', BACKEND_URL);
});

socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
});

export default socket;
