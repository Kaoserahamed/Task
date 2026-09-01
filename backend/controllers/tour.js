const Tour = require('../models/tours');

const fs = require('fs');
const socketIO = require('../socket');

exports.createTour = async (req, res) => {
  try {
    // Process the uploaded data
    let tourData = {
      ...req.body,
      destinations: JSON.parse(req.body.destinations),
      meals: JSON.parse(req.body.meals),
      transportation: JSON.parse(req.body.transportation),
      includes: JSON.parse(req.body.includes),
      excludes: JSON.parse(req.body.excludes),
      // ✅ Add weather parsing
      weather: JSON.parse(req.body.weather || '{}'),
      companyId: req.body.companyId,
      companyName: req.body.companyName  // Make sure this is explicitly set
    };
    console.log("new name: "+req.body.companyName);
    console.log("Tour data before saving:", tourData); // Debug log

    // Process packageCategories
    if (req.body.packageCategories) {
      if (typeof req.body.packageCategories === 'string') {
        try {
          tourData.packageCategories = JSON.parse(req.body.packageCategories);
        } catch (e) {
          tourData.packageCategories = req.body.packageCategories
            .split(',')
            .map(cat => cat.trim().toLowerCase());

        }
      }
      if (!Array.isArray(tourData.packageCategories)) {
        tourData.packageCategories = [tourData.packageCategories];
      }
    }

    // Add image paths/URLs to the tour data
    if (req.files) {
      tourData.images = req.files.map(file => {
        // Cloudinary returns 'path' as URL, local storage uses 'path' as file path
        return file.path || file.url;
      });
    }

    // Parse duration values properly
    const duration = JSON.parse(req.body.duration);
    tourData.duration = {
      days: parseInt(duration.days) || 0,
      nights: parseInt(duration.nights) || 0
    };

    // Convert other string numbers to actual numbers
    tourData.price = Number(tourData.price) || 0;
    if (tourData.maxGroupSize) tourData.maxGroupSize = parseInt(tourData.maxGroupSize) || 0;
    if (tourData.availableSeats) tourData.availableSeats = parseInt(tourData.availableSeats) || 0;

    // ✅ Parse and validate weather temperature
    if (tourData.weather && tourData.weather.temp) {
      tourData.weather.temp = Number(tourData.weather.temp) || null;
    }

    // Parse tourType if it exists
    if (req.body.tourType) {
      tourData.tourType = JSON.parse(req.body.tourType);
    }

    // ✅ Debug log to check weather data
    console.log('Weather data being saved:', tourData.weather);

    // Create new tour
    const newTour = new Tour(tourData);
    
    await newTour.validate();
    const savedTour = await newTour.save();
    
    res.status(201).json({
      success: true,
      message: 'Tour created successfully',
      tour: savedTour
    });
    const io=require('../socket').getIO();
    io.emit()
  } catch (error) {
    console.error('Error creating tour:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create tour'
    });
  }
};

exports.getCompanyTours = async (req, res) => {
  try {
    const { companyId } = req.params;
    console.log("Fetching tours for company:", companyId);
    
    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'Company ID is required'
      });
    }

    const tours = await Tour.find({ companyId });
    
    res.json({
      success: true,
      tours
    });
  } catch (error) {
    console.error('Error fetching company tours:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company tours'
    });
  }
};

// Get all tours
exports.getTours = async (req, res) => {
  try {
    const tours = await Tour.find();
    res.json({
      success: true,
      tours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tours'
    });
  }
};

exports.getApprovedTours = async (req, res) => {
  try {
    console.log('Fetching approved tours...'); // Debug log
    
    const tours = await Tour.find({ status: 'approved' });
    console.log('Found tours:', tours.length); // Debug log
    
    if (!tours || tours.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No approved tours found',
        tours: []
      });
    }

    res.json({
      success: true,
      count: tours.length,
      tours
    });
  } catch (error) {
    console.error('Error fetching approved tours:', error); // Debug log
    res.status(500).json({
      success: false,
      error: 'Failed to fetch approved tours',
      message: error.message
    });
  }
};

