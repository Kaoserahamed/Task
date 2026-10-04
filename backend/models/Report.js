// models/Report.js
const mongoose = require('mongoose');

/**
 * A customer or tour-company complaint about the other side of a booking.
 *
 * The admin dashboard used to render a hardcoded array of sample reports, so
 * nothing here existed: no operator could ever file, triage, or resolve a real
 * complaint. `type` records who filed it, which is also what the dashboard's
 * "User Reports" / "Company Reports" tabs filter on, and `status` records where
 * the complaint is in the triage flow. Both are enums rather than free strings so
 * a typo cannot create a tab that matches nothing.
 *
 * `submittedBy` / `submittedAgainst` are display names captured at filing time
 * rather than references: a report must stay readable after the account behind it
 * is deleted, and the dashboard never needs to resolve them to render a row.
 */
const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['user', 'company'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  submittedBy: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  submittedAgainst: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved'],
    default: 'pending',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
    default: '',
  },
});

reportSchema.index({ status: 1, date: -1 });
reportSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model('Report', reportSchema);
