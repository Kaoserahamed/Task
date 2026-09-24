const express = require('express');
const router = express.Router();
const { getHotels, getRestaurants } = require('../controllers/placeController');

router.get('/hotels', getHotels);
router.get('/restaurants', getRestaurants);

module.exports = router;
