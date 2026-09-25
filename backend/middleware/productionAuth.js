'use strict';

const config = require('../config/env');
const authMiddleware = require('./authMiddleware');

/**
 * Require a valid user/company token in production while keeping the local
 * test and development HTTP surface usable. Production deployments must not
 * rely on this convenience: every mutation is protected at the edge.
 */
function productionAuth(req, res, next) {
  if (!config.isProduction) return next();
  return authMiddleware(req, res, next);
}

module.exports = productionAuth;
