'use strict';

const asyncHandler = require('../middleware/asyncHandler');
const reportService = require('../services/report.service');

/**
 * Admin report triage.
 *
 * Validation happens in the router (`validateRequest`) and the business rules in
 * the service, so both handlers are one call: no try/catch, because
 * `asyncHandler` forwards a rejection to the central error handler and a
 * `NotFoundError` becomes the same envelope every other failure uses.
 */

exports.list = asyncHandler(async (_req, res) => {
  const reports = await reportService.list();
  res.json({ success: true, reports });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const report = await reportService.updateStatus(req.params.id, req.body.status);
  res.json({ success: true, report });
});
