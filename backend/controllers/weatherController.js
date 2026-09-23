const axios = require('axios');
const Tour = require('../models/tours'); // or '../models/tours' if file name is lowercase

// ✅ Get weather for all tour places (from DB)
exports.getWeatherAndTours = async (req, res) => {
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    const tours = await Tour.find(); // fetch from DB
    const results = await Promise.all(
      tours.map(async (tour) => {
        const query = `${encodeURIComponent(tour.name)},Bangladesh`;
        try {
          const response = await axios.get(
            `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${query}`
          );
          return {
            ...tour.toObject(),
            weather: response.data.current.condition.text,
            temp: response.data.current.temp_c,
          };
        } catch (err) {
          return {
            ...tour.toObject(),
            weather: 'Unavailable',
            temp: 'N/A',
          };
        }
      })
    );

    res.json({ suggestions: results });
  } catch (error) {
    console.error('❌ Weather fetch failed:', error.message);
    res.status(500).json({ error: 'Weather fetch failed' });
  }
};

// ✅ Get weather for a single district/city
exports.getSingleCityWeather = async (req, res) => {
  const apiKey = process.env.WEATHER_API_KEY;
  const city = req.params.city;

  try {
    const response = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)},Bangladesh`
    );
    res.json({
      weather: response.data.current.condition.text,
      temp: response.data.current.temp_c,
    });
  } catch (err) {
    res.json({
      weather: 'Unavailable',
      temp: 'N/A',
    });
  }
};
