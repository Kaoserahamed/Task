'use strict';

const express = require('express');
const tourController = require('../controllers/tour');
const upload = require('../config/upload');
const { uploadLimiter } = require('../middleware/rateLimit');
const {
  validateTour,
  validateTourStatus,
  validateSeatChange,
} = require('../validators/tour.validator');

/**
 * Tour routes.
 *
 * The upload and mutation endpoints used to be declared inline in index.js
 * while the read endpoints lived here, which made the API surface hard to see
 * in one place. Every tour URL now appears in this file.
 *
 * Order matters: literal paths ('/tours/approved', '/tours/filter') must be
 * declared before the '/tours/:id' wildcard, otherwise ':id' would swallow them.
 */

const router = express.Router();

// Read
router.get('/tours/approved', tourController.getApprovedTours);
router.get('/tours/filter', tourController.filterTours);
router.get('/pendingtours', tourController.getPendingTours);
router.get('/companytours/:companyId', tourController.getCompanyTours);
router.get('/suggest-tours', tourController.suggestTours);
router.get('/suggestions/:tourName', tourController.getSuggestions);
router.get('/tours/:id/seat-availability', tourController.getSeatAvailability);
router.get('/tours/:id', tourController.getTourById);
router.get('/tours', tourController.getTours);

// Write (multipart uploads; multer stores or streams the images)
router.post(
  '/tours',
  uploadLimiter,
  upload.array('images'),
  validateTour,
  tourController.createTour
);
router.put(
  '/tours/:id',
  uploadLimiter,
  upload.array('newImages'),
  validateTour,
  tourController.updateTour
);

// Counters and seats
router.patch('/tours/:id/status', validateTourStatus, tourController.updateTourStatus);
router.patch('/tours/:id/increment-view', tourController.incrementViewCount);
router.patch('/tours/:id/increment-booking', tourController.incrementBookingCount);
router.patch('/tours/:id/book-seats', validateSeatChange('seatsToBook'), tourController.bookSeats);
router.patch(
  '/tours/:id/release-seats',
  validateSeatChange('seatsToRelease'),
  tourController.releaseSeats
);

// Delete last: '/tours/:id' with the DELETE verb
router.delete('/tours/:id', tourController.deleteTour);

module.exports = router;
