const config = require('./config/env');
const { createOriginValidator } = require('./config/cors');

let io;

module.exports = {
  init: (httpServer) => {
    // Socket.IO shares the HTTP CORS policy, so both transports allow exactly
    // the same origins (config/cors.js holds the allow-list).
    const socketCorsConfig = {
      origin: createOriginValidator({
        nodeEnv: config.nodeEnv,
        allowedOrigins: config.cors.origins,
      }),
      methods: ['GET', 'POST'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
    };

    io = require('socket.io')(httpServer, {
      cors: socketCorsConfig,
      transports: ['websocket', 'polling'],
      allowEIO3: true,
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
  },
};
