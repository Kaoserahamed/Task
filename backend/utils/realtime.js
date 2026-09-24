'use strict';

/**
 * Real-time fan-out helper.
 *
 * Business code should be able to say "a tour was created" without caring
 * whether a Socket.IO server happens to be attached (tests, Vercel serverless,
 * the seed scripts). `getIO()` throws when nothing is listening, so the check
 * lives here once instead of in a try/catch at every call site.
 */

function emit(event, payload) {
  // Lazily required so that importing the service never boots a socket server.
  const socket = require('../socket');
  let io;
  try {
    io = socket.getIO();
  } catch (error) {
    return false;
  }

  if (!io || typeof io.emit !== 'function') {
    return false;
  }

  io.emit(event, payload);
  return true;
}

module.exports = { emit };
