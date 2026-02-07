/**
 * Error Handler Middleware
 * Centralized error handling
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    return res.status(400).json({
      success: false,
      message: 'Duplicate entry. Record already exists.',
      error: err.detail
    });
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Invalid reference. Referenced record does not exist.',
      error: err.detail
    });
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Invalid data. Check constraint violated.',
      error: err.detail
    });
  }

  // Validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error.',
      errors: err.errors
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
