// models/Admin.js
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Admin = mongoose.model('Admin', adminSchema);

const adminProfileSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    nid: { type: String },
    image: { type: String }, // store image path or URL
    tradeLicenseNo: { type: String },
    bankAccountNo: { type: String },
  },
  { timestamps: true }
);

const AdminProfile = mongoose.model('AdminProfile', adminProfileSchema);

module.exports = { Admin, AdminProfile };
