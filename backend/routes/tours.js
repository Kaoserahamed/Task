const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const tourController = require('../controllers/tour');


// Tour routes
router.get('/tours/approved', tourController.getApprovedTours);
router.get('/tours/filter', tourController.filterTours);
router.get('/pendingtours', tourController.getPendingTours);
router.get('/tours/:id', tourController.getTourById);
router.get('/tours', tourController.getTours);
router.get('/companytours/:companyId', tourController.getCompanyTours);
router.delete('/tours/:id', tourController.deleteTour);
router.patch('/tours/:id/status', tourController.updateTourStatus);


// Suggest tours endpoint
router.get('/suggest-tours', tourController.suggestTours);

router.get('/suggestions/:tourName', tourController.getSuggestions);

module.exports = router;