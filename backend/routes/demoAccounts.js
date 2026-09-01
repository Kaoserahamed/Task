/**
 * Route to create demo accounts
 * GET /api/demo/create-accounts
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Company = require('../models/company');
const User = require('../models/User');

// Demo account credentials
const DEMO_COMPANY = {
  name: 'Adventure Tours Ltd',
  email: 'demo@adventuretours.com',
  password: 'demo123',
  phone: '+1-555-0100',
  address: '123 Travel Street, New York, NY 10001',
  website: 'https://adventuretours.com',
  description: 'Premier adventure tour company offering exciting experiences worldwide. Specializing in mountain treks, beach getaways, and cultural tours.',
  isVerified: true,
  verificationStatus: 'approved',
  ownerName: 'John Adventure',
  ownerEmail: 'john@adventuretours.com',
  ownerPhone: '+1-555-0101',
  ownerAddress: '123 Travel Street, New York, NY 10001',
  registrationNumber: 'TOUR-2024-001',
  taxId: 'TAX-123456789',
  licenseNumber: 'LIC-ADV-2024',
  licenseExpiry: new Date('2026-12-31'),
};

const DEMO_USER = {
  name: 'Demo User',
  email: 'user@demo.com',
  password: 'demo123',
  phone: '+1-555-0200',
};

router.get('/create-accounts', async (req, res) => {
  try {
    const results = {
      company: null,
      user: null,
      errors: []
    };

    // Create Demo Company
    try {
      const existingCompany = await Company.findOne({ email: DEMO_COMPANY.email });
      
      if (existingCompany) {
        results.company = {
          status: 'already_exists',
          email: DEMO_COMPANY.email,
          id: existingCompany._id
        };
      } else {
        const hashedPassword = await bcrypt.hash(DEMO_COMPANY.password, 12);
        const company = new Company({
          ...DEMO_COMPANY,
          password: hashedPassword,
        });
        
        await company.save();
        results.company = {
          status: 'created',
          email: DEMO_COMPANY.email,
          password: DEMO_COMPANY.password,
          id: company._id
        };
      }
    } catch (error) {
      results.errors.push({ type: 'company', error: error.message });
    }

    // Create Demo User
    try {
      const existingUser = await User.findOne({ email: DEMO_USER.email });
      
      if (existingUser) {
        results.user = {
          status: 'already_exists',
          email: DEMO_USER.email,
          id: existingUser._id
        };
      } else {
        const hashedPassword = await bcrypt.hash(DEMO_USER.password, 12);
        const user = new User({
          ...DEMO_USER,
          password: hashedPassword,
        });
        
        await user.save();
        results.user = {
          status: 'created',
          email: DEMO_USER.email,
          password: DEMO_USER.password,
          id: user._id
        };
      }
    } catch (error) {
      results.errors.push({ type: 'user', error: error.message });
    }

    res.json({
      success: true,
      message: 'Demo accounts processed',
      results,
      credentials: {
        company: {
          email: DEMO_COMPANY.email,
          password: DEMO_COMPANY.password
        },
        user: {
          email: DEMO_USER.email,
          password: DEMO_USER.password
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
