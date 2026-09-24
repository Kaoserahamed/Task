'use strict';

const { randomUUID } = require('crypto');

/**
 * Give every request an identifier.
 *
 * A caller that already has a correlation id (a browser tab, an API gateway)
 * can pass it as `x-request-id`; otherwise one is generated. The value is
 * echoed back in the response header and attached to `req.log`, so an error
 * report from a user can be grepped in the logs in one step.
 */
function requestId(req, res, next) {
  const incoming = req.headers['x-request-id'];
  const id = typeof incoming === 'string' && incoming.trim() ? incoming.trim() : randomUUID();

  req.id = id;
  res.setHeader('x-request-id', id);

  next();
}

module.exports = requestId;
