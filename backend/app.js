'use strict';

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const config = require('./config/env');
const { createCorsOptions } = require('./config/cors');
const requestId = require('./middleware/requestId');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimit');
const logger = require('./utils/logger');
const adminAuth = require('./middleware/adminAuth');

const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminAuthRoutes = require('./routes/adminauth');
const chatRoutes = require('./routes/chatRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const placeRoutes = require('./routes/placeRoutes');
const tourRoutes = require('./routes/tours');
const { getSuggestions } = require('./controllers/SuggestionController');

/**
 * Build the Express application.
 *
 * The app is a factory rather than module-level side effects, which is what
 * makes it testable: `supertest(createApp())` exercises the real middleware
 * chain and the real routers without opening a port or a database connection.
 * `index.js` owns the process concerns — connecting, listening, shutting down.
 */

const UPLOAD_DIRS = [path.join(__dirname, 'uploads'), path.join(__dirname, 'public', 'uploads')];

function createApp({ log = logger } = {}) {
  const app = express();

  app.disable('x-powered-by');
  // Behind a reverse proxy (Render, Railway, Vercel, nginx) the client IP and
  // protocol live in the forwarded headers; rate limiting relies on this.
  app.set('trust proxy', 1);

  app.use(requestId);

  app.use(
    helmet({
      // The API serves JSON and images, never HTML documents: the browser-facing
      // CSP belongs to the React apps, so it is disabled here to avoid
      // interfering with /uploads responses.
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  app.use(cors(createCorsOptions()));

  app.use(express.json({ limit: config.http.jsonLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.http.jsonLimit }));

  // Runtime uploads on disk (used when Cloudinary is not configured).
  for (const dir of UPLOAD_DIRS) {
    app.use('/uploads', express.static(dir));
  }

  // ---------------------------------------------------------------------------
  // Health and smoke endpoints
  // ---------------------------------------------------------------------------
  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Backend is running!',
      environment: config.nodeEnv,
      isVercel: config.isVercel,
      timestamp: new Date().toISOString(),
    });
  });

  const databaseState = () => (mongoose.connection.readyState === 1 ? 'connected' : 'disconnected');

  // Liveness: the process is up and serving. Never touches the database.
  app.get('/health/live', (req, res) => {
    res.json({ status: 'alive', uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  // Readiness: the API can serve traffic (database reachable). A failing probe
  // answers 503 so a load balancer takes the instance out of rotation.
  app.get('/health/ready', (req, res) => {
    const database = databaseState();
    res.status(database === 'connected' ? 200 : 503).json({
      status: database === 'connected' ? 'ready' : 'degraded',
      database,
      timestamp: new Date().toISOString(),
    });
  });

  // Kept for existing uptime checks and the front-ends' connectivity banner.
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      database: databaseState(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working' });
  });

  // ---------------------------------------------------------------------------
  // Feature routers
  // ---------------------------------------------------------------------------
  // Credential endpoints are rate limited before they ever reach a controller.
  app.use('/user/auth', authLimiter, authRoutes);
  app.use('/company/auth', authLimiter, companyRoutes);
  app.use('/api', apiLimiter);

  app.use('/api', companyRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/reviews', reviewRoutes);
  app.use('/api', weatherRoutes);
  app.use('/api', placeRoutes);
  app.get('/Suggestion/:tourName', getSuggestions);

  // Mounted twice on purpose: '/api' is the documented surface, the extra
  // '/api/tours' mount preserves the legacy path some clients still call.
  app.use('/api', tourRoutes);
  app.use('/api/tours', tourRoutes);

  app.use('/api/admin', adminAuthRoutes);
  app.use('/api/admin', adminAuth, adminAuthRoutes);

  // Seeding creates accounts and demo data with known passwords, so it is off
  // unless an operator explicitly opts in (SEED_ENABLED=true).
  if (config.seed.enabled) {
    log.warn('seed endpoints are ENABLED — never enable them on a public deployment');
    app.use('/api', require('./routes/seedRoutes'));
    app.use('/api/demo', require('./routes/demoAccounts'));
  }

  // Anything unmatched is a 404 in the same envelope as every other failure.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
