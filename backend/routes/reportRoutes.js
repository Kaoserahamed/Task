'use strict';

const express = require('express');

const adminAuth = require('../middleware/adminAuth');
const validateRequest = require('../middleware/validateRequest');
const reportController = require('../controllers/report.controller');
const { reportIdSchema, reportStatusSchema } = require('../validators/report.validator');

const router = express.Router();

/**
 * Reports are an administrative queue: only an admin token may read or triage
 * them, so `adminAuth` guards the whole router rather than individual handlers.
 * `validateRequest` runs after it, which keeps an unauthenticated caller from
 * getting schema feedback that reveals the payload shape.
 */
router.get('/', adminAuth, reportController.list);
router.patch(
  '/:id/status',
  adminAuth,
  validateRequest(reportIdSchema, 'params'),
  validateRequest(reportStatusSchema, 'body'),
  reportController.updateStatus
);

module.exports = router;
