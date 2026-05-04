/**
 * Socket.IO Helper for Vercel Deployment
 * 
 * Note: Socket.IO doesn't work on Vercel serverless functions.
 * This helper provides fallback behavior.
 */

let io = null;

const initSocket = (server) => {
  // Only initialize Socket.IO in non-serverless environment
  if (process.env.VERCEL === '1') {
    console.warn('Socket.IO is not supported on Vercel serverless functions');
    return null;
  }

  try {
    io = require('../socket').init(server);
    return io;
  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
    return null;
  }
};

const getIO = () => {
  if (process.env.VERCEL === '1') {
    console.warn('Socket.IO is not available on Vercel');
    return null;
  }

  try {
    return require('../socket').getIO();
  } catch (error) {
    console.error('Socket.IO not initialized:', error);
    return null;
  }
};

const emitEvent = (event, data) => {
  const socketIO = getIO();
  if (socketIO) {
    socketIO.emit(event, data);
    return true;
  }
  console.warn(`Cannot emit event "${event}" - Socket.IO not available`);
  return false;
};

const emitToRoom = (room, event, data) => {
  const socketIO = getIO();
  if (socketIO) {
    socketIO.to(room).emit(event, data);
    return true;
  }
  console.warn(`Cannot emit to room "${room}" - Socket.IO not available`);
  return false;
};

module.exports = {
  initSocket,
  getIO,
  emitEvent,
  emitToRoom,
  isSocketAvailable: () => io !== null
};
