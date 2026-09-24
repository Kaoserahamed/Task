const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Tour = require('../models/tours');

const logger = require('../utils/logger');

// GET /api/dashboard/stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    logger.info('I am currently inside dashboard stat backend');
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);

    // 1. Active Packages (tours with startDate >= today and status 'approved')
    const activePackages = await Tour.countDocuments({
      startDate: { $gte: startOfToday },
      status: 'approved',
    });

    // 2. Completed Tours (tours with endDate < today and status 'approved')
    const completedTours = await Tour.countDocuments({
      endDate: { $lt: startOfToday },
      status: 'approved',
    });

    // 3. Monthly Revenue (sum of totalAmount for bookings in last 30 days, grouped by month)
    const monthlyRevenueAgg = await Booking.aggregate([
      { $match: { createdAt: { $gte: last30Days } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          total: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);
    // Format for chart.js
    const monthlyRevenue = {
      labels: monthlyRevenueAgg.map((item) => `${item._id.month}/${item._id.year}`),
      data: monthlyRevenueAgg.map((item) => item.total),
    };

    // 4. New Bookings (count of bookings in last 7 days)
    const newBookings = await Booking.countDocuments({ createdAt: { $gte: last7Days } });

    // 5. Total Unique Customers (unique emails in bookings)
    const uniqueCustomers = await Booking.distinct('email');
    const totalCustomers = uniqueCustomers.length;

    // 6. Average Ratings (average of popularity.rating.average from all approved tours)
    const ratingsAgg = await Tour.aggregate([
      { $match: { status: 'approved', 'popularity.rating.count': { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$popularity.rating.average' },
          count: { $sum: 1 },
        },
      },
    ]);
    const customerRating = ratingsAgg[0]?.avgRating || 0;

    // 7. Popular Packages (top 3 tours by popularity.bookings)
    const popularPackages = await Tour.find({ status: 'approved' })
      .sort({ 'popularity.bookings': -1 })
      .limit(3)
      .select('name popularity.bookings popularity.rating.average price');

    // 8. Recent Feedback (top 3 tours with most recent ratings, if available)
    // If you have a Review model, you can aggregate from there. For now, use tour ratings.
    const recentFeedback = await Tour.find({
      status: 'approved',
      'popularity.rating.count': { $gt: 0 },
    })
      .sort({ 'popularity.rating.count': -1 })
      .limit(3)
      .select('name popularity.rating.average popularity.rating.count');

    res.json({
      success: true,
      stats: {
        activePackages,
        completedTours,
        monthlyRevenue,
        newBookings,
        totalCustomers,
        customerRating: customerRating.toFixed(2),
        popularPackages,
        recentFeedback,
      },
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch dashboard stats', error: error.message });
  }
});

module.exports = router;
