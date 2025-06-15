import opensocket from 'socket.io-client';

const socket = opensocket('http://localhost:4000', {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});

// Add connection listeners
socket.on('connect', () => {
    console.log('Socket connected with ID:', socket.id);
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});

socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
});

export default socket;