// Get single tour
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }
    res.json({
      success: true,
      tour
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tour'
    });
  }
};

// Delete tour
exports.deleteTour = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    // Delete associated images
    tour.images.forEach(imagePath => {
      try {
        fs.unlinkSync(imagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    });

    await Tour.findByIdAndDelete(req.params.id);
    res.json({
      success: true,
      message: 'Tour deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete tour'
    });
  }
};

// Update tour status
exports.updateTourStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, review } = req.body;

    console.log('Received data:', { status, review }); // Debug log

    // Validate status
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value'
      });
    }

    // Create update object
    const updateData = { 
      status: status
    };

    // Add review if status is rejected
    if (status === 'rejected') {
      updateData.review = review || 'No review provided';
    }

    console.log('Update data:', updateData); // Debug log

    const tour = await Tour.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    console.log('Updated tour:', tour); // Debug log

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    res.json({
      success: true,
      message: `Tour status updated to ${status}`,
      tour
    });

  } catch (error) {
    console.error('Error updating tour status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tour status'
    });
  }
};

exports.updateTour = async (req, res) => {
  try {
    const tourId = req.params.id;
    const tourData = { ...req.body };

    // Parse duration properly
    if (typeof req.body.duration === 'string') {
      tourData.duration = JSON.parse(req.body.duration);
    }
    
    tourData.duration = {
      days: Number(tourData.duration.days) || 0,
      nights: Number(tourData.duration.nights) || 0
    };

    // Handle existing and new images
    const existingImages = JSON.parse(req.body.existingImages || '[]');
    const newImagePaths = req.files ? req.files.map(file => file.path) : [];
    tourData.images = [...existingImages, ...newImagePaths];

    // Parse JSON strings back to objects
    tourData.destinations = JSON.parse(req.body.destinations);
    tourData.meals = JSON.parse(req.body.meals);
    tourData.transportation = JSON.parse(req.body.transportation);
    tourData.includes = JSON.parse(req.body.includes);
    tourData.excludes = JSON.parse(req.body.excludes);
    
    // ✅ Add weather parsing for updates
    if (req.body.weather) {
      tourData.weather = JSON.parse(req.body.weather);
      if (tourData.weather.temp) {
        tourData.weather.temp = Number(tourData.weather.temp) || null;
      }
    }
    
    tourData.status = 'draft';

    // Safely convert numeric fields
    tourData.price = parseFloat(tourData.price) || 0;
    tourData.maxGroupSize = parseInt(tourData.maxGroupSize) || 0;
    tourData.availableSeats = parseInt(tourData.availableSeats) || 0;

    // Normalize packageCategories like in createTour
    if (req.body.packageCategories) {
      if (typeof req.body.packageCategories === 'string') {
        try {
          tourData.packageCategories = JSON.parse(req.body.packageCategories);
        } catch (e) {
          tourData.packageCategories = req.body.packageCategories
            .split(',')
            .map(cat => cat.trim().toLowerCase());
        }
      }
      if (!Array.isArray(tourData.packageCategories)) {
        tourData.packageCategories = [tourData.packageCategories];
      }
    }

    // Remove fields that shouldn't be updated directly
    delete tourData.existingImages;
    delete tourData.newImages;

    const updatedTour = await Tour.findByIdAndUpdate(
      tourId,
      tourData,
      { new: true, runValidators: true }
    );

    if (!updatedTour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    res.json({
      success: true,
      message: 'Tour updated successfully',
      tour: updatedTour
    });
  } catch (error) {
    console.error('Error updating tour:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update tour'
    });
  }
};

exports.filterTours = async (req, res) => {
  try {
    const { category, tourType } = req.query;
    console.log('Received filter request:', { category, tourType });

    let query = {};

    if (category && category !== 'all') {
      if (category === 'custom') {
        query.customCategory = { $exists: true, $ne: '' };
      } else {
        query.packageCategories = category;
      }
    }

    if (tourType && tourType !== 'all') {
      query[`tourType.${tourType}`] = true;
    }

    const tours = await Tour.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      tours
    });
  } catch (error) {
    console.error('Filter endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch filtered tours'
    });
  }
};

