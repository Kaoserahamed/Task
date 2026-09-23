// backend/middleware/adminAuth.js
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  let token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  // Support Bearer <token>
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    if (!decoded.isAdmin) return res.status(403).json({ message: 'Not an admin' });
    req.user = decoded;
    next();
  });
};
