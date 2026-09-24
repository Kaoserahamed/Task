'use strict';

require('dotenv').config();

const http = require('http');
const mongoose = require('mongoose');

const config = require('./config/env');
const createApp = require('./app');
const logger = require('./utils/logger');

/**
 * Process entry point.
 *
 * Everything that only makes sense for a *running server* lives here: the
 * database connection, the HTTP listener, Socket.IO and graceful shutdown. The
 * application itself is built by `app.js`, which is what the tests import.
 */

const MONGOOSE_OPTIONS = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  family: 4, // Force IPv4 — some hosted Mongo clusters resolve to unreachable AAAA records
};

const app = createApp();

async function start() {
  const server = http.createServer(app);
  server.requestTimeout = config.http.requestTimeoutMs;
  server.headersTimeout = config.http.headersTimeoutMs;
  server.keepAliveTimeout = 5000;

  // Socket.IO is unavailable on Vercel's serverless runtime; skip it there.
  if (!config.isVercel) {
    require('./socket').init(server);
  }

  await mongoose.connect(config.mongodb.uri, MONGOOSE_OPTIONS);
  logger.info({ database: 'connected' }, 'mongodb connected');

  if (config.isVercel) {
    return app;
  }

  await new Promise((resolve) => server.listen(config.port, resolve));
  logger.info({ port: config.port, env: config.nodeEnv }, 'api listening');

  return server;
}

/** Stop accepting work, then let in-flight requests finish. */
function shutdown(server, signal) {
  return async () => {
    logger.info({ signal }, 'shutting down');

    const closeServer = () =>
      new Promise((resolve) => {
        if (!server || !server.listening) return resolve();
        server.close(() => resolve());
      });

    try {
      const forceClose = setTimeout(() => {
        logger.warn('graceful shutdown timed out; closing remaining connections');
        server.closeAllConnections?.();
      }, config.http.shutdownTimeoutMs);
      forceClose.unref();

      await closeServer();
      clearTimeout(forceClose);
      await mongoose.connection.close(false);
      await require('./utils/redis').close();
      logger.info('shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error({ err: error }, 'error during shutdown');
      process.exit(1);
    }
  };
}

let runningServer;

start()
  .then((server) => {
    runningServer = server;
    for (const signal of ['SIGTERM', 'SIGINT']) {
      process.on(signal, shutdown(runningServer, signal));
    }
  })
  .catch((error) => {
    logger.fatal({ err: error }, 'startup failed');
    process.exit(1);
  });

// Vercel imports the app instance instead of running a listener.
module.exports = app;
