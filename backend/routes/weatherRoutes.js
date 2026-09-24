const express = require('express');
const router = express.Router();
const { getSingleCityWeather } = require('../controllers/weatherController');

router.get('/weather/:city', getSingleCityWeather); // Any district

module.exports = router;
