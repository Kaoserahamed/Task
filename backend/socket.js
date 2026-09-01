const config = require('./config/env');

let io;

module.exports = {
    init: httpServer => {
        // Configure CORS for Socket.io - Allow both Vercel and localhost
        const socketCorsConfig = {
            origin: (origin, callback) => {
                // Allow requests with no origin (like mobile apps, Postman)
                if (!origin) return callback(null, true);
                
                // Allow all Vercel domains
                if (origin.includes('.vercel.app') || origin.includes('vercel.app')) {
                    return callback(null, true);
                }
                
                // Allow all localhost origins
                if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                    return callback(null, true);
                }
                
                // Check against whitelist
                if (config.cors.origins.indexOf(origin) !== -1) {
                    return callback(null, true);
                }
                
                callback(null, false);
            },
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"]
        };

        io = require('socket.io')(httpServer, {
            cors: socketCorsConfig,
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });

        // Handle socket connections
        io.on('connection', (socket) => {
            // Handle tour approval requests (company to admin)
            socket.on('tour_approval_request', (data) => {
                // Broadcast to all other clients
                socket.broadcast.emit('tour_approval_request', data);
                
                // Send acknowledgment back to sender
                if (typeof arguments[arguments.length - 1] === 'function') {
                    arguments[arguments.length - 1]();
                }
            });

            // Company joins its own room for targeted events
            socket.on('join_company_room', (companyId) => {
                socket.join(`company_${companyId}`);
            });

            // Handle tour status updates (admin to company)
            socket.on('tour_status_update', (data) => {
                if (data.companyId) {
                    io.to(`company_${data.companyId}`).emit('tour_status_update', data);
                }
                if (typeof arguments[arguments.length - 1] === 'function') {
                    arguments[arguments.length - 1]();
                }
            });

            socket.on('disconnect', () => {
                // Client disconnected silently
            });
        });

        return io;
    },
    getIO: () => {
        if (!io) {
            throw new Error('Socket.io not initialized');
        }
        return io;
    }
};