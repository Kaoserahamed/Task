'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const authService = require('../services/auth.service');
const {
  parseAvatarRequest,
  parseLogin,
  parseProfileUpdate,
  parseRegister,
  parseResetPassword,
  parseResetRequest,
  parseSearch,
} = require('../validators/auth.validator');

/**
 * Customer auth endpoints — HTTP in, JSON out.
 *
 * Like the tour controller this has no try/catch and no database access: it
 * parses the request, hands plain data to the service and serialises the result.
 * Errors travel to the central handler as typed errors.
 */

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(parseRegister(req.body));
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(parseLogin(req.body));
  res.json(result);
});

exports.search = asyncHandler(async (req, res) => {
  const { term } = parseSearch(req.query);
  const users = await authService.search(term);
  res.json({ success: true, users });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const result = await authService.updateProfile(req.user.userId, parseProfileUpdate(req.body));
  res.json(result);
});

exports.getProfile = asyncHandler(async (req, res) => {
  const result = await authService.getProfile(req.user.userId);
  res.json({ success: true, ...result });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  const result = await authService.setAvatar(req.user.userId, parseAvatarRequest(req.file));
  res.json({ success: true, message: 'Avatar updated successfully', ...result });
});

exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(parseResetRequest(req.body));
  res.status(200).json(result);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPassword(parseResetPassword(req.body));
  res.status(200).json(result);
});
