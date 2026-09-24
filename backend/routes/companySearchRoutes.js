'use strict';

/**
 * Company directory and profile: public lookup, search, self-service profile
 * updates and the admin verification decision.
 *
 * Split out of the former `companyRoutes.js`; the credential half now lives in
 * `companyAuthRoutes.js`. Both routers are mounted under `/company/auth` and
 * `/api`, because the front-ends call the same handlers through both prefixes.
 */

const express = require('express');

const Company = require('../models/company');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');
const logger = require('../utils/logger');
const { safeMongoText } = require('../utils/query');
const { buildCompanyUpdate } = require('../utils/companyUpdate');

const router = express.Router();

const SEARCH_LIMIT = 10;
const SEARCH_FIELDS = '_id name description logo email phone website';

/**
 * Broadcast a verification update. The socket module opens a connection on its
 * first require, so a missing or disconnected socket must never fail the HTTP
 * request that triggered the event.
 */
function emitCompanyEvent(event, action, company) {
  try {
    const io = require('../socket').getIO();
    io.emit(event, { action, company });
  } catch (socketErr) {
    logger.warn('Socket emit failed:', socketErr.message);
  }
}

// GET /company/:id — public company profile.
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

// GET /search?query=… — name/description search used by the storefront.
router.get('/search', async (req, res) => {
  try {
    // The query is escaped before it becomes a RegExp: a search box used to
    // turn an unbalanced bracket into a 500.
    const { value, regex } = safeMongoText(req.query.query);

    if (!value) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const companies = await Company.find({
      $or: [{ name: regex }, { description: regex }],
    })
      .select(SEARCH_FIELDS)
      .limit(SEARCH_LIMIT);

    res.json({ success: true, companies });
  } catch (error) {
    logger.error('Search error:', error);
    res.status(500).json({ success: false, message: 'Error searching companies' });
  }
});

// GET /companies — the full registry for the admin dashboard.
router.get('/companies', adminAuth, async (req, res) => {
  try {
    const companies = await Company.find();
    res.json({ success: true, companies });
  } catch (error) {
    logger.error('Error fetching companies:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies' });
  }
});

// PUT /update — name/email/phone profile update for the signed-in company.
router.put('/update', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const companyId = req.user.companyId;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

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

// PATCH /update-info — every profile field except the approval state.
router.patch('/update-info', authMiddleware, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'No companyId provided' });
    }

    const currentCompany = await Company.findById(companyId);
    if (!currentCompany) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // A second license request while one is already waiting is a no-op that
    // would otherwise reset the queue position.
    if (req.body.verificationStatus === 'pending' && currentCompany.verificationStatus === 'pending') {
      return res.status(400).json({ success: false, message: 'License request already pending.' });
    }

    const updateData = buildCompanyUpdate(req.body, Company.schema.paths);
    if (req.body.verificationStatus !== undefined && req.body.verificationStatus !== null) {
      updateData.verificationStatus = req.body.verificationStatus;
    }

    if (Object.keys(updateData).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'No valid fields provided for update.' });
    }

    const company = await Company.findByIdAndUpdate(companyId, updateData, { new: true });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    emitCompanyEvent('verif', 'pen', company);

    res.json({ success: true, company });
  } catch (error) {
    logger.error('Update company info error:', error);
    res.status(500).json({ success: false, message: 'Failed to update company info' });
  }
});

// PATCH /update-status — the admin approval decision. The dashboard sends the
// target company id in the body; a company token falls back to its own id.
router.patch('/update-status', adminAuth, async (req, res) => {
  try {
    const { verificationStatus, isVerified } = req.body;
    const companyId = req.body.companyId || req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ message: 'No companyId provided' });
    }

    const statusPath = Company.schema.paths.verificationStatus;
    const allowedStatuses = (statusPath && statusPath.enumValues) || [];
    if (
      verificationStatus !== undefined &&
      allowedStatuses.length > 0 &&
      !allowedStatuses.includes(verificationStatus)
    ) {
      return res.status(400).json({ success: false, message: 'Unknown verification status' });
    }

    const updateData = {};
    if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const company = await Company.findByIdAndUpdate(companyId, updateData, { new: true });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    logger.info(
      { companyId: String(company._id), verificationStatus },
      'company verification updated'
    );

    emitCompanyEvent('veri', 'done', company);

    res.json({ success: true, company });
  } catch (error) {
    logger.error('Failed to update verification status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
});

module.exports = router;
