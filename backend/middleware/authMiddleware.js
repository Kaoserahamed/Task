const jwt = require('jsonwebtoken');

const logger = require('../utils/logger');

const authMiddleware = (req, res, next) => {
  // Get token from headers

  const token = req.header('Authorization')?.split(' ')[1];
  logger.info(token);

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    logger.error('Token verification failed:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
