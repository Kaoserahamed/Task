const mongoose = require('mongoose');
const restaurantSchema = new mongoose.Schema({
  name: String,
  location: String,
  exactLocation: String,
  image: String,
  rating: Number,
  contact: String,
  description: String,
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
