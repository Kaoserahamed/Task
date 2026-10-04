'use strict';

const Report = require('../models/Report');

/**
 * The only module that talks to the `Report` model.
 *
 * Keeping Mongoose here means the triage rules in `report.service.js` are
 * unit-testable with a stub repository — no database, no binary download.
 */
const reportRepository = {
  /** Newest first, which is the order the dashboard renders by default. */
  findAll() {
    return Report.find().sort({ date: -1 });
  },

  findById(id) {
    return Report.findById(id);
  },

  updateStatus(id, status) {
    return Report.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  },
};

module.exports = reportRepository;
