/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isVercel: process.env.VERCEL === '1',

  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS Configuration
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      process.env.COMPANY_URL,
    ].filter(Boolean),
  },

  // External APIs
  apis: {
    weather: process.env.WEATHER_API_KEY,
    sendinblue: process.env.SENDINBLUE_API_KEY,
  },

  // File Upload (Cloudinary)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Real-time (Pusher)
  pusher: {
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
  },
};

// Validate required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  process.exit(1);
}

module.exports = config;
