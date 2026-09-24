'use strict';

const express = require('express');

const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

/**
 * Customer auth routes.
 *
 * This file used to hold every rule for eight endpoints: Mongoose queries, the
 * JWT signing, password hashing, the reset-token lifecycle and a 50-line HTML
 * email template — each wrapped in its own try/catch that turned a missing user
 * into a 500. It is now only middleware plus one controller call per URL, so the
 * whole surface can be read at a glance; the rules live in
 * services/auth.service.js and the data access in repositories/user.repository.js.
 *
 * The credential rate limiter is applied by app.js for the whole /user/auth
 * mount, so it cannot be forgotten per-route.
 */

const router = express.Router();

// Credentials
router.post('/register', authController.register);
router.post('/login', authController.login);

// Directory
router.get('/search', authController.search);

// Profile (token required)
router.put('/update', authMiddleware, authController.updateProfile);
router.get('/me', authMiddleware, authController.getProfile);
router.post(
  '/avatar',
  uploadLimiter,
  authMiddleware,
  upload.single('avatar'),
  authController.uploadAvatar
);

// Password reset
router.post('/reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
