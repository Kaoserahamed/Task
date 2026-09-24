const express = require('express');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();
const socketIO = require('../socket');

const logger = require('../utils/logger');

// Get all bookings for a specific tour (for tour companies)
router.get('/tour/:tourId', authMiddleware, async (req, res) => {
  try {
    const { tourId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate tourId
    if (!tourId || tourId === 'undefined' || !mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing tour ID',
      });
    }

    logger.info('Fetching bookings for tourId:', tourId); // Debug log

    const bookings = await Booking.find({ tourId: new mongoose.Types.ObjectId(tourId) })
      .populate('tourId', 'title location price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments({ tourId: new mongoose.Types.ObjectId(tourId) });

    // Format booking data for tour company view
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      bookingReference: booking.bookingReference,
      customerName: `${booking.firstName} ${booking.lastName}`,
      email: booking.email,
      phone: booking.phone,
      address: `${booking.address}, ${booking.city}, ${booking.country}`,
      travelers: booking.travelers,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      bookingStatus: booking.bookingStatus,
      specialRequests: booking.specialRequests,
      bookingDate: booking.createdAt,
      tourInfo: booking.tourId,
    }));

    res.json({
      success: true,
      bookings: formattedBookings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    logger.error('Error fetching tour bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Add Booking (enhanced version with better validation)
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const {
      tourId,
      email,
      firstName,
      lastName,
      phone,
      address,
      city,
      country,
      travelers,
      startDate,
      specialRequests,
      paymentMethod,
      cardHolder,
      cardNumber,
      totalAmount,
    } = req.body;

    // Validate required fields
    if (!email || !tourId) {
      return res.status(400).json({
        success: false,
        message: 'Email and tour ID are required',
      });
    }

    // Validate tourId
    if (!mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid tour ID format',
      });
    }

    logger.info('Creating booking for tourId:', tourId); // Debug log

    // Check if tour is already booked by this user
    const existing = await Booking.findOne({
      email,
      tourId: new mongoose.Types.ObjectId(tourId),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Tour already booked',
      });
    }

    // Create booking with enhanced data
    const bookingData = {
      email,
      tourId: new mongoose.Types.ObjectId(tourId),
      firstName: firstName || 'Unknown',
      lastName: lastName || 'User',
      phone: phone || '',
      address: address || '',
      city: city || '',
      country: country || '',
      travelers: travelers || 1,
      startDate: startDate || new Date(),
      specialRequests: specialRequests || '',
      paymentMethod: paymentMethod || 'credit-card',
      cardHolder: cardHolder || '',
      cardLastFour: cardNumber ? cardNumber.slice(-4) : null,
      totalAmount: totalAmount || 0,
      userId: req.userId || null,
    };

    const booking = new Booking(bookingData);
    await booking.save();

    // Get the socket instance and emit the event
    const io = socketIO.getIO();
    if (io) {
      // Emit booking event
      io.emit('book', {
        action: 'krlam',
        booking,
        tourId,
        availableSeats: booking.tourId.availableSeats,
      });

      // Emit seats update event
      io.emit('seatsUpdated', {
        tourId,
        availableSeats: booking.tourId.availableSeats,
        travelers: booking.travelers,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Tour booked successfully',
      booking: {
        ...booking.toObject(),
        bookingReference: booking.bookingReference,
      },
    });
  } catch (error) {
    logger.error('Error adding booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book tour',
      error: error.message,
    });
  }
});

// Get Bookings (enhanced version)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const bookings = await Booking.find({ email }).populate('tourId');
    const today = new Date();

    const upcoming = [];
    const completed = [];

    bookings.forEach((booking) => {
      const { tourId } = booking;
      if (!tourId || !tourId.startDate) return;

      const startDate = new Date(tourId.startDate);
      const bookingData = {
        ...tourId.toObject(),
        bookingDetails: {
          bookingReference: booking.bookingReference,
          travelers: booking.travelers,
          totalAmount: booking.totalAmount,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          createdAt: booking.createdAt,
          specialRequests: booking.specialRequests,
        },
      };

      if (startDate >= today) {
        upcoming.push(bookingData);
      } else {
        completed.push(bookingData);
      }
    });

    res.json({ success: true, upcoming, completed });
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
});

// Get booking count for a specific tour
router.get('/tour/:tourId/count', authMiddleware, async (req, res) => {
  try {
    const { tourId } = req.params;

    // Validate tourId
    if (!tourId || tourId === 'undefined' || !mongoose.Types.ObjectId.isValid(tourId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing tour ID',
      });
    }

    const count = await Booking.countDocuments({
      tourId: new mongoose.Types.ObjectId(tourId),
    });

    const totalRevenue = await Booking.aggregate([
      { $match: { tourId: new mongoose.Types.ObjectId(tourId) } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);

    res.json({
      success: true,
      count,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    logger.error('Error fetching booking count:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// Get all bookings (for admin dashboard)
router.get('/all', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.json({ success: true, bookings });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch all bookings', error: error.message });
  }
});

module.exports = router;
