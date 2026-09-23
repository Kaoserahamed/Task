'use strict';

/**
 * Catch-all for unmatched routes.
 *
 * Mounted after every router and immediately before the error handler, so an
 * unknown URL answers with the same `{ success, error, code }` envelope as any
 * other failure instead of Express' default HTML page.
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
}

module.exports = notFound;
