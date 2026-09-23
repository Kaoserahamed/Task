const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Basic booking info (keeping your existing structure)
  email: {
    type: String,
    required: true,
  },
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
  },

  // Enhanced booking details
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional to work with your existing system
  },

  // Contact Information from form
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },

  // Booking Details
  travelers: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  startDate: {
    type: Date,
    required: false,
  },

  // Special Requirements
  specialRequests: {
    type: String,
    default: '',
  },

  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['credit-card', 'paypal', 'bank-transfer'],
    required: true,
    default: 'credit-card',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed',
  },

  // Credit Card Info (storing only safe data)
  cardHolder: {
    type: String,
  },
  cardLastFour: {
    type: String,
  },

  // Booking Status
  bookingStatus: {
    type: String,
    enum: ['confirmed', 'pending', 'cancelled'],
    default: 'confirmed',
  },

  // Total Amount
  totalAmount: {
    type: Number,
    required: false,
  },

  // Booking Reference
  bookingReference: {
    type: String,
    unique: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate booking reference before saving
bookingSchema.pre('save', function (next) {
  if (!this.bookingReference) {
    this.bookingReference =
      'BK' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

const Booking = mongoose.model('Booking', bookingSchema);
module.exports = Booking;
