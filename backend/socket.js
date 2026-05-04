const config = require('./config/env');

let io;

module.exports = {
    init: httpServer => {
        io = require('socket.io')(httpServer, {
            cors: {
                origin: config.cors.origins,
                methods: ["GET", "POST"],
                credentials: true,
                allowedHeaders: ["Content-Type", "Authorization"]
            },
            transports: ['websocket', 'polling'],
            allowEIO3: true
        });

        // Handle socket connections
        io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            // Log total connected clients
            const connectedClients = io.sockets.sockets.size;
            console.log('Total connected clients:', connectedClients);

            // Handle tour approval requests (company to admin)
            socket.on('tour_approval_request', (data) => {
                console.log('Received tour_approval_request from socket:', socket.id);
                console.log('Request data:', data);
                
                // Broadcast to all other clients
                socket.broadcast.emit('tour_approval_request', data);
                console.log('Broadcasted tour_approval_request to other clients');
                
                // Send acknowledgment back to sender
                if (typeof arguments[arguments.length - 1] === 'function') {
                    arguments[arguments.length - 1]();
                }
            });

            // Company joins its own room for targeted events
            socket.on('join_company_room', (companyId) => {
                socket.join(`company_${companyId}`);
                console.log(`Socket ${socket.id} joined room company_${companyId}`);
            });

            // Handle tour status updates (admin to company)
            socket.on('tour_status_update', (data) => {
                console.log('Received tour_status_update from socket:', socket.id);
                console.log('Status update data:', data);
                if (data.companyId) {
                    io.to(`company_${data.companyId}`).emit('tour_status_update', data);
                    console.log(`Sent tour_status_update to room company_${data.companyId}`);
                }
                if (typeof arguments[arguments.length - 1] === 'function') {
                    arguments[arguments.length - 1]();
                }
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
                console.log('Remaining connected clients:', io.sockets.sockets.size);
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