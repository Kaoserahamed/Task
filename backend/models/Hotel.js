const mongoose = require('mongoose');
const hotelSchema = new mongoose.Schema({
  name: String,
  location: String,
  exactLocation: String,
  image: String,
  rating: Number,
  contact: String,
  description: String,
});

module.exports = mongoose.model('Hotel', hotelSchema);
