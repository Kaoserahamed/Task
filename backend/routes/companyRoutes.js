const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const { hashPassword, verifyPassword } = require('../utils/password');
const { signAccessToken } = require('../utils/token');
const config = require('../config/env');
const crypto = require('crypto');

const sibApiV3Sdk = require('sib-api-v3-sdk');

const logger = require('../utils/logger');
const defaultClient = sibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = config.apis.sendinblue;
const transEmail = new sibApiV3Sdk.TransactionalEmailsApi();

const sender = {
  name: config.mail.fromName,
  email: config.mail.fromEmail,
};

router.get('/company/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, company });
  } catch (error) {
    logger.error('Error fetching company by ID:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let company = await Company.findOne({ email });
    if (company) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    company = new Company({
      name,
      email,
      password: hashedPassword,
    });

    await company.save();

    // Create JWT token
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

// Login User
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await verifyPassword(password, company.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
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
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const companyId = req.user.companyId; // From auth middleware

    // Find user and update
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Update fields if they are provided
    if (name) company.name = name;
    if (email) company.email = email;
    if (phone) company.phone = phone;

    await company.save();

    res.json({
      user: {
        _id: company._id,
        name: company.name,
        email: company.email,
        phone: company.phone,
      },
    });
  } catch (error) {
    logger.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a case-insensitive regex pattern for the search
    const searchPattern = new RegExp(query, 'i');

    // Search in company name and description
    const companies = await Company.find({
      $or: [{ name: searchPattern }, { description: searchPattern }],
    })
      .select('_id name description logo email phone website') // Select only necessary fields
      .limit(10); // Limit results to 10 companies

    res.json({
      success: true,
      companies,
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching companies',
    });
  }
});
// Get all companies (for dashboard analytics)
router.get('/companies', adminAuth, async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ success: true, companies });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch companies', error: error.message });
  }
});
router.post('/reset', async (req, res) => {
  try {
    const { email, resetUrl } = req.body;

    // Generate reset token
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString('hex');

    // Find user and update reset token
    const user = await Company.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account with that email found',
      });
    }

    // Update user with reset token
    user.resetToken = token;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();
    logger.info(user);
    // Send reset email
    const receiver = [{ email }];
    await transEmail.sendTransacEmail({
      sender,
      to: receiver,
      subject: 'Task - Password Reset Request',
      textContent: 'You requested a password reset for your Task account.',
      htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 30px;">
              <i class="fas fa-globe-americas" style="font-size: 48px; color: #4299e1;"></i>
              <h1 style="color:rgb(18, 99, 239); margin: 10px 0;">Task</h1>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #2d3748; margin-bottom: 20px;">Password Reset Request</h2>
              
              <p style="color: #4a5568; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password for your Task account. Click the button below to set a new password:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}/${token}" 
                   style="background-color: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                  Reset Password
                </a>
              </div>
              
              <p style="color: #718096; font-size: 14px; margin-bottom: 20px;">
                This link will expire in 1 hour for security reasons.
              </p>
              
              <p style="color: #718096; font-size: 14px; margin-bottom: 0;">
                If you didn't request this password reset, you can safely ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #718096; font-size: 12px;">
              <p>© 2024 Task. All rights reserved.</p>
            </div>
          </div>
        `,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending reset password email',
      error: error.message,
    });
  }
});
router.post('/reset-password', async (req, res) => {
  const newPassword = req.body.password;
  const passwordToken = req.body.token;
  // Never log the password or the token: both are credentials, and a reset
  // token in a log file is a reset token anyone with log access can spend.
  let resetUser;
  try {
    const user = await Company.findOne({ resetToken: passwordToken });
    resetUser = user;
    const hashedPassword = await hashPassword(newPassword);
    ((resetUser.password = hashedPassword), (resetUser.resetToken = undefined));
    resetUser.resetTokenExpiration = undefined;
    await resetUser.save();
    res.status(200).json({ succes: true });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'password reset fail',
      error: error.message,
    });
  }
});
// PATCH: Update company profile info (all fields except status/verification fields)
router.patch('/update-info', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    // Fetch current company
    const currentCompany = await Company.findById(companyId);
    if (!currentCompany) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // If trying to set verificationStatus to 'pending' and it's already pending, reject
    if (
      req.body.verificationStatus === 'pending' &&
      currentCompany.verificationStatus === 'pending'
    ) {
      return res.status(400).json({ success: false, message: 'License request already pending.' });
    }

    // List of fields that should not be updated
    const forbiddenFields = [
      '_id',
      'verificationStatus',
      'isVerified',
      'createdAt',
      'resetToken',
      'resetTokenExpiration',
      '__v',
    ];
    // Get all allowed fields from schema
    const allowedFields = Object.keys(Company.schema.paths).filter(
      (f) => !forbiddenFields.includes(f)
    );
    const updateData = {};
    // Only update fields that are present in the request and not undefined/null
    allowedFields.forEach((field) => {
      if (
        Object.prototype.hasOwnProperty.call(req.body, field) &&
        req.body[field] !== undefined &&
        req.body[field] !== null
      ) {
        updateData[field] = req.body[field];
      }
    });
    // Handle nested fields (socialLinks, documents, etc.)
    if (Object.prototype.hasOwnProperty.call(req.body, 'socialLinks') && req.body.socialLinks) {
      updateData.socialLinks = req.body.socialLinks;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'documents') && req.body.documents) {
      updateData.documents = req.body.documents;
    }
    // Handle verificationStatus separately (allow only if not already pending)
    if (
      Object.prototype.hasOwnProperty.call(req.body, 'verificationStatus') &&
      req.body.verificationStatus !== undefined &&
      req.body.verificationStatus !== null
    ) {
      updateData.verificationStatus = req.body.verificationStatus;
    }
    // If no fields to update, return early
    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No valid fields provided for update.' });
    }
    // Update the company
    const company = await Company.findByIdAndUpdate(companyId, updateData, { new: true });
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Emit socket event before sending response
    try {
      const io = require('../socket').getIO();
      io.emit('verif', {
        action: 'pen',
        company,
      });
    } catch (socketErr) {
      logger.warn('Socket emit failed:', socketErr.message);
    }

    res.json({ success: true, company });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update company info', error: error.message });
  }
});

// PATCH: Update verification status and isVerified only
router.patch('/update-status', adminAuth, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { verificationStatus, isVerified } = req.body;
    const updateData = {};
    if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    // If no companyId, return error
    if (!companyId) return res.status(400).json({ message: 'No companyId provided' });
    const company = await Company.findByIdAndUpdate(companyId, updateData, { new: true });
    logger.info(company);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Emit socket event before sending response
    try {
      const io = require('../socket').getIO();
      io.emit('veri', {
        action: 'done',
        company,
      });
    } catch (socketErr) {
      logger.warn('Socket emit failed:', socketErr.message);
    }

    res.json({ success: true, company });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update status', error: error.message });
  }
});
// POST: Verify company password
router.post('/verify-password', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const companyId = req.user.companyId;
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    const isMatch = await verifyPassword(password, company.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});
module.exports = router;
