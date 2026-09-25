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

hotelSchema.index({ location: 1, rating: -1 });

module.exports = mongoose.model('Hotel', hotelSchema);
