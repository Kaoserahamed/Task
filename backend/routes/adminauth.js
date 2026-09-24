// routes/auth.js
const express = require('express');
const { hashPassword, verifyPassword } = require('../utils/password');
const jwt = require('jsonwebtoken');
const { Admin, AdminProfile } = require('../models/Admin'); // Adjust the path as necessary
const adminAuth = require('../middleware/adminAuth');
const Company = require('../models/company');

const router = express.Router();

// Sign Up Endpoint
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await hashPassword(password);

  const newAdmin = new Admin({ email, password: hashedPassword });
  try {
    await newAdmin.save();
    res.status(201).json({ message: 'Admin created successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Error creating admin' });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email });

  if (admin && (await verifyPassword(password, admin.password))) {
    const token = jwt.sign({ id: admin._id, isAdmin: true }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ token, user: { id: admin._id, email: admin.email, isAdmin: true } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin: Update company status
router.patch('/company/:id/update-status', adminAuth, async (req, res) => {
  try {
    const companyId = req.params.id;
    const { verificationStatus, isVerified } = req.body;
    const updateData = {};
    if (verificationStatus !== undefined) updateData.verificationStatus = verificationStatus;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    const company = await Company.findByIdAndUpdate(companyId, updateData, { new: true });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json({ success: true, company });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to update status', error: error.message });
  }
});

// Get admin profile
router.get('/profile', adminAuth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const profile = await AdminProfile.findOne({ adminId });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, profile });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch profile', error: error.message });
  }
});

// Create or update admin profile (with password verification)
router.post('/profile', adminAuth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { name, phone, address, nid, image, tradeLicenseNo, bankAccountNo, password } = req.body;
    // Find admin and check password
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });
    const isMatch = await verifyPassword(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Incorrect password' });
    let profile = await AdminProfile.findOne({ adminId });
    if (profile) {
      // Update
      profile.name = name;
      profile.phone = phone;
      profile.address = address;
      profile.nid = nid;
      profile.image = image;
      profile.tradeLicenseNo = tradeLicenseNo;
      profile.bankAccountNo = bankAccountNo;
      await profile.save();
    } else {
      // Create
      profile = new AdminProfile({
        adminId,
        name,
        phone,
        address,
        nid,
        image,
        tradeLicenseNo,
        bankAccountNo,
      });
      await profile.save();
    }
    res.json({ success: true, profile });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to save profile', error: error.message });
  }
});

// Change admin password
router.post('/change-password', adminAuth, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const isMatch = await verifyPassword(currentPassword, admin.password);
    if (!isMatch) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashedPassword = await hashPassword(newPassword);
    admin.password = hashedPassword;
    await admin.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
