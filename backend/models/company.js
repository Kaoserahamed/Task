const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
  name: {
    type: String,
    unique: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  phone: {
    type: String,
  },
  address: {
    type: String,
  },

  website: {
    type: String,
  },
  description: {
    type: String,
  },
  logo: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationStatus: {
    type: String,
    enum: ['Not Verified', 'pending', 'approved', 'rejected'],
    default: 'Not Verified',
  },
  verificationDocuments: {
    type: [String],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  review: {
    type: String,
  },
  resetToken: String,
  resetTokenExpiration: Date,
  ownerName: {
    type: String,
  },
  ownerEmail: {
    type: String,
  },
  ownerPhone: {
    type: String,
  },
  ownerAddress: {
    type: String,
  },
  ownerNationalId: {
    type: String,
  },
  ownerDob: {
    type: Date,
  },
  ownerNationality: {
    type: String,
  },
  ownerPhoto: {
    type: String, // URL or path to photo
  },
  registrationNumber: {
    type: String,
  },
  taxId: {
    type: String,
  },
  licenseNumber: {
    type: String,
  },
  licenseExpiry: {
    type: Date,
  },
});
companySchema.index({ verificationStatus: 1, createdAt: -1 });
companySchema.index({ createdAt: -1 });

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
