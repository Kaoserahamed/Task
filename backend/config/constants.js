/**
 * Application Constants
 * Centralized constants for the application
 */

module.exports = {
  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
  },

  // User Roles
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin',
    COMPANY: 'company',
  },

  // Tour Status
  TOUR_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // Booking Status
  BOOKING_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
  },

  // File Upload
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    UPLOAD_DIR: 'uploads/',
    REVIEW_UPLOAD_DIR: 'uploads/reviews/',
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // JWT
  JWT: {
    COOKIE_NAME: 'token',
    HEADER_NAME: 'Authorization',
    BEARER_PREFIX: 'Bearer ',
  },

  // Error Messages
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    VALIDATION_ERROR: 'Validation error',
    SERVER_ERROR: 'Internal server error',
    INVALID_CREDENTIALS: 'Invalid credentials',
    TOKEN_EXPIRED: 'Token expired',
    TOKEN_INVALID: 'Invalid token',
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    CREATED: 'Resource created successfully',
    UPDATED: 'Resource updated successfully',
    DELETED: 'Resource deleted successfully',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTRATION_SUCCESS: 'Registration successful',
  },
};
