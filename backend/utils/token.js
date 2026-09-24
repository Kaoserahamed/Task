'use strict';

const jwt = require('jsonwebtoken');

const config = require('../config/env');

/**
 * Access-token minting and verification.
 *
 * The lifetime used to be hard-coded as `expiresIn: '7d'` in each route that
 * signed a token, so JWT_EXPIRES_IN in the environment (and in docker-compose,
 * and in the deployment docs) was ignored — the documented way to shorten the
 * token lifetime did nothing. Both the sign and the verify side now read the
 * one configured value.
 */

function signAccessToken(userId) {
  return jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { signAccessToken, verifyAccessToken };
