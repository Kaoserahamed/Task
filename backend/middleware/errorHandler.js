// Express recognises an error handler by its four-argument signature, so the
// unused `next` parameter is required and intentionally prefixed with `_`.
const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

module.exports = errorHandler;
