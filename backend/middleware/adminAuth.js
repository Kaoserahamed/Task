// backend/middleware/adminAuth.js
const { verifyAccessToken } = require('../utils/token');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');

module.exports = function adminAuth(req, res, next) {
  const authorization = req.headers.authorization;
  const token =
    typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;
  if (!token) return next(new UnauthorizedError('No token provided', 'NO_TOKEN'));

  try {
    const decoded = verifyAccessToken(token);
    if (decoded.isAdmin !== true && decoded.role !== 'admin') {
      return next(new ForbiddenError('Not an admin', 'ADMIN_REQUIRED'));
    }
    req.user = decoded;
    return next();
  } catch (_error) {
    return next(new UnauthorizedError('Invalid token', 'INVALID_TOKEN'));
  }
};
