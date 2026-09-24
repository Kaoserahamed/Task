const Restaurant = require('../models/Restaurant');
const Hotel = require('../models/Hotel');

exports.getRestaurants = async (req, res) => {
  try {
    const { location } = req.query;
    const filter = location ? { location } : {};
    const restaurants = await Restaurant.find(filter);
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
};

exports.getHotels = async (req, res) => {
  try {
    const { location } = req.query;
    const filter = location ? { location } : {};
    const hotels = await Hotel.find(filter);
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch hotels' });
  }
};
