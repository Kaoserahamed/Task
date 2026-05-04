require('dotenv').config();

const express = require('express');
const mongoose = require("mongoose");
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const config = require('./config/env');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const errorHandler = require('./middleware/errorHandler');
const toursRoutes = require('./routes/tours');
const tourController = require('./controllers/tour');
const getSuggestions  = require('./controllers/SuggestionController');
const reviewRoutes = require('./routes/reviewRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminAuth = require('./middleware/adminAuth');
const weatherRoute = require('./routes/weatherRoutes'); 
//Admin Section
const adminAuthRoutes = require('./routes/adminauth');

const app = express();
const server = http.createServer(app);
const PORT = config.port;

// Initialize socket.io only in non-serverless environment
let socketInit;
if (!config.isVercel) {
  socketInit = require('./socket').init(server);
}

// Updated CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || config.cors.origins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
// Routes
app.use('/company/auth', companyRoutes);
app.use('/api', companyRoutes); // Add this line for company routes
app.use('/user/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/Suggestion/:tourName',getSuggestions.getSuggestions);
app.use('/api/bookings', bookingRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/reviews', reviewRoutes);
// Socket.IO setup


// Add this test route at the top of your routes
app.get('/api/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'API is working' });
});

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

exports.upload = upload;
app.post('/api/tours', upload.array('images'), tourController.createTour);
  // Update tour
app.put('/api/tours/:id', upload.array('newImages'), tourController.updateTour);
app.use('/api', toursRoutes);
app.use('/api', require('./routes/weatherRoutes'));

// Admin Routes
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminAuth, adminAuthRoutes);

// Get all tours

// Get single tour


// Delete tour

// Update tour status


// Update tour

// Update the filter endpoint
// app.get('/api/tours/filter', async (req, res) => {
//   try {
//     const { category, tourType } = req.query;
//     console.log('Received filter request:', { category, tourType }); // Debug log

//     let query = {};

//     if (category && category !== 'all') {
//       if (category === 'custom') {
//         query.customCategory = { $exists: true, $ne: '' };
//       } else {
//         query.packageCategories = category;
//       }
//     }

//     if (tourType && tourType !== 'all') {
//       query[`tourType.${tourType}`] = true;
//     }

//     console.log('MongoDB query:', query); // Debug log

//     const tours = await Tour.find(query).sort({ createdAt: -1 });
//     console.log('Found tours:', tours.length);

//     res.json({
//       success: true,
//       tours
//     });
//   } catch (error) {
//     console.error('Filter endpoint error:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Failed to fetch filtered tours',
//       details: error.message
//     });
//   }
// });
app.patch('/api/tours/:id/increment-view', tourController.incrementViewCount);
app.patch('/api/tours/:id/increment-booking', tourController.incrementBookingCount);
app.patch('/api/tours/:id/book-seats', tourController.bookSeats);

// Get seat availability
app.get('/api/tours/:id/seat-availability', tourController.getSeatAvailability);

// Release seats (for cancellations)
app.patch('/api/tours/:id/release-seats', tourController.releaseSeats);


app.use(errorHandler);
// ✅ Make sure this matches your filename

app.use('/api', weatherRoute); // ✅ using a valid router

// Routes
const placeRoutes = require('./routes/placeRoutes');
app.use('/api', placeRoutes);

const tourRoutes = require('./routes/tours');
app.use('/api/tours', tourRoutes);

const { recommendTours } = require('./utils/tourRecommender');

// Example: selected destinations by user
const selected = ['Coxs Bazar', 'Saint Martin'];

recommendTours(selected, (recommended) => {
  console.log('📌 Recommended Tours:', recommended);
});


app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Connect to MongoDB
mongoose.connect(config.mongodb.uri)
  .then(result => {
    console.log('Database connected successfully');
    // Only start server if not in Vercel serverless environment
    if (!config.isVercel) {
      server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${config.nodeEnv}`);
        console.log('Socket.IO server initialized');
      });
    }
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

// Export the Express app for Vercel
module.exports = app;


