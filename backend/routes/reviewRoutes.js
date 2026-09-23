// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Tour = require('../models/tours');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/reviews';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `review-${uniqueSuffix}${ext}`);
  },
});

// Set up file filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG and PNG files are allowed.'), false);
  }
};

// Initialize multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Get all reviews
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get reviews for a specific tour
router.get('/tour/:tourId', async (req, res) => {
  try {
    const { tourId } = req.params;

    // Validate if tour exists
    const tourExists = await Tour.findById(tourId);
    if (!tourExists) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const reviews = await Review.find({ tourId }).sort({ date: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new review
router.post('/', upload.array('photos', 5), async (req, res) => {
  try {
    const { tourId, userName, rating, comment } = req.body;

    // Validate required fields
    if (!tourId || !userName || !rating) {
      return res.status(400).json({ message: 'Tour ID, user name, and rating are required' });
    }

    // Validate if tour exists
    const tourExists = await Tour.findById(tourId);
    if (!tourExists) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    // Process uploaded photos
    const photos = req.files ? req.files.map((file) => `/uploads/reviews/${file.filename}`) : [];

    // Create new review
    const newReview = new Review({
      tourId,
      userName,
      rating: Number(rating),
      comment,
      photos,
    });

    const savedReview = await newReview.save();
    res.status(201).json(savedReview);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a review
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Delete associated photos
    if (review.photos && review.photos.length > 0) {
      review.photos.forEach((photoPath) => {
        const fullPath = path.join(__dirname, '../public', photoPath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      });
    }

    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
