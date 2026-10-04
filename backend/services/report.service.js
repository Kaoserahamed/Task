'use strict';

const reportRepository = require('../repositories/report.repository');
const { NotFoundError } = require('../utils/errors');

/**
 * Report triage rules, independent of Express.
 *
 * The dashboard used to hold a hardcoded array of sample reports and mutate
 * status in local component state, so a complaint could never be filed, never
 * reached another operator, and was lost on refresh. These rules are the part
 * worth testing on their own: what the API hands back, and what happens when an
 * operator moves a report to a status it does not have.
 */

/** Mongoose documents stringify badly; the client only needs the fields. */
const toPublicReport = (report) => {
  if (!report) return null;
  const plain = typeof report.toObject === 'function' ? report.toObject() : { ...report };
  return {
    id: String(plain._id ?? plain.id),
    type: plain.type,
    title: plain.title,
    submittedBy: plain.submittedBy,
    submittedAgainst: plain.submittedAgainst,
    date: plain.date,
    status: plain.status,
    priority: plain.priority,
    description: plain.description ?? '',
  };
};

class ReportService {
  constructor({ reports = reportRepository } = {}) {
    this.reports = reports;
  }

  async list() {
    const reports = await this.reports.findAll();
    return (reports || []).map(toPublicReport);
  }

  async updateStatus(id, status) {
    const updated = await this.reports.updateStatus(id, status);
    if (!updated) {
      throw new NotFoundError('Report not found', 'REPORT_NOT_FOUND');
    }
    return toPublicReport(updated);
  }
}

const service = new ReportService();
module.exports = service;
module.exports.ReportService = ReportService;
module.exports.toPublicReport = toPublicReport;