exports.getPendingTours = async (req, res) => {
  try {
    const tours = await Tour.find({ status: 'pending' });
    res.json({
      success: true,
      tours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending tours'
    });
  }
};

// Kaoser

// Increment views count
// In controllers/tour.js
// Increment views count
exports.incrementViewCount = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { $inc: { 'popularity.views': 1 } },  // ✅ Correct nested path
      { new: true }
    );

    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }

    res.json({
      success: true,
      message: 'View count incremented',
      views: tour.popularity.views  // ✅ Correct path for response
    });
  } catch (error) {
    console.error('Increment error:', error);
    res.status(500).json({ success: false, error: 'Failed to increment view count' });
  }
};
//
exports.incrementBookingCount = async (req, res) => {
  try {
    const tour = await Tour.findByIdAndUpdate(
      req.params.id,
      { $inc: { 'popularity.bookings': 1 } },
      { new: true }
    );

    if (!tour) {
      return res.status(404).json({ success: false, error: 'Tour not found' });
    }

    res.json({
      success: true,
      message: 'Booking count incremented',
      bookings: tour.popularity.bookings
    });
  } catch (error) {
    console.error('Increment booking error:', error);
    res.status(500).json({ success: false, error: 'Failed to increment booking count' });
  }
};

exports.bookSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const { seatsToBook } = req.body;

    if (!seatsToBook || seatsToBook < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid number of seats to book'
      });
    }

    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    if (tour.availableSeats < seatsToBook) {
      return res.status(400).json({
        success: false,
        error: `Only ${tour.availableSeats} seat${tour.availableSeats !== 1 ? 's' : ''} available`,
        availableSeats: tour.availableSeats
      });
    }

    tour.availableSeats -= seatsToBook;
    tour.popularity.bookings += 1;
    await tour.save();

    res.json({
      success: true,
      message: 'Seats booked successfully',
      tour,
      seatsBooked: seatsToBook,
      remainingSeats: tour.availableSeats
    });

  } catch (error) {
    console.error('Error booking seats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while booking seats',
      details: error.message
    });
  }
};
exports.releaseSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const { seatsToRelease } = req.body;

    if (!seatsToRelease || seatsToRelease < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid number of seats to release'
      });
    }

    const tour = await Tour.findById(id);
    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    tour.availableSeats = Math.min(
      tour.availableSeats + seatsToRelease,
      tour.maxGroupSize || tour.availableSeats + seatsToRelease
    );

    if (tour.popularity.bookings > 0) {
      tour.popularity.bookings -= 1;
    }

    await tour.save();

    res.json({
      success: true,
      message: 'Seats released successfully',
      tour,
      seatsReleased: seatsToRelease,
      availableSeats: tour.availableSeats
    });

  } catch (error) {
    console.error('Error releasing seats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error while releasing seats'
    });
  }
};
exports.getSeatAvailability = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: 'Tour not found'
      });
    }

    res.json({
      success: true,
      tourId: tour._id,
      tourName: tour.name,
      maxGroupSize: tour.maxGroupSize || null,
      availableSeats: tour.availableSeats,
      totalBookings: tour.popularity.bookings
    });

  } catch (error) {
    console.error('Error getting seat availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get seat availability'
    });
  }
};

// Suggest tours
exports.suggestTours = async (req, res) => {
  try {
    const { destinations } = req.query;
    if (!destinations) {
      return res.status(400).json({
        success: false,
        error: 'Destinations parameter is required'
      });
    }

    const destinationList = Array.isArray(destinations) ? destinations : [destinations];
    const tours = await Tour.find({
      'destinations.name': { $in: destinationList },
      status: 'approved'
    });

    res.json({
      success: true,
      tours
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to suggest tours'
    });
  }
};

// Get suggestions for a tour
exports.getSuggestions = async (req, res) => {
  try {
    const { tourName } = req.params;
    
    // Find tours with similar names
    const suggestions = await Tour.find({
      name: { $regex: tourName, $options: 'i' },
      status: 'approved'
    }).limit(5);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get suggestions'
    });
  }
};
