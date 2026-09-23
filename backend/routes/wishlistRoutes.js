const express = require('express');
const Wishlist = require('../models/Wishlist');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// Add to Wishlist
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { tourId, email } = req.body; // Get email from request body
    console.log('Request Body:', req.body);
    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    console.log('Adding to wishlist - Email:', email, 'Tour ID:', tourId);

    // Check if already in wishlist
    const existingItem = await Wishlist.findOne({ email, tourId });
    if (existingItem) {
      return res.status(400).json({ success: false, message: 'Already in wishlist' });
    }

    const newWishlistItem = new Wishlist({ email, tourId });
    await newWishlistItem.save();

    res.status(201).json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to add to wishlist' });
  }
});

// Get User Wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get the email from the query parameter
    const { email } = req.query; // Expecting email to come from query parameter

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    console.log('Fetching wishlist for Email:', email);

    // Fetch wishlist items for the provided email
    const wishlist = await Wishlist.find({ email }).populate('tourId');

    res.json({ success: true, wishlist });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch wishlist' });
  }
});

// Remove from Wishlist
router.delete('/remove/:tourId', authMiddleware, async (req, res) => {
  try {
    const { tourId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'User email is required' });
    }

    console.log('Removing from wishlist - Email:', email, 'Tour ID:', tourId);

    const deletedItem = await Wishlist.findOneAndDelete({ email, tourId });

    if (!deletedItem) {
      return res.status(404).json({ success: false, message: 'Item not found in wishlist' });
    }

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ success: false, message: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
