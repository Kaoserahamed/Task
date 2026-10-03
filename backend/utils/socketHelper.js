const logger = require('./logger');
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
    logger.warn(
      { event: 'socket.init.unsupported' },
      'Socket.IO is not supported on Vercel serverless functions'
    );
    return null;
  }

  try {
    io = require('../socket').init(server);
    return io;
  } catch (error) {
    logger.error({ err: error, event: 'socket.init.failed' }, 'failed to initialize Socket.IO');
    return null;
  }
};

const getIO = () => {
  if (process.env.VERCEL === '1') {
    logger.warn({ event: 'socket.unavailable.vercel' }, 'Socket.IO is not available on Vercel');
    return null;
  }

  try {
    return require('../socket').getIO();
  } catch (error) {
    logger.error({ err: error, event: 'socket.get.failed' }, 'Socket.IO not initialized');
    return null;
  }
};

const emitEvent = (event, data) => {
  const socketIO = getIO();
  if (socketIO) {
    socketIO.emit(event, data);
    return true;
  }
  logger.warn({ event: 'socket.emit.unavailable', emittedEvent: event }, 'cannot emit event');
  return false;
};

const emitToRoom = (room, event, data) => {
  const socketIO = getIO();
  if (socketIO) {
    socketIO.to(room).emit(event, data);
    return true;
  }
  logger.warn(
    { event: 'socket.emit.room.unavailable', room, emittedEvent: event },
    'cannot emit to room'
  );
  return false;
};

module.exports = {
  initSocket,
  getIO,
  emitEvent,
  emitToRoom,
  isSocketAvailable: () => io !== null,
};
