const express = require('express');
const router = express.Router();
const { hashPassword, verifyPassword } = require('../utils/password');
const crypto = require('crypto');
const sibApiV3Sdk = require('sib-api-v3-sdk');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/upload'); // Assuming you have a multer setup in index.js

const logger = require('../utils/logger');

// Sendinblue API config (Best Practice)
const defaultClient = sibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY; // Accessing from environment variable
const transEmail = new sibApiV3Sdk.TransactionalEmailsApi();

// Register User
const sender = {
  name: 'Siyam',
  email: 'ahamedsiyam43@gmail.com', // This must be a verified sender in Sendinblue
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
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
    const users = await User.find({
      $or: [{ name: searchPattern }],
    })
      .select('_id name description logo email phone website') // Select only necessary fields
      .limit(10); // Limit results to 10 companies

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching companies',
    });
  }
});
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.userId; // From auth middleware

    // Find user and update
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if they are provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;

    await user.save();

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    logger.error('Update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    logger.info('Avatar upload request received');
    logger.info('File:', req.file);
    logger.info('Body:', req.body);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded.',
      });
    }

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    // Store the file path (relative to uploads directory)
    const avatarPath = req.file.path.replace(/\\/g, '/');

    logger.info('Updating user with email:', email);
    logger.info('Avatar path:', avatarPath);

    const user = await User.findOneAndUpdate(
      { email },
      { avatar: avatarPath },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    logger.info('User updated successfully:', user);

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error) {
    logger.error('Error uploading avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Avatar upload failed.',
      error: error.message,
    });
  }
});
// Add this route to authRoutes.js
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
      },
    });
  } catch (error) {
    logger.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});
router.post('/reset', async (req, res) => {
  try {
    const { email, resetUrl } = req.body;

    // Generate reset token
    const buffer = await crypto.randomBytes(32);
    const token = buffer.toString('hex');

    // Find user and update reset token
    const user = await User.findOne({ email });
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
            <h1 style="color:rgb(26, 101, 232); margin: 10px 0;">Task</h1>
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
  // Never log the password or the reset token — both are credentials.
  let resetUser;
  try {
    const user = await User.findOne({ resetToken: passwordToken });
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
module.exports = router;
