const express = require('express');
const router = express.Router();
const Tour = require('../models/tours');
const Company = require('../models/company');
const bcrypt = require('bcryptjs');

// Seed demo tour packages - GET endpoint for easy browser testing
router.get('/seed-tours', async (req, res) => {
  try {
    // Find or create demo company
    let demoCompany = await Company.findOne({ email: 'company@demo.com' });
    
    if (!demoCompany) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('demo123', salt);
      
      demoCompany = await Company.create({
        name: 'Demo Travel Company',
        email: 'company@demo.com',
        password: hashedPassword,
        description: 'A demo travel company showcasing amazing tour packages across Bangladesh',
        phone: '+880 1234-567890',
        website: 'https://demotravels.com',
        address: '123 Demo Street, Dhaka, Bangladesh',
        isVerified: true,
        verificationStatus: 'approved'
      });
    }

    // Delete existing demo tours
    await Tour.deleteMany({ companyId: demoCompany._id });

    const sampleTours = [
      {
        name: 'Amazing Cox\'s Bazar Beach Tour',
        packageCategories: ['Beach', 'Relaxation'],
        tourType: { single: true, group: true },
        duration: { days: 3, nights: 2 },
        startDate: new Date('2026-10-01'),
        endDate: new Date('2026-10-03'),
        meals: { breakfast: true, lunch: true, dinner: true },
        transportation: { type: 'AC Bus', details: 'Comfortable AC bus with reclining seats' },
        tourGuide: true,
        price: 8500,
        maxGroupSize: 40,
        availableSeats: 40,
        destinations: [
          { name: 'Cox\'s Bazar Beach', description: 'World\'s longest natural sea beach', stayDuration: '2 nights' },
          { name: 'Inani Beach', description: 'Pristine beach with coral stones', stayDuration: '4 hours' },
          { name: 'Himchari National Park', description: 'Scenic waterfalls and hills', stayDuration: '3 hours' }
        ],
        includes: ['Hotel accommodation', 'All meals', 'AC transportation', 'Tour guide', 'Entry fees', 'Insurance'],
        excludes: ['Personal expenses', 'Water sports', 'Snacks', 'Tips'],
        specialNote: 'Bring walking shoes, sunscreen, and swimwear.',
        cancellationPolicy: 'Free cancellation 7 days before. 50% refund 3-7 days.',
        status: 'approved',
        companyId: demoCompany._id,
        companyName: demoCompany.name,
        images: ['uploads/default-beach.jpg', 'uploads/default-nature.jpg'],
        weather: { city: 'Cox\'s Bazar', condition: 'Sunny', temp: 28 }
      },
      {
        name: 'Sundarbans Mangrove Adventure',
        packageCategories: ['Adventure', 'Wildlife', 'Nature'],
        tourType: { single: false, group: true },
        duration: { days: 4, nights: 3 },
        startDate: new Date('2026-11-15'),
        endDate: new Date('2026-11-18'),
        meals: { breakfast: true, lunch: true, dinner: true },
        transportation: { type: 'Boat', details: 'Traditional wooden boat' },
        tourGuide: true,
        price: 12000,
        maxGroupSize: 20,
        availableSeats: 20,
        destinations: [
          { name: 'Sundarbans National Park', description: 'UNESCO World Heritage Site', stayDuration: '3 nights' },
          { name: 'Kotka Beach', description: 'Secluded beach in mangrove forest', stayDuration: '4 hours' }
        ],
        includes: ['Boat accommodation', 'All meals', 'Forest permits', 'Guide', 'Safety equipment'],
        excludes: ['Personal expenses', 'Camera fees', 'Alcohol', 'Travel to terminal'],
        specialNote: 'Adventure tour with basic amenities. Bring mosquito repellent.',
        cancellationPolicy: 'Non-refundable within 15 days due to permits.',
        status: 'approved',
        companyId: demoCompany._id,
        companyName: demoCompany.name,
        images: ['uploads/default-wildlife.jpg'],
        weather: { city: 'Khulna', condition: 'Partly Cloudy', temp: 26 }
      },
      {
        name: 'Sajek Valley Hill Trek',
        packageCategories: ['Mountain', 'Adventure', 'Trekking'],
        tourType: { single: true, group: true },
        duration: { days: 2, nights: 1 },
        startDate: new Date('2026-09-20'),
        endDate: new Date('2026-09-21'),
        meals: { breakfast: true, lunch: true, dinner: true },
        transportation: { type: 'Jeep', details: 'Local 4WD jeep for hilly terrain' },
        tourGuide: true,
        price: 6500,
        maxGroupSize: 15,
        availableSeats: 15,
        destinations: [
          { name: 'Sajek Valley', description: 'Highest peak with cloud views', stayDuration: '1 night' },
          { name: 'Konglak Hill', description: 'Panoramic viewpoint', stayDuration: '2 hours' }
        ],
        includes: ['Cottage accommodation', 'All meals', 'Jeep transport', 'Local guide', 'Bonfire'],
        excludes: ['Dhaka transport', 'Personal expenses', 'Photography permits'],
        specialNote: 'Challenging roads. Not for motion sickness patients.',
        cancellationPolicy: 'Full refund 5+ days before.',
        status: 'approved',
        companyId: demoCompany._id,
        companyName: demoCompany.name,
        images: ['uploads/default-mountain.jpg'],
        weather: { city: 'Rangamati', condition: 'Misty', temp: 22 }
      },
      {
        name: 'Historical Dhaka City Tour',
        packageCategories: ['Historical', 'Cultural', 'City'],
        tourType: { single: true, group: true },
        duration: { days: 1, nights: 0 },
        meals: { breakfast: false, lunch: true, dinner: false },
        transportation: { type: 'AC Car', details: 'Private AC car with driver' },
        tourGuide: true,
        price: 2500,
        destinations: [
          { name: 'Lalbagh Fort', description: 'Mughal fort from 17th century', stayDuration: '1.5 hours' },
          { name: 'Ahsan Manzil', description: 'Pink Palace', stayDuration: '1 hour' },
          { name: 'Star Mosque', description: 'Star-studded mosaic mosque', stayDuration: '30 minutes' }
        ],
        includes: ['AC car', 'Guide', 'Lunch', 'Entry fees', 'Water'],
        excludes: ['Breakfast/dinner', 'Shopping', 'Boat ride'],
        specialNote: 'Comfortable shoes recommended. Modest dress for religious sites.',
        cancellationPolicy: 'Free cancellation 24 hours before.',
        status: 'approved',
        companyId: demoCompany._id,
        companyName: demoCompany.name,
        images: ['uploads/default-historical.jpg'],
        weather: { city: 'Dhaka', condition: 'Warm', temp: 32 }
      },
      {
        name: 'Sylhet Tea Garden & Waterfall Tour',
        packageCategories: ['Nature', 'Relaxation', 'Photography'],
        tourType: { single: true, group: true },
        duration: { days: 3, nights: 2 },
        startDate: new Date('2026-12-10'),
        endDate: new Date('2026-12-12'),
        meals: { breakfast: true, lunch: true, dinner: true },
        transportation: { type: 'AC Minibus', details: 'Comfortable AC minibus' },
        tourGuide: true,
        price: 9500,
        maxGroupSize: 25,
        availableSeats: 25,
        destinations: [
          { name: 'Jaflong', description: 'Crystal clear Piyain River', stayDuration: '4 hours' },
          { name: 'Ratargul Swamp Forest', description: 'Amazon of Bangladesh', stayDuration: '3 hours' },
          { name: 'Madhabkunda Waterfall', description: 'Largest waterfall', stayDuration: '3 hours' }
        ],
        includes: ['Hotel accommodation', 'All meals', 'AC transport', 'Guide', 'Boat rides', 'Entry fees'],
        excludes: ['Personal expenses', 'Additional boat rides', 'Shopping'],
        specialNote: 'Best season: October to March.',
        cancellationPolicy: 'Full refund 10+ days before.',
        status: 'approved',
        companyId: demoCompany._id,
        companyName: demoCompany.name,
        images: ['uploads/default-nature.jpg'],
        weather: { city: 'Sylhet', condition: 'Pleasant', temp: 24 }
      }
    ];

    const createdTours = await Tour.insertMany(sampleTours);

    res.json({
      success: true,
      message: `Successfully created ${createdTours.length} demo tour packages`,
      company: {
        name: demoCompany.name,
        email: demoCompany.email
      },
      tours: createdTours.map(tour => ({
        id: tour._id,
        name: tour.name,
        price: tour.price,
        status: tour.status
      }))
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed tour packages',
      error: error.message
    });
  }
});

module.exports = router;
