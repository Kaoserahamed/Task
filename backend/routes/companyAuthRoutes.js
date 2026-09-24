'use strict';

/**
 * Company credentials: registration, login, password reset and re-auth.
 *
 * These handlers used to share one 400-line `companyRoutes.js` with the company
 * directory and profile surface. Splitting them by concern keeps each file
 * readable and independently testable. Both routers are mounted under
 * `/company/auth` **and** `/api`, because the front-ends call the same handlers
 * through both prefixes; `company.auth.routes.test.js` pins that contract.
 */

const crypto = require('crypto');
const express = require('express');
const sibApiV3Sdk = require('sib-api-v3-sdk');

const Company = require('../models/company');
const authMiddleware = require('../middleware/authMiddleware');
const config = require('../config/env');
const logger = require('../utils/logger');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/token');
const { passwordResetEmail } = require('../utils/companyMail');
const { requireFields, requireStrongPassword } = require('../utils/requestValidation');

const router = express.Router();

const defaultClient = sibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = config.apis.sendinblue;
const transEmail = new sibApiV3Sdk.TransactionalEmailsApi();

const sender = {
  name: config.mail.fromName,
  email: config.mail.fromEmail,
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const MIN_PASSWORD_LENGTH = 8;

// POST /register — create a company account and return an access token.
router.post('/register', async (req, res) => {
  try {
    if (!requireFields(res, req.body, ['name', 'email', 'password'])) return;

    const { name, email, password } = req.body;
    if (!requireStrongPassword(res, password, MIN_PASSWORD_LENGTH)) return;

    const existing = await Company.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    const company = new Company({
      name,
      email,
      password: await hashPassword(password),
    });

    await company.save();

    const token = signAccessToken(company._id, { companyId: String(company._id) });

    res.status(201).json({
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
      },
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /login — exchange credentials for an access token.
router.post('/login', async (req, res) => {
  try {
    if (!requireFields(res, req.body, ['email', 'password'])) return;

    const { email, password } = req.body;

    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await verifyPassword(password, company.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = signAccessToken(company._id, { companyId: String(company._id) });

    res.json({
      token,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        isVerified: company.isVerified,
        verificationStatus: company.verificationStatus,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /reset — mint a one-hour reset token and email the link.
router.post('/reset', async (req, res) => {
  try {
    if (!requireFields(res, req.body, ['email'])) return;

    const { email, resetUrl } = req.body;
    const token = (await crypto.randomBytes(32)).toString('hex');

    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email found',
      });
    }

    company.resetToken = token;
    company.resetTokenExpiration = Date.now() + RESET_TOKEN_TTL_MS;
    await company.save();

    // Never log the document: it carries the password hash and the reset token.
    logger.info({ companyId: String(company._id) }, 'company password reset requested');

    await transEmail.sendTransacEmail(passwordResetEmail({ sender, email, resetUrl, token }));

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reset password email',
    });
  }
});

// POST /reset-password — consume the token and store the new password hash.
router.post('/reset-password', async (req, res) => {
  try {
    if (!requireFields(res, req.body, ['token', 'password'])) return;

    const { token, password } = req.body;
    if (!requireStrongPassword(res, password, MIN_PASSWORD_LENGTH)) return;

    const company = await Company.findOne({ resetToken: token });
    if (!company || !company.resetTokenExpiration || company.resetTokenExpiration < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    company.password = await hashPassword(password);
    company.resetToken = undefined;
    company.resetTokenExpiration = undefined;
    await company.save();

    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'password reset fail' });
  }
});

// POST /verify-password — re-authenticate the signed-in company.
router.post('/verify-password', authMiddleware, async (req, res) => {
  try {
    if (!requireFields(res, req.body, ['password'])) return;

    const company = await Company.findById(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const isMatch = await verifyPassword(req.body.password, company.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Verify password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
